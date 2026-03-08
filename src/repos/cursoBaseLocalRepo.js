const mongoose = require('mongoose');
const CursoBaseLocal = require('../models/cursoBaseLocal');


class CursoBaseLocalRepo {

    async sincronizar(cursosBase, ciieId) {
        const ops = cursosBase.map(c => ({
            updateOne: {
                filter: { idCursoOriginal: c[0] },
                update: { 
                    $set: {
                        idCursoOriginal: c[0],
                        nombre:          c[1],
                        estadoAbc:       c[2],
                        anioReferencia:  Number(c[3]),
                        dispositivo:     c[4],
                        areaNombre:      c[5]
                    },
                    $addToSet: { ciiesHabilitados: ciieId }  // ← así se llama el parámetro
                },
                upsert: true
            }
        }));
        return await CursoBaseLocal.bulkWrite(ops);
    }

    async desactivar(idsCursoOriginal, ciieId) {
        return await CursoBaseLocal.updateMany(
            { idCursoOriginal: { $in: idsCursoOriginal } },
            { 
                $set: { activo: false },
                $pull: { ciiesHabilitados: ciieId }
            }
        );
    }

    // async getPorIdOfertaOficial(ofertaId) {
    //     try {
    //         return await CursoLocal.findOne({ idOfertaOficial: ofertaId })
    //             .populate(populateCargoBase)
    //             .lean();
    //     } catch (error) {
    //         console.error('Error en CursoLocalRepo.getPorIdOfertaOficial:', error.message);
    //         throw error;
    //     }
    // }

    // async getPorCargoId(cargoId) {
    //     try {
    //         return await CursoLocal.find({ cargoId: new mongoose.Types.ObjectId(cargoId) })
    //             .populate(populateCargoBase)
    //             .lean();
    //     } catch (error) {
    //         console.error('Error en CursoLocalRepo.getPorCargoId:', error.message);
    //         throw error;
    //     }
    // }

    async getPorCiieId(ciieId) {
        try {
            return await CursoBaseLocal.find({ ciiesHabilitados: new mongoose.Types.ObjectId(ciieId) })
                .sort({ anioReferencia: -1 })
                .lean();
        } catch (error) {
            console.error('Error en CursoBaseLocalRepo.getPorCiieId:', error.message);
            throw error;
        }
    }

    // async getPorAgente(usuarioId) {
    //     try {
    //         // 1. Buscamos los cargoId activos del agente
    //         const asignaciones = await Asignacion.find({ 
    //             usuarioId: new mongoose.Types.ObjectId(usuarioId), 
    //             estado: 'Activo' 
    //         }).lean();

    //         const cargoIds = asignaciones.map(a => a.cargoId);
    //         if (cargoIds.length === 0) return [];

    //         // 2. Buscamos los cursos de esos cargos
    //         return await CursoLocal.find({ cargoId: { $in: cargoIds } })
    //             .populate(populateCargoBase)
    //             .sort({ anio: -1 })
    //             .lean();
    //     } catch (error) {
    //         console.error('Error en CursoLocalRepo.getPorAgente:', error.message);
    //         throw error;
    //     }
    // }

    async get() {
        try {
            return await CursoBaseLocal.find()
                .sort({ anio: -1 })
                .lean();
        } catch (error) {
            console.error('Error en CursoLocalRepo.getTodos:', error.message);
            throw error;
        }
    }
}

module.exports = new CursoBaseLocalRepo();