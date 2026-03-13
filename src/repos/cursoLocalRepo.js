const mongoose = require('mongoose');
const CursoLocal = require('../models/CursoLocal');
const Asignacion = require('../models/Asignacion');

const populateCargoBase = {
    path: 'cargoId',
    populate: [
        { path: 'ciieId' },
        { path: 'areaId' }
    ]
};

const populateCargoConOcupante = {
    path: 'cargoId',
    populate: [
        { path: 'areaId' },
        {
            path: 'ocupante',
            match: { estado: 'Activo' },
            populate: {
                path: 'usuarioId',
                populate: { path: 'referenciaId' }
            }
        }
    ]
};

class CursoLocalRepo {

    async post(data) {
        try {
            const cursoLocal = new CursoLocal(data);
            return await cursoLocal.save();
        } catch (error) {
            console.error('Error en CursoLocalRepo.post:', error.message);
            throw error;
        }
    }

    async getPorIdOfertaOficial(ofertaId) {
        try {
            return await CursoLocal.findOne({ idOfertaOficial: ofertaId })
                .populate(populateCargoBase)
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.getPorIdOfertaOficial:', error.message);
            throw error;
        }
    }

    async getPorId(cursoId) {
        try {
            return await CursoLocal.findById(cursoId)
                .populate(populateCargoBase)
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.getPorId:', error.message);
            throw error;
        }
    }

    async getPendientesVinculacionPorCiie(ciieId) {
        try {
            return await CursoLocal.find({
                ciieId: new mongoose.Types.ObjectId(ciieId),
                $or: [
                    { idOfertaOficial: { $exists: false } },
                    { idOfertaOficial: null },
                    { idOfertaOficial: '' }
                ]
            })
                .populate(populateCargoConOcupante)
                .sort({ createdAt: -1 })
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.getPendientesVinculacionPorCiie:', error.message);
            throw error;
        }
    }

    async vincularConOfertaOficial(cursoId, dataActualizada) {
        try {
            return await CursoLocal.findByIdAndUpdate(
                new mongoose.Types.ObjectId(cursoId),
                { $set: dataActualizada },
                { new: true }
            )
                .populate(populateCargoConOcupante)
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.vincularConOfertaOficial:', error.message);
            throw error;
        }
    }

    async actualizarPendiente(cursoId, dataActualizada) {
        try {
            return await CursoLocal.findByIdAndUpdate(
                new mongoose.Types.ObjectId(cursoId),
                { $set: dataActualizada },
                { new: true }
            )
                .populate(populateCargoConOcupante)
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.actualizarPendiente:', error.message);
            throw error;
        }
    }

    async getPorCargoId(cargoId) {
        try {
            return await CursoLocal.find({ cargoId: new mongoose.Types.ObjectId(cargoId) })
                .populate(populateCargoBase)
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.getPorCargoId:', error.message);
            throw error;
        }
    }

    async getPorCiieId(ciieId) {
        try {
            return await CursoLocal.find({ ciieId: new mongoose.Types.ObjectId(ciieId) })
                .populate(populateCargoConOcupante)
                .sort({ anio: -1 })
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.getPorCiieId:', error.message);
            throw error;
        }
    }

    async getPorAgente(usuarioId) {
        try {
            // 1. Buscamos los cargoId activos del agente
            const asignaciones = await Asignacion.find({ 
                usuarioId: new mongoose.Types.ObjectId(usuarioId), 
                estado: 'Activo' 
            }).lean();

            const cargoIds = asignaciones.map(a => a.cargoId);
            if (cargoIds.length === 0) return [];

            // 2. Buscamos los cursos de esos cargos
            return await CursoLocal.find({ cargoId: { $in: cargoIds } })
                .populate(populateCargoBase)
                .sort({ anio: -1 })
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.getPorAgente:', error.message);
            throw error;
        }
    }

    async getTodos() {
        try {
            return await CursoLocal.find()
                .populate(populateCargoBase)
                .sort({ anio: -1 })
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.getTodos:', error.message);
            throw error;
        }
    }
}

module.exports = new CursoLocalRepo();