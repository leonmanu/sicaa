const ConfiguracionPublicaciones = require('../models/ConfiguracionPublicaciones');

class ConfiguracionPublicacionesRepo {

    async getSingleton() {
        let configuracion = await ConfiguracionPublicaciones.findOne();
        if (!configuracion) {
            configuracion = await new ConfiguracionPublicaciones({}).save();
        }
        return configuracion;
    }

    async actualizar(datos) {
        const configuracion = await this.getSingleton();
        Object.assign(configuracion, datos);
        return await configuracion.save();
    }
}

module.exports = new ConfiguracionPublicacionesRepo();
