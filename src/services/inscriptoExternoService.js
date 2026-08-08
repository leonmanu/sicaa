// src/services/inscriptoExternoService.js
const cheerio = require('cheerio');
const inscriptoExternoRepo = require('../repos/inscriptoExternoRepo');
const sesionService = require('./sesionService');

class InscriptoExternoService {

    async listarCursantes(idInscripcion, idCurso) {
    await sesionService.asegurarSesion();

    try {
        await inscriptoExternoRepo.sincronizarFiltros(idInscripcion, idCurso);
        let response = await inscriptoExternoRepo.getRawCursantes(idInscripcion, idCurso);

        // Si la respuesta viene vacía o como HTML (sesión expirada)
        if (!response.data?.aaData || response.data.aaData.length === 0 || typeof response.data === 'string') {
            throw new Error('Respuesta inválida, forzando renovación de sesión');
        }

        const rawData = response.data.aaData;
        return rawData.sort((a, b) =>
            a[1].localeCompare(b[1], 'es', { sensitivity: 'base' })
        );

    } catch (err) {
        console.log('🔄 Re-intentando listarCursantes por posible sesión expirada...');
        await sesionService.asegurarSesion(true);
        await inscriptoExternoRepo.sincronizarFiltros(idInscripcion, idCurso);
        const response = await inscriptoExternoRepo.getRawCursantes(idInscripcion, idCurso);

        const rawData = response.data?.aaData || [];
        return rawData.sort((a, b) =>
            a[1].localeCompare(b[1], 'es', { sensitivity: 'base' })
        );
    }
}

    async probarFichaDocente(idDocente) {
        try {
            // ✅ AGREGADO: asegurar sesión antes de pedir el HTML
            await sesionService.asegurarSesion();
            let response = await inscriptoExternoRepo.getHtmlDocente(idDocente);
            let html = response.data;

            // ✅ AGREGADO: reintento si la respuesta es la página de login
            if (html.includes('Inicio de Sesión') || typeof html !== 'string' || !html.toLowerCase().includes('<form')) {
                console.log('🔄 Sesión expirada en probarFichaDocente, renovando...');
                await sesionService.asegurarSesion(true);
                response = await inscriptoExternoRepo.getHtmlDocente(idDocente);
                html = response.data;
            }

            if (html.includes('Inicio de Sesión')) {
                return { error: "Sesión expirada incluso tras renovar" };
            }

            if (!html.toLowerCase().includes('<form')) {
                return { error: "No se encontró el formulario" };
            }

            const $ = cheerio.load(html);
            const datos = {};
            $('input[type="text"], input[type="hidden"], input:not([type])').each((i, el) => {
                const name = $(el).attr('name');
                const value = $(el).val();
                if (name) datos[name] = value;
            });

            return datos;

        } catch (error) {
            console.error("Error en probarFichaDocente:", error.message);
            throw error;
        }
    }

    async cambiarNota(idInscripcion, nota, idCursoBase) {
        await sesionService.asegurarSesion();
        let response = await inscriptoExternoRepo.actualizarCalificacion(idInscripcion, nota, idCursoBase);

        // ✅ AGREGADO: reintento si la respuesta indica sesión expirada
        if (!response?.data || typeof response.data === 'string') {
            console.log('🔄 Re-intentando cambiarNota por posible sesión expirada...');
            await sesionService.asegurarSesion(true);
            response = await inscriptoExternoRepo.actualizarCalificacion(idInscripcion, nota, idCursoBase);
        }

        return response;
    }

    _parseRespuestaRegistro(raw) {
        const texto = String(raw ?? '').trim();
        if (texto.length < 3) {
            return { exito: false, mensaje: 'El sistema oficial no devolvió respuesta.' };
        }

        const codigo = parseInt(texto.substring(0, 2), 10);
        const resto = texto.substring(3);

        if (Number.isFinite(codigo) && codigo >= 90) {
            const [idInscripcionOficial, nombreCurso, region, nombreCiie] = resto.split('~');
            return {
                exito: true,
                idInscripcionOficial: idInscripcionOficial || '',
                nombreCurso: nombreCurso || '',
                region: region || '',
                nombreCiie: nombreCiie || ''
            };
        }

        return { exito: false, codigo, mensaje: resto || 'El sistema oficial rechazó la inscripción.' };
    }

    async registrarInscripcion(datos) {
        const intentarPeticion = async (esReintento = false) => {
            await sesionService.asegurarSesion(esReintento);
            return await inscriptoExternoRepo.postRegistrarInscripcion(datos);
        };

        try {
            let response = await intentarPeticion();

            if (typeof response.data === 'string' && response.data.includes('Inicio de Sesión')) {
                console.log('🔄 Sesión expirada en registrarInscripcion, renovando...');
                response = await intentarPeticion(true);
            }

            return this._parseRespuestaRegistro(response.data);
        } catch (error) {
            console.error('Error en registrarInscripcion:', error.message);
            throw error;
        }
    }

    async getDetalleCursantePorIdInscripcion(idInscripcion, idCurso) {
        try {
            // ✅ AGREGADO: asegurar sesión antes de pedir el detalle
            await sesionService.asegurarSesion();
            let response = await inscriptoExternoRepo.getHtmlDocente(idInscripcion, idCurso);

            // ✅ AGREGADO: reintento si el HTML es la página de login
            if (typeof response.data === 'string' && response.data.includes('Inicio de Sesión')) {
                console.log('🔄 Re-intentando getDetalleCursante por sesión expirada...');
                await sesionService.asegurarSesion(true);
                response = await inscriptoExternoRepo.getHtmlDocente(idInscripcion, idCurso);
            }

            return response;
        } catch (error) {
            console.error("Error en getDetalleCursantePorIdInscripcion:", error.message);
            throw error;
        }
    }
}

module.exports = new InscriptoExternoService();