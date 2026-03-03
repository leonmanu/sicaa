const mongoose = require('mongoose');
const Encuentro = require('../models/Encuentro');
const InscriptoLocal = require('../models/InscriptoLocal');


class EncuentroRepo {
    async getPorCursoId(cursoId) {
        try {
            const encuentros = await Encuentro.find({ cursoId: cursoId }).lean();
            return encuentros;
        } catch (error) {
            console.error('Error en EncuentroRepo.getByCurso:', error.message);
            throw error;
        }
    }

    async getUnoPorNumeroCursoId(cursoId, numero) {
        try { 
            const encuentro = await Encuentro.findOne({ cursoId: cursoId, numero: numero }).lean();
            return encuentro;
        } catch (error) {
            console.error('Error en EncuentroRepo.getUnoPorNumeroCursoId:', error.message);
            throw error;
        }
    }

    async post(data) {
        try {
            const registro = new Encuentro(data);
            return await registro.save();
        } catch (error) {
            if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            if (campo === 'numero') throw new Error('Ya existe un encuentro con ese número en este curso.');
            if (campo === 'fecha') throw new Error('Ya existe un encuentro en esa fecha para este curso.');
            throw new Error('Dato duplicado.');
        }
            console.error('Error en EncuentroRepo.post:', error.message);
            throw error;
        }
    }

    async delPorId(id) {
        try {
            const oid = new mongoose.Types.ObjectId(id);
            
            // 1. Borramos la asistencia de ese encuentro en todos los inscriptos
            await InscriptoLocal.updateMany(
                { 'asistencia.encuentroId': oid },
                { $pull: { asistencia: { encuentroId: oid } } }
            );

            // 2. Borramos el encuentro
            const resultado = await Encuentro.deleteOne({ _id: oid });
            
            return resultado;
        } catch (error) {
            console.error('Error en EncuentroRepo.delete:', error.message);
            throw error;
        }
    }

    async putPorId(id, data) {
        try {
            // Usamos findByIdAndUpdate para actualizar campos específicos
            // { new: true } devuelve el objeto ya modificado
            // { runValidators: true } asegura que los datos sigan las reglas del Schema
            const encuentroActualizado = await Encuentro.findByIdAndUpdate(
                id, 
                { $set: data }, 
                { new: true, runValidators: true }
            ).lean();

            return encuentroActualizado;
        } catch (error) {
            console.error('Error en EncuentroRepo.put:', error.message);
            throw error;
        }
    }
}

module.exports = new EncuentroRepo();