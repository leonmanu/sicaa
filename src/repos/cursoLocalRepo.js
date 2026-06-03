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

const populateConEncuentros = {
    path: 'cargoId',
    populate: [
        { path: 'ciieId' },
        { path: 'areaId' }
    ]
};

const populateCargoConOcupante = {
    path: 'cargoId',
    populate: [
        { path: 'areaId' }, // Trae el nombre del área
        { path: 'ciieId' }, // Trae el nombre del CIIE
        {
            path: 'ocupante', // Virtual que apunta a Asignación
            match: { estado: 'Activo' },
            populate: {
                path: 'usuarioId', // Salta al modelo Usuario
                populate: { 
                    path: 'referenciaId', // Salta al modelo Persona
                    model: 'Persona' // Especificamos el modelo por ser refPath
                }
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

    async delPorId(cursoId) {
        try {
            return await CursoLocal.deleteOne({ _id: new mongoose.Types.ObjectId(cursoId) });
        } catch (error) {
            console.error('Error en CursoLocalRepo.delPorId:', error.message);
            throw error;
        }
    }

    async getPorIdOfertaOficial(ofertaId) {
        try {
            return await CursoLocal.findOne({ idOfertaOficial: ofertaId })
                .populate(populateCargoConOcupante)
                .lean({ virtuals: true });
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
                // $or: [
                //     { idOfertaOficial: { $exists: false } },
                //     { idOfertaOficial: null },
                //     { idOfertaOficial: '' }
                // ]
            })
            .populate(populateCargoConOcupante)
            .sort({ createdAt: -1 })
            .lean({ virtuals: true }); // IMPORTANTE: permite ver 'ocupante' con lean
        } catch (error) {
            console.error('Error en CursoLocalRepo.getPendientesVinculacionPorCiie:', error.message);
            throw error;
        }
    }

    async getPendientesCalificacionesPorCiie(ciieId) {
        try {
            return await CursoLocal.find({
                ciieId: new mongoose.Types.ObjectId(ciieId),
                estado: 'vinculado',
                $or: [
                    { 'calificaciones.estado': { $exists: false } },
                    { 'calificaciones.estado': { $ne: 'enviado' } }
                ]
            })
                .populate(populateCargoConOcupante)
                .sort({ anio: -1, cohorte: -1, createdAt: -1 })
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.getPendientesCalificacionesPorCiie:', error.message);
            throw error;
        }
    }

    async getCalificacionesPorCiie(ciieId) {
        try {
            return await CursoLocal.find({
                ciieId: new mongoose.Types.ObjectId(ciieId),
                estado: 'vinculado'
            })
                .populate(populateCargoConOcupante)
                .sort({ anio: -1, cohorte: -1, createdAt: -1 })
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.getPendientesCalificacionesPorCiie:', error.message);
            throw error;
        }
    }

    async getItinerariosDisponiblesPorCiie(ciieId) {
        try {
            return await CursoLocal.aggregate([
                {
                    $match: {
                        ciieId: new mongoose.Types.ObjectId(ciieId),
                        estado: 'vinculado',
                        anio: { $type: 'number' },
                        itinerario: { $type: 'number' }
                    }
                },
                {
                    $group: {
                        _id: {
                            anio: '$anio',
                            itinerario: '$itinerario'
                        },
                        cantidadCursos: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        anio: '$_id.anio',
                        itinerario: '$_id.itinerario',
                        cantidadCursos: 1
                    }
                },
                { $sort: { anio: -1, itinerario: 1 } }
            ]);
        } catch (error) {
            console.error('Error en CursoLocalRepo.getItinerariosDisponiblesPorCiie:', error.message);
            throw error;
        }
    }

    async getPorCiieAnioItinerario(ciieId, anio, itinerario) {
        try {
            return await CursoLocal.find({
                ciieId: new mongoose.Types.ObjectId(ciieId),
                estado: 'vinculado',
                anio,
                itinerario
            })
                .populate(populateCargoConOcupante)
                .sort({ nombrePropuesta: 1, createdAt: -1 })
                .lean({ virtuals: true });
        } catch (error) {
            console.error('Error en CursoLocalRepo.getPorCiieAnioItinerario:', error.message);
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

    async actualizarEstadoCalificaciones(cursoId, dataCalificaciones) {
        try {
            return await CursoLocal.findByIdAndUpdate(
                new mongoose.Types.ObjectId(cursoId),
                { $set: { calificaciones: dataCalificaciones } },
                { new: true }
            )
                .populate(populateCargoConOcupante)
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.actualizarEstadoCalificaciones:', error.message);
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
            .populate([
                populateCargoConOcupante,
                { path: 'cargosInvitados', populate: [ { path: 'areaId' }, { path: 'ciieId' } ] }
            ])
            // -1 ordena de mayor a menor (2026 primero, y lo más reciente de hoy arriba)
            .sort({ _id: -1 }) 
            .lean({ virtuals: true });
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

    async getPorCiieAnioDispositivo(ciieId, anio, dispositivo) {
        try {
            return await CursoLocal.find({
                ciieId: new mongoose.Types.ObjectId(ciieId),
                anio,
                dispositivo,
                estado: { $ne: 'dormido' }
            })
            .sort({ itinerario: -1 })
            .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.getPorCiieAnioDispositivo:', error.message);
            throw error;
        }
    }
}

module.exports = new CursoLocalRepo();