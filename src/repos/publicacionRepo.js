const Publicacion = require('../models/Publicacion');

const populateCursos = {
    path: 'cursoLocalIds',
    populate: [
        { path: 'cargoId', populate: [{ path: 'ciieId' }, { path: 'areaId' }] }
    ]
};

class PublicacionRepo {

    async crear(datos) {
        const publicacion = new Publicacion(datos);
        return await publicacion.save();
    }

    async getPorId(id) {
        try {
            return await Publicacion.findById(id).populate(populateCursos);
        } catch (error) {
            console.error('Error en PublicacionRepo.getPorId:', error.message);
            throw error;
        }
    }

    async getTodas() {
        try {
            return await Publicacion.find().sort({ createdAt: -1 }).populate(populateCursos).lean();
        } catch (error) {
            console.error('Error en PublicacionRepo.getTodas:', error.message);
            throw error;
        }
    }

    async getPorGrupoId(grupoId) {
        try {
            return await Publicacion.find({ grupoId }).sort({ parteActual: 1 }).lean();
        } catch (error) {
            console.error('Error en PublicacionRepo.getPorGrupoId:', error.message);
            throw error;
        }
    }

    async getIndividualPorCursoLocalId(cursoLocalId) {
        try {
            return await Publicacion.findOne({ tipoAgrupacion: 'individual', cursoLocalIds: cursoLocalId }).populate(populateCursos);
        } catch (error) {
            console.error('Error en PublicacionRepo.getIndividualPorCursoLocalId:', error.message);
            throw error;
        }
    }

    async actualizar(id, datos) {
        try {
            return await Publicacion.findByIdAndUpdate(id, { $set: datos }, { new: true });
        } catch (error) {
            console.error('Error en PublicacionRepo.actualizar:', error.message);
            throw error;
        }
    }

    async eliminar(id) {
        try {
            return await Publicacion.findByIdAndDelete(id);
        } catch (error) {
            console.error('Error en PublicacionRepo.eliminar:', error.message);
            throw error;
        }
    }
}

module.exports = new PublicacionRepo();
