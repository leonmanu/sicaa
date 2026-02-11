const cargoRepo = require('../repos/cargoRepo');
const cursoLocalRepo = require('../repos/cursoLocalRepo');
const cargoService = require('./cargoService');
const { getCargoPorClave } = require('./cargoService');
const ciieService = require('./ciieService');

class CursoLocalService {
    async vincularCurso(data, usuario) {
    try {
        const raw = data.cursoRaw;
        console.log("DEBUG - Datos recibidos en Service:", raw);

        // Validación preventiva
        if (!Array.isArray(raw) || raw.length < 10) {
            throw new Error("El formato de datos del curso es inválido");
        }
        const cargo = await cargoRepo.findByClave(data.cargoClave);
        const dataParaGuardar = {
            idOfertaOficial: String(raw[0]),
            anio: Number(raw[1]) || new Date().getFullYear(), // Fallback al año actual si falla
            fechaInicioInscripcion: this._parseFechaAbc(raw[3]),
            fechaFinInscripcion: this._parseFechaAbc(raw[4]),
            fechaInicioCurso: this._parseFechaAbc(raw[5]),
            fechaFinCurso: this._parseFechaAbc(raw[6]),
            cupo: Number(raw[8]) || 0,
            nombrePropuesta: raw[9] || "Sin nombre",
            dispositivo: raw[10] || "No especificado",
            enlaceInscripcion: raw[12] || "",
            idCursoOriginal: raw[13] || null,
            formadorAbc: raw[17] || "A designar",
            
            cargoId: cargo._id,
            ciieId: usuario._id,
            estado: 'vinculado',
            creadoPor: usuario.email
        };

        console.log("Data lista para persistir:", dataParaGuardar);
        return await cursoLocalRepo.postCursoLocal(dataParaGuardar);
        
    } catch (error) {
        console.error('Error detallado:', error);
        throw error;
    }
}
    // Helper para convertir strings del ABC a objetos Date de JS
    _parseFechaAbc(fechaStr) {
        if (!fechaStr || fechaStr === '0' || typeof fechaStr !== 'string') return null;
        // El formato es DD-MM-YYYY o DD-MM-YYYY HH:mm:ss
        const [fecha, hora] = fechaStr.split(' ');
        const [dia, mes, anio] = fecha.split('-');
        // En JS los meses van de 0 a 11
        return new Date(anio, mes - 1, dia);
    }
    async getCursosLocales() {
        try {
            return await cursoLocalRepo.getTodos();
        } catch (error) {
            console.error('Error obteniendo cursos locales:', error.message);
            throw error;
        }
    }

    async getCursosPorCiieId(ciieId) {
        try {
            return await cursoLocalRepo.getPorCiieId(ciieId);
        } catch (error) {
            console.error('Error obteniendo curso por ID oficial:', error.message);
            throw error;
        }
    }

    async getPorCursoClaveCiieId(cargoClave, ciieId) {
        try {
            console.log("getPorCursoClaveCiieId - service", cargoClave, ciieId)
            const cargo = cargoService.getPorCargoClaveCiieId(cargoClave, ciieId)
            return await cursoLocalRepo.getPorCursoClaveCiieId(cargoClave, ciieId);
        } catch (error) {
            console.error('Error obteniendo cursos por clave de cargo y CIIE:', error.message)
            throw error;
        }
    }

    async getPorCursoIdCiieId(cargoId, ciieId) {
        try {
            console.log("getPorCursoClaveCiieId - service", cargoId, ciieId)
            const cargo = cargoService.getPorCargoClaveCiieId(cargoClave, ciieId)
            return await cursoLocalRepo.getPorCursoClaveCiieId(cargoId, ciieId);
        } catch (error) {
            console.error('Error obteniendo cursos por clave de cargo y CIIE:', error.message)
            throw error;
        }
    }


    async getPorCargoId(cargoId) {
        try {
            return await cursoLocalRepo.getPorCargoId(cargoId)
        } catch (error) {
            console.error('Error obteniendo cursos por clave de cargo y CIIE:', error.message)
            throw error;
        }
    }

    async getPorIdOfertaOficial(ofertaId) {
        try {
            return await cursoLocalRepo.getPorIdOfertaOficial(ofertaId)
        } catch (error) {
            console.error('Error obteniendo cursos por clave de cargo y CIIE:', error.message)
            throw error;
        }
    }
}

module.exports = new CursoLocalService();