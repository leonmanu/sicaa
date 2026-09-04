const configuracionPublicacionesRepo = require('../repos/configuracionPublicacionesRepo');

class ConfiguracionPublicacionesService {

    async get() {
        return await configuracionPublicacionesRepo.getSingleton();
    }

    async actualizar(datos) {
        const textoABullets = (texto) => (texto || '').split('\n').map(l => l.trim()).filter(Boolean);

        return await configuracionPublicacionesRepo.actualizar({
            requisitosDefaultBullets: textoABullets(datos.requisitosDefaultBullets),
            cierreFacebook: datos.cierreFacebook || '',
            cierreInstagram: datos.cierreInstagram || '',
            hashtagsFijos: textoABullets(datos.hashtagsFijos)
        });
    }
}

module.exports = new ConfiguracionPublicacionesService();
