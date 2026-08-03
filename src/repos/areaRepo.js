const Area = require('../models/Area');

class AreaRepo {

    async crear(datos) {
        const nuevaArea = new Area(datos);
        return await nuevaArea.save();
    }

    async getTodas() {
        return await Area.find().sort({ nombre: 1 }).lean();
    }

    async getPorClave(clave) {
        return await Area.findOne({ clave }).lean();
    }
}

module.exports = new AreaRepo();
