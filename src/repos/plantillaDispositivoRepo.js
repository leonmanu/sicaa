const PlantillaDispositivo = require('../models/PlantillaDispositivo');

class PlantillaDispositivoRepo {

    async crear(datos) {
        const plantilla = new PlantillaDispositivo(datos);
        return await plantilla.save();
    }

    async getTodas() {
        return await PlantillaDispositivo.find().sort({ dispositivo: 1 }).lean();
    }

    async getPorDispositivo(dispositivo) {
        return await PlantillaDispositivo.findOne({ dispositivo }).lean();
    }

    async getPorId(id) {
        return await PlantillaDispositivo.findById(id);
    }

    async actualizar(id, datos) {
        return await PlantillaDispositivo.findByIdAndUpdate(id, { $set: datos }, { new: true });
    }

    async eliminar(id) {
        return await PlantillaDispositivo.findByIdAndDelete(id);
    }
}

module.exports = new PlantillaDispositivoRepo();
