const encuentroRepo = require('../repos/encuentroRepo');
const cursoLocalService = require('./cursoLocalService');


class encuentroService {

    async getPorCursoId(cursoId) {
        try {
            return await encuentroRepo.getPorCursoId(cursoId);
        }   catch (error) {     
            console.error('Error obteniendo encuentros por cursoId:', error.message);
            throw error;
        }
    }

    async getUnoPorNumeroCursoId(cursoId, numero) {
        try {
            return await encuentroRepo.getUnoPorNumeroCursoId(cursoId, numero);
        }   catch (error) {     
            console.error('Error obteniendo encuentro por cursoId y número:', error.message);
            throw error;
        }
    }

    async post(data) {
        console.log('Datos recibidos para nuevo encuentro:', data);
        try {
            const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(data.idOfertaOficial);
            if (!cursoLocal) {
                throw new Error('Curso local no encontrado para el idOfertaOficial: ' + data.idOfertaOficial);
            }

            const resultado = await encuentroRepo.post({
                cursoId: cursoLocal._id,
                fecha: data.fecha,
                modalidad: data.modalidad,
                numero: data.numero
            })

            return resultado;
        }   catch (error) {     
            console.error('Error creando encuentro:', error.message);
            throw error;
        }
    }

    // encuentroService.js (ejemplo de flujo de eliminación)

    async delPorNumeroIdOfertaOficial(numero, cursoId) {
        // 1. Buscamos el encuentro para saber a qué curso pertenece antes de borrarlo
        try {
            const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(cursoId);
            if (!cursoLocal) {
                throw new Error('Curso local no encontrado para el idOfertaOficial: ' + cursoId);
            }
            const encuentro = await this.getUnoPorNumeroCursoId(cursoLocal._id, numero)        
            console.log('Encuentro encontrado para eliminación:', encuentro)
            if (!encuentro) {
                throw new Error('Encuentro no encontrado para cursoId: ' + cursoLocal._id + ' y número: ' + numero);
            }

            const resultado = await encuentroRepo.delPorId(encuentro._id);
            if (resultado.deletedCount === 0) {
                throw new Error('No se pudo eliminar el encuentro con id: ' + encuentro._id);
            }

            return { success: true };
        } catch (error) {
            console.error('Error eliminando encuentro:', error.message);
            throw error
        }
    }

    async putPorNumeroIdOfertaOficial(numero, cursoId, data) {
        try {
            const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(cursoId);
            if (!cursoLocal) {
                throw new Error('Curso local no encontrado para el idOfertaOficial: ' + cursoId);
            }
            const encuentro = await this.getUnoPorNumeroCursoId(cursoLocal._id, numero)        
            console.log('Encuentro encontrado para actualización:', encuentro)
            if (!encuentro) {
                throw new Error('Encuentro no encontrado para cursoId: ' + cursoLocal._id + ' y número: ' + numero);
            }  
            const resultado = await encuentroRepo.putPorId(encuentro._id, data);
            return resultado;
        } catch (error) {
            console.error('Error actualizando encuentro:', error.message);
            throw error;
        }
    }
}

module.exports = new encuentroService();