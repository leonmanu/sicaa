const ciieRepo = require('../repos/ciieRepo');
const metaGraphService = require('./metaGraphService');
const { encriptar, desencriptar } = require('../utils/credencialCrypto');

// Conexión de cada CIIE con SUS redes (página de Facebook + Instagram vinculado).
// El token nunca sale de acá hacia las vistas: solo se expone el estado.
class RedesSocialesService {

    _error(mensaje, statusCode) {
        const err = new Error(mensaje);
        err.statusCode = statusCode;
        return err;
    }

    async _getCiie(ciieId) {
        const ciie = await ciieRepo.getPorId(ciieId);
        if (!ciie) throw this._error('Institución no encontrada.', 404);
        return ciie;
    }

    // Lo que ve la pantalla de configuración (sin el token).
    async getEstado(ciieId) {
        const ciie = await this._getCiie(ciieId);
        const redes = ciie.redesSociales;
        return {
            ciieNombre: ciie.nombre,
            conectado: !!(redes?.token && redes?.facebookPageId),
            tieneToken: !!redes?.token,
            facebookPageId: redes?.facebookPageId || null,
            facebookPageNombre: redes?.facebookPageNombre || null,
            instagramId: redes?.instagramId || null,
            instagramUsuario: redes?.instagramUsuario || null,
            verificadoEn: redes?.verificadoEn || null
        };
    }

    // Lo que necesita metaGraphService para publicar. Falla con un mensaje
    // accionable si el CIIE todavía no conectó sus redes.
    async getConexion(ciieId) {
        const ciie = await this._getCiie(ciieId);
        const redes = ciie.redesSociales;
        if (!redes?.token || !redes?.facebookPageId) {
            throw this._error('Tu CIIE todavía no conectó sus redes sociales. Configuralas en Publicaciones → Redes sociales del CIIE.', 409);
        }
        return {
            token: desencriptar(redes.token),
            pageId: redes.facebookPageId,
            igUserId: redes.instagramId || null
        };
    }

    // tokenNuevo vacío = usar el que ya está guardado (para re-verificar o
    // cambiar de página sin volver a pegarlo).
    async _resolverToken(ciie, tokenNuevo) {
        const token = (tokenNuevo || '').trim();
        if (token) return token;
        if (ciie.redesSociales?.token) return desencriptar(ciie.redesSociales.token);
        throw this._error('Pegá el token de acceso de Meta.', 400);
    }

    async verificar(ciieId, tokenNuevo) {
        const ciie = await this._getCiie(ciieId);
        const token = await this._resolverToken(ciie, tokenNuevo);
        try {
            return await metaGraphService.inspeccionarToken(token);
        } catch (error) {
            throw this._error(error.message, 400);
        }
    }

    // La página elegida se vuelve a validar contra Meta acá (no se confía en lo
    // que mande el navegador), y el Instagram se toma de esa misma respuesta.
    async guardarConexion(ciieId, { token: tokenNuevo, pageId }) {
        if (!pageId) throw this._error('Elegí la página de Facebook del CIIE.', 400);

        const ciie = await this._getCiie(ciieId);
        const token = await this._resolverToken(ciie, tokenNuevo);

        let paginas;
        try {
            ({ paginas } = await metaGraphService.inspeccionarToken(token));
        } catch (error) {
            throw this._error(error.message, 400);
        }

        const pagina = paginas.find(p => p.id === String(pageId));
        if (!pagina) throw this._error('Ese token no tiene acceso a la página elegida.', 400);

        const anterior = ciie.redesSociales;
        // Si Meta no devuelve el Instagram vinculado (p. ej. falta el permiso
        // instagram_basic) pero ya teníamos uno para esta misma página, se conserva.
        const mismaPagina = anterior?.facebookPageId === pagina.id;
        const instagram = pagina.instagram
            || (mismaPagina && anterior?.instagramId ? { id: anterior.instagramId, usuario: anterior.instagramUsuario } : null);

        if (anterior?.facebookPageId) metaGraphService.olvidarTokensDePagina(anterior.facebookPageId);

        await ciieRepo.actualizarRedesSociales(ciie._id, {
            token: encriptar(token),
            facebookPageId: pagina.id,
            facebookPageNombre: pagina.nombre,
            instagramId: instagram?.id || null,
            instagramUsuario: instagram?.usuario || null,
            verificadoEn: new Date()
        });

        return await this.getEstado(ciieId);
    }

    async desconectar(ciieId) {
        const ciie = await this._getCiie(ciieId);
        if (ciie.redesSociales?.facebookPageId) metaGraphService.olvidarTokensDePagina(ciie.redesSociales.facebookPageId);
        await ciieRepo.actualizarRedesSociales(ciie._id, null);
    }
}

module.exports = new RedesSocialesService();
