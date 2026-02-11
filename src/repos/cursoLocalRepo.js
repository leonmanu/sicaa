const mongoose = require('mongoose');
const CursoLocal = require('../models/CursoLocal'); // Asegúrate de que la ruta sea correcta

class CursoLocalRepo {
    /**
     * Crea un nuevo registro de curso vinculado localmente
     * @param {Object} data - Datos del curso (idOfertaOficial, cargoId, etc.)
     */
    async postCursoLocal(data) {
        try {
            const cursoLocal = new CursoLocal(data);
            return await cursoLocal.save();
        } catch (error) {
            // Logueamos el error con más contexto para el desarrollador
            console.error('Error persistiendo en CursoLocalRepo:', error.message);
            throw error; // Re-lanzamos para que el Service lo capture
        }
    }

    // Opcional: podrías agregar un método para evitar duplicados
    async buscarPorIdOficial(idOficial) {
        return await CursoLocal.findOne({ idOfertaOficial: idOficial });
    }
    

    async getPorCargoId(cargoId) {
        try {
            //console.log("cursoLocalRepo - getPorCargoId - cargoId: ", cargoId)
            const cargo = await CursoLocal.find(
                { 
                    cargoId: new mongoose.Types.ObjectId(cargoId)
                }
            )
                .lean();
            //console.log("cursoLocalRepo - getPorCargoId - cargoId: ", cargo)
            return cargo;
        } catch (error) {
            console.error('Error en CargoRepo.findByClave:', error.message);
            throw error;
        }
    }

    async getPorIdOfertaOficial(ofertaId) {
        try {
            //console.log("cursoLocalRepo - getPorCargoId - cargoId: ", cargoId)
            const curso = await CursoLocal.findOne(
                { 
                    idOfertaOficial: ofertaId
                }
            )
            .lean();
            //console.log("cursoLocalRepo - getPorCargoId - cargoId: ", cargo)
            return curso;
        } catch (error) {
            console.error('Error en CargoRepo.getPorIdOfertaOficial:', error.message);
            throw error;
        }
    }

    async getTodos() {
        try {
            return await CursoLocal.find();
        } catch (error) {
            console.error('Error obteniendo cursos locales:', error.message);
            throw error;
        }
    }

    async getPorCiieId(ciieId) {
    try {
        return await CursoLocal.find({ ciieId: new mongoose.Types.ObjectId(ciieId) })
        .populate({
            path: 'cargoId',
            populate: [
                { path: 'areaId' }, // Trae nombre del Área
                { 
                    path: 'ocupante', // Trae la Designación (asegúrate que en el modelo Cargo este campo exista o se llame así)
                    match: { estado: 'Activo' }, // Solo nos interesa el docente actual
                    populate: { 
                        path: 'usuarioId', 
                        populate: { path: 'referenciaId' } // Aquí llega a "Persona" (Muriel Gerace)
                    }
                }
            ]
        })
        .sort({ anio: -1 })
        .lean();
    } catch (error) {
        throw error;
    }
}


    async getPorCursoClaveCiieId(cargoClave, ciieId) {
        try {
            return await CursoLocal.find({
                ciieId: new mongoose.Types.ObjectId(ciieId),
                clave: cargoClave
            });
        } catch (error) {
            console.error('Error buscando curso por clave de cargo y CIIE:', error.message);
            throw error;
        }
    }

    async getPorCursoIdCiieId(cargoId, ciieId) {
        try {
            return await CursoLocal.find({
                ciieId: new mongoose.Types.ObjectId(ciieId),
                cargoId
            });
        } catch (error) {
            console.error('Error buscando curso por clave de cargo y CIIE:', error.message);
            throw error;
        }
    }
}

// Exportamos una instancia para no tener que hacer 'new' en cada service
module.exports = new CursoLocalRepo();