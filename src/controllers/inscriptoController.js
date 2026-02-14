const inscriptoExternoService = require('../services/inscriptoExternoService')
const inscriptoLocalService = require('../services/inscriptoLocalService')
const cursoLocalService = require('../services/cursoLocalService')

const viewInscripto = async (req, res) => {
    try{
        const { idOfertaOficial } = req.params

        const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(idOfertaOficial)
       
        
        const inscriptoLocal = await inscriptoLocalService.getPorCursoId(cursoLocal._id)

        res.render('pages/cursante/inscriptoLocalList', { 
            inscriptoExterno: [], // El array raw del ABC
            inscriptoLocal,          // Para comparar quién ya tiene pareja
            cursoLocal,                 // Para llenar el <select> del modal
            title: "Sincronización de Inscripto",
            user: req.user
        });

    } catch (error) {
        console.error('Error en listar inscriptos:', error.message);
        req.flash('error', 'Error asignar cargo.');
        // 5. Manejo de errores (400 para errores de validación/negocio)
        res.redirect(`/pages/error`);
    }
}

const viewListaAsistencia = async (req, res) => {
    try{
        const { idOfertaOficial } = req.params

        const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(idOfertaOficial)
       
        
        const inscriptosLocales = await inscriptoLocalService.getPorCursoId(cursoLocal._id)

        res.render('pages/cursante/listaAsistencia', { 
            inscriptoExterno: [], // El array raw del ABC
            inscriptosLocales,          // Para comparar quién ya tiene pareja
            cursoLocal,                 // Para llenar el <select> del modal
            title: "Sincronización de Inscripto",
            user: req.user
        });

    } catch (error) {
        console.error('Error en listar inscriptos:', error.message);
        req.flash('error', 'Error asignar cargo.');
        // 5. Manejo de errores (400 para errores de validación/negocio)
        res.redirect(`/pages/error`);
    }
}

const getExternosPorIdOfertaOficial = async (req, res) => {
    try {
        const { idOfertaOficial } = req.params;

        // 1. Buscamos los datos del curso local para tener los IDs necesarios
        const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(idOfertaOficial);

        if (!cursoLocal) {
            return res.status(404).json({ error: 'Curso no encontrado en la base local.' });
        }


        // 2. Traemos la lista "raw" desde el scraping del ABC
        const inscriptosRaw = await inscriptoExternoService.listarCursantes(
            cursoLocal.idOfertaOficial, 
            cursoLocal.idCursoOriginal
        );

        // 3. (Opcional pero recomendado) Filtrar aquí los que ya existen
        // Esto evita que el front tenga que procesar de más
        const inscriptoLocal = await inscriptoLocalService.getIdInscripcionPorCursoId(cursoLocal._id);
        
        const nuevos = inscriptosRaw.filter(ins => !inscriptoLocal.includes(String(ins[0])));

        // 4. Respondemos con JSON (Importante: res.json en lugar de res.send)
        res.json({ 
            nuevos, 
            totalEnAbc: inscriptosRaw.length 
        });

    } catch (error) {
        console.error('Error en listar inscriptos:', error.message);
        // En una petición AJAX, respondemos con un status de error y JSON, NO redirect
        res.status(500).json({ error: 'No se pudo obtener la lista del ABC.' });
    }
}

const vincularCursantes = async (req, res) => {
    try {
        // 1. Extraemos los datos del body (que vienen del AJAX)
        const { idOfertaOficial, data } = req.body; 

        console.log("idOfertaOficial: ", idOfertaOficial)
        const usuarioEmail = req.user.email; // Obtenemos el email del usuario logueado

        // 2. Pasamos los parámetros al Service
        // data es el array de inscriptos (temporalNuevos en el front)
        const resultado = await inscriptoLocalService.vincularColeccion(data, idOfertaOficial, usuarioEmail);
        
        // No es estrictamente necesario el flash en AJAX si vas a hacer location.reload(),
        // pero lo dejamos por si acaso.
        req.flash('success', `Se vincularon ${resultado.count} nuevos inscriptos.`);

        return res.status(200).json({ 
            success: true, 
            message: resultado.message,
            count: resultado.count
        });

    } catch (error) {
        console.error('Error al vincular cursantes:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno al procesar la vinculación.' 
        });
    }
}

module.exports = { 
    viewInscripto,
    getExternosPorIdOfertaOficial,
    vincularCursantes,
    viewListaAsistencia
}