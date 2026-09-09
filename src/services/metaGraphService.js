const axios = require('axios');

class MetaGraphService {

    _version() {
        return process.env.META_GRAPH_API_VERSION || 'v21.0';
    }

    _baseUrl() {
        return `https://graph.facebook.com/${this._version()}`;
    }

    _requireEnv(nombre) {
        const valor = process.env[nombre];
        if (!valor) {
            throw new Error(`Falta configurar la variable de entorno ${nombre} para publicar en redes sociales.`);
        }
        return valor;
    }

    _mensajeErrorGraph(error) {
        const detalle = error.response?.data?.error?.message;
        return detalle ? `Error de Meta Graph API: ${detalle}` : error.message;
    }

    // El token de usuario del sistema (FACEBOOK_PAGE_ACCESS_TOKEN) no alcanza
    // para publicar fotos/posts en la Página vía /{page-id}/photos o /feed
    // (da "(#200) Subject does not have permission..." aunque el usuario del
    // sistema tenga el rol correcto en Business Manager). Hace falta el token
    // de Página derivado, que se obtiene con este mismo token de usuario del
    // sistema. Se cachea en memoria porque no cambia mientras no se revoque
    // el acceso (mismo criterio que el token de usuario del sistema, que no vence).
    async _obtenerTokenDePagina() {
        if (this._tokenDePaginaCacheado) return this._tokenDePaginaCacheado;

        const pageId = this._requireEnv('FACEBOOK_PAGE_ID');
        const tokenUsuarioSistema = this._requireEnv('FACEBOOK_PAGE_ACCESS_TOKEN');

        try {
            const { data } = await axios.get(`${this._baseUrl()}/${pageId}`, {
                params: { fields: 'access_token', access_token: tokenUsuarioSistema }
            });
            if (!data.access_token) {
                throw new Error('Meta no devolvió un access_token de página.');
            }
            this._tokenDePaginaCacheado = data.access_token;
            return this._tokenDePaginaCacheado;
        } catch (error) {
            throw new Error('No se pudo obtener el token de página: ' + this._mensajeErrorGraph(error));
        }
    }

    // Diagnóstico de solo lectura: corre desde este mismo proceso (con el token
    // que ESTE entorno tiene cargado en env) para confirmar tasks/permisos
    // reales, sin exponer nunca el token crudo en la respuesta.
    async diagnosticar() {
        const pageId = this._requireEnv('FACEBOOK_PAGE_ID');
        const accessToken = this._requireEnv('FACEBOOK_PAGE_ACCESS_TOKEN');
        const resultado = {
            pageIdConfigurado: pageId,
            tokenPrefijo: accessToken.slice(0, 10) + '...' + accessToken.slice(-6)
        };

        try {
            const { data } = await axios.get(`${this._baseUrl()}/me/accounts`, { params: { access_token: accessToken } });
            resultado.paginasVisibles = (data.data || []).map(p => ({ id: p.id, name: p.name, tasks: p.tasks }));
            const pagina = (data.data || []).find(p => p.id === pageId);
            resultado.paginaObjetivoEncontrada = !!pagina;
            if (pagina) resultado.tasksSobrePaginaObjetivo = pagina.tasks;
        } catch (error) {
            resultado.errorMeAccounts = this._mensajeErrorGraph(error);
        }

        try {
            const { data } = await axios.get(`${this._baseUrl()}/debug_token`, {
                params: { input_token: accessToken, access_token: accessToken }
            });
            resultado.tokenTipo = data.data?.type;
            resultado.tokenValido = data.data?.is_valid;
            resultado.tokenVence = data.data?.expires_at === 0 ? 'nunca' : new Date((data.data?.expires_at || 0) * 1000);
            resultado.tokenScopes = data.data?.scopes;
            resultado.tokenAppId = data.data?.app_id;
        } catch (error) {
            resultado.errorDebugToken = this._mensajeErrorGraph(error);
        }

        return resultado;
    }

    async publicarEnFacebook(imageUrls, caption) {
        const pageId = this._requireEnv('FACEBOOK_PAGE_ID');
        const accessToken = await this._obtenerTokenDePagina();

        try {
            if (imageUrls.length === 1) {
                const { data } = await axios.post(`${this._baseUrl()}/${pageId}/photos`, null, {
                    params: { url: imageUrls[0], caption, access_token: accessToken }
                });
                return { postId: data.post_id || data.id };
            }

            const fotosSinPublicar = [];
            for (const url of imageUrls) {
                const { data } = await axios.post(`${this._baseUrl()}/${pageId}/photos`, null, {
                    params: { url, published: false, access_token: accessToken }
                });
                fotosSinPublicar.push({ media_fbid: data.id });
            }

            const { data: post } = await axios.post(`${this._baseUrl()}/${pageId}/feed`, null, {
                params: {
                    message: caption,
                    attached_media: JSON.stringify(fotosSinPublicar),
                    access_token: accessToken
                }
            });
            return { postId: post.id };
        } catch (error) {
            throw new Error(this._mensajeErrorGraph(error));
        }
    }

    async eliminarDeFacebook(postId) {
        const accessToken = await this._obtenerTokenDePagina();
        try {
            await axios.delete(`${this._baseUrl()}/${postId}`, {
                params: { access_token: accessToken }
            });
        } catch (error) {
            throw new Error(this._mensajeErrorGraph(error));
        }
    }

    async publicarEnInstagram(imageUrls, caption) {
        const igUserId = this._requireEnv('INSTAGRAM_BUSINESS_ACCOUNT_ID');
        const accessToken = this._requireEnv('FACEBOOK_PAGE_ACCESS_TOKEN');

        try {
            if (imageUrls.length === 1) {
                const { data: creacion } = await axios.post(`${this._baseUrl()}/${igUserId}/media`, null, {
                    params: { image_url: imageUrls[0], caption, access_token: accessToken }
                });
                const { data: publicado } = await axios.post(`${this._baseUrl()}/${igUserId}/media_publish`, null, {
                    params: { creation_id: creacion.id, access_token: accessToken }
                });
                return { postId: publicado.id };
            }

            const childrenIds = [];
            for (const url of imageUrls) {
                const { data } = await axios.post(`${this._baseUrl()}/${igUserId}/media`, null, {
                    params: { image_url: url, is_carousel_item: true, access_token: accessToken }
                });
                childrenIds.push(data.id);
            }

            const { data: creacion } = await axios.post(`${this._baseUrl()}/${igUserId}/media`, null, {
                params: {
                    media_type: 'CAROUSEL',
                    children: childrenIds.join(','),
                    caption,
                    access_token: accessToken
                }
            });

            const { data: publicado } = await axios.post(`${this._baseUrl()}/${igUserId}/media_publish`, null, {
                params: { creation_id: creacion.id, access_token: accessToken }
            });
            return { postId: publicado.id };
        } catch (error) {
            throw new Error(this._mensajeErrorGraph(error));
        }
    }
}

module.exports = new MetaGraphService();
