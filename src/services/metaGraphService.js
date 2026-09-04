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

    async publicarEnFacebook(imageUrls, caption) {
        const pageId = this._requireEnv('FACEBOOK_PAGE_ID');
        const accessToken = this._requireEnv('FACEBOOK_PAGE_ACCESS_TOKEN');

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
        const accessToken = this._requireEnv('FACEBOOK_PAGE_ACCESS_TOKEN');
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
