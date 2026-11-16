const configuracionPublicacionesRepo = require('../repos/configuracionPublicacionesRepo');

class ConfiguracionPublicacionesService {

    async get(ciieId) {
        return await configuracionPublicacionesRepo.getPorCiie(ciieId);
    }

    async actualizar(ciieId, datos) {
        const textoABullets = (texto) => (texto || '').split('\n').map(l => l.trim()).filter(Boolean);

        return await configuracionPublicacionesRepo.actualizar(ciieId, {
            requisitosDefaultBullets: textoABullets(datos.requisitosDefaultBullets),
            cierreFacebook: datos.cierreFacebook || '',
            cierreInstagram: datos.cierreInstagram || '',
            hashtagsFijos: textoABullets(datos.hashtagsFijos)
        });
    }
}

module.exports = new ConfiguracionPublicacionesService();
