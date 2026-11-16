const axios = require('axios');

// Todas las operaciones reciben la "conexión" del CIIE que publica:
//   { token, pageId, igUserId }
// token = token del usuario del sistema del Business Manager de ESE CIIE (ya
// descifrado). La arma redesSocialesService a partir de Ciie.redesSociales.
class MetaGraphService {

    constructor() {
        // pageId|token -> token de página. Uno por página: cada CIIE tiene la suya.
        this._tokensDePagina = new Map();
    }

    _version() {
        return process.env.META_GRAPH_API_VERSION || 'v21.0';
    }

    _baseUrl() {
        return `https://graph.facebook.com/${this._version()}`;
    }

    _mensajeErrorGraph(error) {
        const detalle = error.response?.data?.error?.message;
        return detalle ? `Error de Meta Graph API: ${detalle}` : error.message;
    }

    _exigir(conexion, campo, mensaje) {
        if (!conexion?.[campo]) throw new Error(mensaje);
        return conexion[campo];
    }

    // El token de usuario del sistema no alcanza para publicar fotos/posts en la
    // Página vía /{page-id}/photos o /feed (da "(#200) Subject does not have
    // permission..." aunque el usuario del sistema tenga el rol correcto en
    // Business Manager). Hace falta el token de Página derivado, que se obtiene
    // con el token de usuario del sistema. Se cachea en memoria porque no cambia
    // mientras no se revoque el acceso.
    async _obtenerTokenDePagina(conexion) {
        const pageId = this._exigir(conexion, 'pageId', 'Tu CIIE no tiene una página de Facebook conectada.');
        const token = this._exigir(conexion, 'token', 'Tu CIIE no tiene conectadas sus redes sociales.');
        const clave = `${pageId}|${token}`;
        if (this._tokensDePagina.has(clave)) return this._tokensDePagina.get(clave);

        try {
            const { data } = await axios.get(`${this._baseUrl()}/${pageId}`, {
                params: { fields: 'access_token', access_token: token }
            });
            if (!data.access_token) {
                throw new Error('Meta no devolvió un access_token de página.');
            }
            this._tokensDePagina.set(clave, data.access_token);
            return data.access_token;
        } catch (error) {
            throw new Error('No se pudo obtener el token de página: ' + this._mensajeErrorGraph(error));
        }
    }

    olvidarTokensDePagina(pageId) {
        for (const clave of this._tokensDePagina.keys()) {
            if (clave.startsWith(`${pageId}|`)) this._tokensDePagina.delete(clave);
        }
    }

    // Solo lectura: qué páginas (y su Instagram vinculado) puede manejar este
    // token, y si vence. Es lo que usa la pantalla "Redes sociales del CIIE"
    // para que nadie tenga que buscar ni tipear IDs.
    async inspeccionarToken(token) {
        if (!token) throw new Error('Falta el token de acceso.');

        let paginas;
        try {
            const { data } = await axios.get(`${this._baseUrl()}/me/accounts`, {
                params: {
                    fields: 'id,name,tasks,instagram_business_account{id,username}',
                    limit: 100,
                    access_token: token
                }
            });
            paginas = (data.data || []).map(p => ({
                id: p.id,
                nombre: p.name,
                puedePublicar: !p.tasks || p.tasks.includes('CREATE_CONTENT') || p.tasks.includes('MANAGE'),
                instagram: p.instagram_business_account
                    ? { id: p.instagram_business_account.id, usuario: p.instagram_business_account.username || null }
                    : null
            }));
        } catch (error) {
            throw new Error('Meta rechazó el token: ' + this._mensajeErrorGraph(error));
        }

        let vence = null;
        try {
            const { data } = await axios.get(`${this._baseUrl()}/debug_token`, {
                params: { input_token: token, access_token: token }
            });
            const expiresAt = data.data?.expires_at;
            vence = expiresAt === 0 ? 'nunca' : (expiresAt ? new Date(expiresAt * 1000) : null);
        } catch (error) {
            // No es indispensable: si falla, solo no mostramos el vencimiento.
        }

        return { paginas, vence };
    }

    async publicarEnFacebook(conexion, imageUrls, caption) {
        const accessToken = await this._obtenerTokenDePagina(conexion);
        const pageId = conexion.pageId;

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

    // Edita el texto de un post ya publicado. Un post de una sola foto (creado
    // vía /{page-id}/photos) se edita con el campo "caption"; un post de varias
    // fotos (creado vía /{page-id}/feed) se edita con "message".
    async editarCaptionFacebook(conexion, postId, caption, esFoto) {
        const accessToken = await this._obtenerTokenDePagina(conexion);
        try {
            await axios.post(`${this._baseUrl()}/${postId}`, null, {
                params: esFoto ? { caption, access_token: accessToken } : { message: caption, access_token: accessToken }
            });
        } catch (error) {
            throw new Error(this._mensajeErrorGraph(error));
        }
    }

    async eliminarDeFacebook(conexion, postId) {
        const accessToken = await this._obtenerTokenDePagina(conexion);
        try {
            await axios.delete(`${this._baseUrl()}/${postId}`, {
                params: { access_token: accessToken }
            });
        } catch (error) {
            throw new Error(this._mensajeErrorGraph(error));
        }
    }

    // Instagram procesa cada contenedor (imagen o carrusel) de forma asíncrona:
    // si se llama a media_publish antes de que esté FINISHED, responde
    // "Media ID is not available". Se consulta status_code hasta que esté listo.
    async _esperarContenedorInstagram(containerId, accessToken, { intentos = 30, esperaMs = 2000 } = {}) {
        for (let i = 0; i < intentos; i += 1) {
            const { data } = await axios.get(`${this._baseUrl()}/${containerId}`, {
                params: { fields: 'status_code,status', access_token: accessToken }
            });
            if (data.status_code === 'FINISHED') return;
            if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
                throw new Error(`Instagram no pudo procesar la imagen (${data.status_code}${data.status ? ': ' + data.status : ''}).`);
            }
            await new Promise(resolve => setTimeout(resolve, esperaMs));
        }
        throw new Error('Instagram tardó demasiado en procesar la imagen. Probá publicar de nuevo en unos minutos.');
    }

    async publicarEnInstagram(conexion, imageUrls, caption) {
        const igUserId = this._exigir(conexion, 'igUserId', 'Tu CIIE no tiene una cuenta de Instagram conectada.');
        const accessToken = this._exigir(conexion, 'token', 'Tu CIIE no tiene conectadas sus redes sociales.');

        try {
            if (imageUrls.length === 1) {
                const { data: creacion } = await axios.post(`${this._baseUrl()}/${igUserId}/media`, null, {
                    params: { image_url: imageUrls[0], caption, access_token: accessToken }
                });
                await this._esperarContenedorInstagram(creacion.id, accessToken);
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
            for (const childId of childrenIds) {
                await this._esperarContenedorInstagram(childId, accessToken);
            }

            const { data: creacion } = await axios.post(`${this._baseUrl()}/${igUserId}/media`, null, {
                params: {
                    media_type: 'CAROUSEL',
                    children: childrenIds.join(','),
                    caption,
                    access_token: accessToken
                }
            });
            await this._esperarContenedorInstagram(creacion.id, accessToken);

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
