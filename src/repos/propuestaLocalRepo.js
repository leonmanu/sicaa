const mongoose = require('mongoose');
const PropuestaLocal = require('../models/propuestaLocal');
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

class PropuestaLocalRepo {

    async post(data) {
        try {
            const cursoLocal = new PropuestaLocal(data);
            return await cursoLocal.save();
        } catch (error) {
            console.error('Error en PropuestaLocalRepo.post:', error.message);
            throw error;
        }
    }

    async getPorIdOfertaOficial(ofertaId) {
        try {
            return await PropuestaLocal.findOne({ idOfertaOficial: ofertaId })
                .populate(populateCargoBase)
                .lean();
        } catch (error) {
            console.error('Error en PropuestaLocalRepo.getPorIdOfertaOficial:', error.message);
            throw error;
        }
    }

    async getPorCargoId(cargoId) {
        try {
            return await PropuestaLocal.find({ cargoId: new mongoose.Types.ObjectId(cargoId) })
                .populate(populateCargoBase)
                .lean();
        } catch (error) {
            console.error('Error en PropuestaLocalRepo.getPorCargoId:', error.message);
            throw error;
        }
    }

    async getPorCiieId(ciieId) {
        try {
            return await PropuestaLocal.find({ ciieId: new mongoose.Types.ObjectId(ciieId) })
                .populate(populateCargoConOcupante)
                .sort({ anio: -1 })
                .lean();
        } catch (error) {
            console.error('Error en PropuestaLocalRepo.getPorCiieId:', error.message);
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
            return await PropuestaLocal.find({ cargoId: { $in: cargoIds } })
                .populate(populateCargoBase)
                .sort({ anio: -1 })
                .lean();
        } catch (error) {
            console.error('Error en PropuestaLocalRepo.getPorAgente:', error.message);
            throw error;
        }
    }

    async getTodos() {
        try {
            return await PropuestaLocal.find()
                .populate(populateCargoBase)
                .sort({ anio: -1 })
                .lean();
        } catch (error) {
            console.error('Error en PropuestaLocalRepo.getTodos:', error.message);
            throw error;
        }
    }
}

module.exports = new PropuestaLocalRepo();




