const asistenciaRepo = require('../repos/asistenciaRepo');
const cursoLocalService = require('./cursoLocalService');
const encuentroService = require('./encuentroService');

class AsistenciaService {
    async postAsistenciaEncuentro(cursoId, data) {
        try {
            // 1. Buscamos el encuentro por número y cursoId para obtener su _id interno
            const encuentro = await encuentroService.getUnoPorNumeroCursoId(cursoId, data.encuentroNumero);
            if (!encuentro) throw new Error('Encuentro no encontrado para el curso');

            // 2. Guardamos las asistencias usando el repo (que ya filtra por DNI)
            const resultado = await asistenciaRepo.postAsistenciaEncuentro(encuentro._id, data.asistencias, cursoId);

            return resultado;
        } catch (error) {
            console.error('Error en AsistenciaService.postAsistenciaEncuentro:', error.message);
            throw error;
        }
    }

    async postPorIdInscripcionOficial(idOfertaOficial, encuentroNumero, asistencias) {
        try {
            console.log('Datos recibidos en AsistenciaService.postPorIdInscripcionOficial:', asistencias);
            const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(idOfertaOficial);
            // 1. Buscamos el encuentro por número y cursoId para obtener su _id interno
            const encuentro = await encuentroService.getUnoPorNumeroCursoId(cursoLocal._id, encuentroNumero);

            if (!encuentro) throw new Error('Encuentro no encontrado para el curso');

            // 2. Guardamos las asistencias usando el repo (que ya filtra por DNI)
            const resultado = await asistenciaRepo.postPorIdInscripcionOficial(encuentro._id, asistencias);

            return resultado;
        } catch (error) {
            console.error('Error en AsistenciaService.postPorIdInscripcionOficial:', error.message);
            throw error;
        }
    }

    // async postAsistenciaCursante(data) {
    //         try {
    //             const curso = await cursoLocalService.getPorIdOfertaOficial(data.idOfertaOficial);
    //             //console.log('Curso obtenido para idOfertaOficial', data.idOfertaOficial, ':', curso);
    //             if (!curso) throw new Error('Curso no encontrado');
    //             return await asistenciaService.postAsistenciaEncuentro(curso._id, data);
    //         } catch (error) {
    //             console.error('Error al guardar la asistencia:', error);
    //             throw error;
    //         }
    //     }

    async delAsistenciaDeEncuentro(encuentroId, cursoId) {
        try {
            const resultado = await asistenciaRepo.delAsistenciaDeEncuentro(encuentroId);
            
            // Si borramos un encuentro, también hay que recalcular para que el % baje o suba
            if (cursoId) {
                await asistenciaRepo.recalcularEstadisticas(cursoId);
            }

            return resultado;
        } catch (error) {
            console.error('Error en AsistenciaService.delAsistenciaDeEncuentro:', error.message);
            throw error;
        }
    }
}

module.exports = new AsistenciaService();