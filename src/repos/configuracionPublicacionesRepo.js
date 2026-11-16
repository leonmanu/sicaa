const ConfiguracionPublicaciones = require('../models/ConfiguracionPublicaciones');

class ConfiguracionPublicacionesRepo {

    // Si el CIIE todavía no tiene la suya, se crea con los valores por defecto.
    async getPorCiie(ciieId) {
        if (!ciieId) throw new Error('Falta la institución para leer la configuración de publicaciones.');
        return await ConfiguracionPublicaciones.findOneAndUpdate(
            { ciieId },
            { $setOnInsert: { ciieId } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    async actualizar(ciieId, datos) {
        const configuracion = await this.getPorCiie(ciieId);
        Object.assign(configuracion, datos);
        return await configuracion.save();
    }
}

module.exports = new ConfiguracionPublicacionesRepo();
