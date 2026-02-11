const cargoService = require('../services/cargoService');
const cursoExternoService = require('../services/cursoExternoService');
const cursoLocalService = require('../services/cursoLocalService');
const inscriptoExternoService = require('../services/inscriptoExternoService');

const getCursos = async (req, res) => {
    try {
        // Ejecutamos las 3 consultas en paralelo
        const [cursosExternos, cursosLocales, cargos] = await Promise.all([
            cursoExternoService.listarCursos(), // Fetch al ABC
            cursoLocalService.getCursosLocales(),              // Cursos ya vinculados en Mongo
            cargoService.getConRolAreaCiie(req.user.referenciaId),               // Planta para el modal de asignación
            
        ]);
        console.log('Cursos externos obtenidos del ABC:', cursosExternos[0]);
        // Renderizamos con toda la "foto" completa
        res.render('pages/curso/cursoExternoList', { 
            cursosExternos, // El array raw del ABC
            cursosLocales,          // Para comparar quién ya tiene pareja
            cargos,                 // Para llenar el <select> del modal
            title: "Sincronización de Cursos",
            user: req.user
        });

    } catch (error) {
        console.error('Error al orquestar datos de cursos:', error.message);
        req.flash('error', 'Error al orquestar datos de cursos:', error.message);
        res.status(500).render('pages/error', { 
            error: "No se pudo conectar con el sitio oficial o la base de datos." 
        });
    }
}

const getCursosPorCiieId = async (req, res) => {
    try {
        // Ejecutamos las 3 consultas en paralelo
        const cursosLocales = await cursoLocalService.getCursosLocales()

        console.log('Cursos externos obtenidos del ABC:', cursosLocales[0]);
        // Renderizamos con toda la "foto" completa
        res.render('pages/curso/cursoExternoList', { 
            cursosLocales,          // Para comparar quién ya tiene pareja
            title: "Sincronización de Cursos",
            user: req.user
        });

    } catch (error) {
        console.error('Error al orquestar datos de cursos:', error.message);
        req.flash('error', 'Error al orquestar datos de cursos:', error.message);
        res.status(500).render('pages/error', { 
            error: "No se pudo conectar con el sitio oficial o la base de datos." 
        });
    }
}

// esto es para calificar pero lo tendré que cambiar
const calificar = async (req, res) => {
    try {
        const { id, nota } = req.body;
        // Llamamos al service que ya configuramos
        await inscriptoExternoService.cambiarNota(id, nota);
        
        res.json({ success: true, id: id });
    } catch (error) {
        console.error(`❌ Error al calificar ID ${req.body.id}:`, error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { 
    getCursos, 
    calificar,
    getCursosPorCiieId
}