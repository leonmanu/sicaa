const Publicacion = require('../models/Publicacion');

class PublicacionRepo {

    async getPorId(id) {
        try {
            return await Publicacion.findById(id);
        } catch (error) {
            if (error.name === 'CastError') return null;
            console.error('Error en PublicacionRepo.getPorId:', error.message);
            throw error;
        }
    }

    // Solo las publicaciones de esta institución (nunca las de otro CIIE).
    async getTodas(ciieId) {
        try {
            return await Publicacion.find({ ciieId })
                .sort({ createdAt: -1 })
                .populate({ path: 'cursoLocalIds', select: 'tituloFormulario nombrePropuesta dispositivo' })
                .lean();
        } catch (error) {
            console.error('Error en PublicacionRepo.getTodas:', error.message);
            throw error;
        }
    }

    // Una individual de esta propuesta que todavía no salió por ninguna red.
    async getBorradorIndividual(cursoLocalId, ciieId) {
        try {
            return await Publicacion.findOne({
                ciieId,
                tipo: 'individual',
                cursoLocalIds: [cursoLocalId],
                'facebook.estado': { $in: ['pendiente', 'error'] },
                'instagram.partes': { $not: { $elemMatch: { estado: { $in: ['publicado', 'publicando'] } } } }
            }).sort({ createdAt: -1 });
        } catch (error) {
            console.error('Error en PublicacionRepo.getBorradorIndividual:', error.message);
            throw error;
        }
    }

    // Para el historial en listados de cursos: solo lo necesario.
    async getConCursos(cursoLocalIds) {
        try {
            return await Publicacion.find({ cursoLocalIds: { $in: cursoLocalIds } })
                .select('cursoLocalIds facebook.estado facebook.publicadoEn instagram.partes.cursoLocalIds instagram.partes.estado instagram.partes.publicadoEn')
                .lean();
        } catch (error) {
            console.error('Error en PublicacionRepo.getConCursos:', error.message);
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
