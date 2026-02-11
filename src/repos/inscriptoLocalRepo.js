const mongoose = require('mongoose');

const InscriptoLocal = require('../models/InscriptoLocal');

class InscriptoLocalRepo {
    
    // Para guardar la lista filtrada de una sola vez
    async saveMany(dataArray) {
        try {
            // insertMany es mucho más rápido para listas grandes
            return await InscriptoLocal.insertMany(dataArray);
        } catch (error) {
            console.error('Error en InscriptoLocalRepo.saveMany:', error.message);
            throw error;
        }
    }

    async getPorIdOfertaOficial(ofertaId) {
        try {
            return await InscriptoLocal.find({ 
                idOfertaOficial: ofertaId 
            }).lean();
        } catch (error) {
            // Corregido el nombre del log para que no te confunda
            console.error('Error en InscriptoLocalRepo.getPorIdOfertaOficial:', error.message);
            throw error;
        }
    }

    // Este lo necesita tu Service para el filtro de duplicados
    async getIdInscripcionPorCursoId(cursoId) {
        try {
            const inscripciones = await InscriptoLocal.find({ cursoId }, 'idInscripcionOficial').lean();

            return inscripciones.map(i => i.idInscripcionOficial);
        } catch (error) {
            console.error('Error en InscriptoLocalRepo.getIdsPorCurso:', error.message);
            throw error;
        }
    }

        async getPorListaDeCursos(cursoIds) {
        try {
            // Buscamos todos los inscriptos cuyo cursoId esté en nuestro array
            return await InscriptoLocal.find({ 
                cursoId: { $in: cursoIds } 
            }).lean();
        } catch (error) {
            console.error('Error en inscriptoRepo:', error.message);
            throw error;
        }
    }

    async getPorCursoId(cursoId) {
        try {
            const inscripciones = await InscriptoLocal.find({ cursoId }).lean();
            return inscripciones;
        } catch (error) {
            console.error('Error en InscriptoLocalRepo.getIdsPorCurso:', error.message);
            throw error;
        }
    }

    async post(data) {
        try {
            const registro = new InscriptoLocal(data);
            return await registro.save();
        } catch (error) {
            console.error('Error en InscriptoLocalRepo.post:', error.message);
            throw error;
        }
    }
}

module.exports = new InscriptoLocalRepo();