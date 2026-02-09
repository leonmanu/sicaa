//inscriptoExternoService

const cheerio = require('cheerio');
const fs = require('fs');
const inscriptoExternoRepo = require('../repos/inscriptoExternoRepo');
const sesionService = require('./sesionService');

class InscriptoExternoService {
    async listarCursantes(idInscripcion, idCurso) {
        await sesionService.asegurarSesion();

        // 1. IMPORTANTE: "Avisarle" al ABC qué curso queremos ver
        // Esto setea las variables de sesión en el servidor del ABC
        await inscriptoExternoRepo.sincronizarFiltros(idInscripcion, idCurso);

        // 2. Ahora sí pedimos los datos
        let response = await inscriptoExternoRepo.getRawCursantes(idInscripcion, idCurso);

        // 3. Lógica de reintento
        if (!response.data?.aaData || response.data.aaData.length === 0 || typeof response.data === 'string') {
            console.log('🔄 Re-intentando por posible sesión expirada...');
            await sesionService.asegurarSesion(true);
            
            // Volvemos a sincronizar filtros tras el nuevo login
            await inscriptoExternoRepo.sincronizarFiltros(idInscripcion, idCurso);
            response = await inscriptoExternoRepo.getRawCursantes(idInscripcion, idCurso);
        }
        const rawData = response.data?.aaData || [];
        console.log(rawData[0][1]);
        return rawData.sort((a, b) =>
            a[1].localeCompare(b[1], 'es', { sensitivity: 'base' })
        );
    }

    async probarFichaDocente(idDocente) {
    try {
        const response = await inscriptoExternoRepo.getHtmlDocente(idDocente);
        const html = response.data;

        console.log("\n=== DIAGNÓSTICO ===");
        console.log("Status:", response.status);
        console.log("Content-Length:", html.length);
        console.log("Tiene form:", html.toLowerCase().includes('<form'));
        console.log("Tiene CUIL:", html.toLowerCase().includes('cuil'));

        // Verificar si es la página de login (sesión expirada)
        if (html.includes('Inicio de Sesión')) {
            return { error: "Sesión expirada - esto no debería pasar si el repo maneja bien el reintento" };
        }

        // Verificar que tengamos el formulario
        if (!html.toLowerCase().includes('<form')) {
            console.log("Primeros 500 caracteres:", html.substring(0, 500));
            return { error: "No se encontró el formulario" };
        }

        // Extraer datos con Cheerio
        const $ = cheerio.load(html);
        
        console.log("\n=== INPUTS ENCONTRADOS ===");
        const datos = {};
        $('input[type="text"], input[type="hidden"], input:not([type])').each((i, el) => {
            const name = $(el).attr('name');
            const value = $(el).val();
            if (name) {
                
                datos[name] = value;
            }
        });

        return datos

        // return {
        //     cuil: datos.cuil || 'No encontrado',
        //     apellido: datos.apellido || 'No encontrado',
        //     nombres: datos.nombres || 'No encontrado',
        //     email: datos.email || 'No encontrado',
        //     telefono: datos.telefono || 'No encontrado',
        //     todosLosDatos: datos
        // };

    } catch (error) {
        console.error("Error en probarFichaDocente:", error.message);
        throw error;
    }
}
    async cambiarNota(idInscripcion, nota, idCursoBase) {
        await sesionService.asegurarSesion();
        // Pasamos los datos al repo
        return await inscriptoExternoRepo.actualizarCalificacion(idInscripcion, nota, idCursoBase);
    }

    async getDetalleCursantePorIdInscripcion(idInscripcion, idCurso) {
        try {
            const response = await inscriptoExternoRepo.getHtmlDocente(idInscripcion, idCurso);
            return response;
        } catch (error) {
            console.error("Error en getDetalleCursantePorIdInscripcion:", error.message);
            throw error;
        }
    }
}

module.exports = new InscriptoExternoService();