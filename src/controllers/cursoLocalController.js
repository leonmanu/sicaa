const cargoService = require('../services/cargoService');
const cursoLocalService = require('../services/cursoLocalService');

const vincularCurso = async (req, res) => {
    try {
        const resultado = await cursoLocalService.vincularCurso(req.body, req.user);
        //console.log('Curso vinculado localmente con éxito:', req.body);
        req.flash('success', 'Curso vinculado localmente con éxito.');
        return res.status(200).json({ 
            success: true, 
            message: 'Curso vinculado correctamente' 
        });
    } catch (error) {
        console.error('Error al vincular el curso:', error.message);
        req.flash('error', 'Error al vincular el curso: ' + error.message);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}

// const getCursosLocales = async (req, res) => {
//     try {
//         const cursos = await cursoLocalService.getCursosLocales();  
//         res.render('pages/curso/cursoLocalList', { 
//             cursos, 
//             title: "Cursos Locales Vinculados" 
//         });
//     } catch (error) {
//         console.error('Error al obtener cursos locales:', error.message);
//         res.status(500).send("Error en el servidor: " + error.message);
//     }
// }

const getCursosLocales = async (req, res) => {
    try {
        const cursos = await cursoLocalService.getCursosLocales();  
        res.render('pages/curso/cursoLocalList', { 
            cursos, 
            title: "Cursos Locales Vinculados" 
        });
    } catch (error) {
        console.error('Error al obtener cursos locales:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const post = async (req, res) => {
    try {
        const cursoCreado = await cursoLocalService.post(req.body, req.user);
        req.flash('success', 'Curso creado correctamente.');
        return res.status(201).json({
            success: true,
            message: 'Curso creado correctamente',
            curso: cursoCreado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo crear el curso.';
        console.error('Error en post:', message);
        req.flash('error', message);
        return res.status(status).json({
            success: false,
            error: message
        });
    }
}

const getVincularConSitioOficial = async (req, res) => {
    try {
        console.log('CIIE:', req.user.referenciaId);
        const ciieClave = await req.user.referenciaId
        const [cursosPendientes, ofertasOficiales] = await Promise.all([
            cursoLocalService.getPendientesVinculacionPorCiie(ciieClave),
            cursoLocalService.getOfertasOficialesDisponibles()
        ]);

        res.render('pages/ciie/cursoVincularOficial', {
            cursosPendientes,
            ofertasOficiales,
            user: req.user,
            title: 'Vincular Cursos con Sitio Oficial'
        });
    } catch (error) {
        console.error('Error al cargar vista de vinculacion oficial:', error.message);
        req.flash('error', 'No se pudo cargar la vista de vinculacion.');
        res.redirect('/ciie/dashboard');
    }
}

const getCalificacionesPendientes = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const cursosPendientes = await cursoLocalService.getPendientesCalificacionesPorCiie(ciieId);

        res.render('pages/ciie/calificacionesList', {
            cursosPendientes,
            user: req.user,
            title: 'Envío de Calificaciones'
        });
    } catch (error) {
        console.error('Error al cargar vista de calificaciones pendientes:', error);
        req.flash('error', 'No se pudo cargar la vista de calificaciones.');
        res.redirect('/ciie/dashboard');
    }
}

const getCalificaciones = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const cursosPendientes = await cursoLocalService.getCalificacionesPorCiie(ciieId);

        res.render('pages/ciie/calificacionesList', {
            cursosPendientes,
            user: req.user,
            title: 'Envío de Calificaciones'
        });
    } catch (error) {
        console.error('Error al cargar vista de calificaciones pendientes:', error);
        req.flash('error', 'No se pudo cargar la vista de calificaciones.');
        res.redirect('/ciie/dashboard');
    }
}

const getCalificacionesCursoDetail = async (req, res) => {
    try {
        const { idOfertaOficial } = req.params;
        const { curso, inscriptosLocales } = await cursoLocalService.getDetalleCalificacionesCurso(idOfertaOficial, req.user);

        res.render('pages/ciie/calificacionesCursoDetail', {
            curso,
            inscriptosLocales,
            user: req.user,
            title: 'Detalle de Calificaciones'
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo cargar el detalle de calificaciones.';
        console.error('Error en getCalificacionesCursoDetail:', message);
        req.flash('error', message);
        if (status === 403 || status === 404 || status === 409) {
            return res.redirect('/ciie/calificaciones');
        }
        return res.redirect('/ciie/dashboard');
    }
}

const postEnviarCalificacionesLote = async (req, res) => {
    try {
        const { cursoIds } = req.body;
        const resultado = await cursoLocalService.enviarCalificacionesPendientesEnLote(cursoIds, req.user);
        return res.status(200).json({
            success: true,
            message: 'Proceso de envío ejecutado.',
            resultado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo enviar el lote de calificaciones.';
        console.error('Error en postEnviarCalificacionesLote:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

const postGuardarYEnviarCalificacionesCurso = async (req, res) => {
    try {
        const { idOfertaOficial } = req.params;
        const { calificaciones } = req.body;

        const resultado = await cursoLocalService.actualizarCalificacionesYEnviarCurso(idOfertaOficial, calificaciones, req.user);
        return res.status(200).json({
            success: true,
            message: 'Calificaciones enviadas y curso actualizado.',
            resultado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo guardar y enviar las calificaciones.';
        console.error('Error en postGuardarYEnviarCalificacionesCurso:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

const postEnviarCalificacionesCurso = async (req, res) => {
    try {
        const { idOfertaOficial } = req.params;
        const resultado = await cursoLocalService.enviarCalificacionesCursoPorOferta(idOfertaOficial, req.user);
        return res.status(200).json({
            success: true,
            message: 'Curso enviado correctamente.',
            resultado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo enviar el curso.';
        console.error('Error en postEnviarCalificacionesCurso:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

const getCalificacionesDocumentosCurso = async (req, res) => {
    try {
        const { idOfertaOficial } = req.params;
        const tipo = String(req.query.tipo || 'ambos').toLowerCase();
        const documentoCurso = await cursoLocalService.getDocumentosCurso(idOfertaOficial, req.user);
        const cursosDocumentos = [documentoCurso];

        const vista = tipo === 'certificados'
            ? 'pages/ciie/calificacionesDocumentosCertificados'
            : tipo === 'acta'
                ? 'pages/ciie/calificacionesDocumentosActa'
                : 'pages/ciie/calificacionesDocumentosAmbos';

        return res.render(vista, {
            cursosDocumentos,
            user: req.user,
            title: 'Documentos del curso'
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudieron obtener los documentos.';
        console.error('Error en getCalificacionesDocumentosCurso:', message);
        req.flash('error', message);
        if (status === 400 || status === 403 || status === 404 || status === 409) {
            return res.redirect('/ciie/certificados');
        }
        return res.redirect('/ciie/dashboard');
    }
}

const getCalificacionesDocumentosLote = async (req, res) => {
    try {
        const tipo = String(req.query.tipo || 'ambos').toLowerCase();
        const rawIds = String(req.query.cursoIds || '');
        const idOfertas = rawIds.split(',').map(id => id.trim()).filter(Boolean);
        const cursosDocumentos = await cursoLocalService.getDocumentosCursosLote(idOfertas, req.user);
        // DEBUG CORRECTO:
        

        const vista = tipo === 'certificados'
            ? 'pages/ciie/calificacionesDocumentosCertificados'
            : tipo === 'acta'
                ? 'pages/ciie/calificacionesDocumentosActa'
                : 'pages/ciie/calificacionesDocumentosAmbos';

        return res.render(vista, {
            cursosDocumentos,
            user: req.user,
            title: 'Documentos por lote'
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudieron obtener los documentos del lote.';
        console.error('Error en getCalificacionesDocumentosLote:', error);
        req.flash('error', message);
        if (status === 400 || status === 403 || status === 404 || status === 409) {
            return res.redirect('/ciie/certificados');
        }
        return res.redirect('/ciie/dashboard');
    }
}

const postMarcarImpresionDocumentos = async (req, res) => {
    try {
        const { idOfertaOficial } = req.params;
        const { tipo } = req.body || {};
        const curso = await cursoLocalService.marcarImpresionDocumentos(idOfertaOficial, tipo, req.user);

        return res.status(200).json({
            success: true,
            message: 'Estado de impresión actualizado.',
            curso
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo actualizar el estado de impresión.';
        console.error('Error en postMarcarImpresionDocumentos:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

const postVincularConSitioOficial = async (req, res) => {
    try {
        const curso = await cursoLocalService.vincularCursoConSitioOficial(req.body, req.user);
        return res.status(200).json({
            success: true,
            message: 'Curso vinculado con el sitio oficial.',
            curso
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo vincular el curso.';
        console.error('Error en postVincularConSitioOficial:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

const postEditarCursoPendiente = async (req, res) => {
    try {
        const curso = await cursoLocalService.editarCursoPendiente(req.body, req.user);
        return res.status(200).json({
            success: true,
            message: 'Curso pendiente actualizado correctamente.',
            curso
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo editar el curso pendiente.';
        console.error('Error en postEditarCursoPendiente:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

    const postCrearYVincularConSitioOficial = async (req, res) => {
        try {
            const resultado = await cursoLocalService.crearYVincularCursoEnSitioOficial(req.body, req.user);
            return res.status(200).json({
                success: true,
                message: 'Curso creado en ABC y vinculado correctamente.',
                ...resultado
            });
        } catch (error) {
            const status = error.statusCode || 500;
            const message = error.message || 'No se pudo crear y vincular el curso.';
            console.error('Error en postCrearYVincularConSitioOficial:', message);
            return res.status(status).json({ success: false, error: message });
        }
    }

const getPorCiie = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const cursosLocales = await cursoLocalService.getCursosPorCiieId(ciieId); 
        res.render('pages/curso/cursoLocalList', { 
            cursosLocales,
            cargo: [],
            user: req.user,
            ciieClave: req.user.clave,
            title: "Cursos Locales Vinculados" 
        });
    } catch (error) {
        console.error('Error al obtener cursos locales:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const getCursosPorCiieId = async (req, res) => {
    try {
        const ciieId = req.user._id;
        console.log('Obteniendo cursos locales para CIIE ID:', ciieId);
        const cursosLocales = await cursoLocalService.getCursosPorCiieId(ciieId);
        
        res.render('pages/curso/cursoListTodos', { //vista pendiente
            cursosLocales, 
            user: req.user,
            title: `Cursos Locales Vinculados al ID Oficial ${ciieId}` 
        });
    } catch (error) {
        console.error('Error al obtener cursos por ID oficial:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const getCursosPorCargoClaveCiieClave = async (req, res) => {
    
    try {
        //const ciieId = req.user.referenciaId;
        const {cargoClave, ciieClave} = req.params
        const {cursosLocales, cargo} = await cursoLocalService.getPorCursoClaveCiieClave(cargoClave, ciieClave);
        
        res.render('pages/curso/cursoLocalList', {
            ciieClave,     // Para mostrar en el título o breadcrumb
            cargo,         // Objeto único
            cursosLocales, // Array para el forEach
            user: req.user
        });
        
    } catch (error) {
        console.error('Error al obtener cursos por ID oficial:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const viewFormAltaPorCargoClaveCiieClave = async (req, res) => {
    try {
        //const ciieId = req.user.referenciaId;
        const {cargoClave, ciieClave} = req.params
        const {cursosLocales, cargo} = await cursoLocalService.getPorCursoClaveCiieClave(cargoClave, ciieClave);
        
        res.render('pages/curso/cursoLocalForm', {
            cargo,         // Objeto único
            cursosLocales, // Array para el forEach
            user: req.user
        });
    } catch (error) {
        console.error('Error al obtener cursos por ID oficial:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const getFlyerCurso = async (req, res) => {
    try {
        const curso = await cursoLocalService.getPorIdOfertaOficial(req.params.ofertaId);
        if (!curso) {
            req.flash('error', 'Curso no encontrado.');
            return res.redirect('back');
        }

        const vistas = {
            'Extensión CIIE':           'pages/flyer/flyerExtension',
            'Taller en Servicio':       'pages/flyer/flyerTaller',
            'Taller Fuera de Servicio': 'pages/flyer/flyerTaller',
            'Seminario':                'pages/flyer/flyerSeminario',
            'MADP + Ateneo':            'pages/flyer/flyerMadp',
            'Ateneo Distancia':         'pages/flyer/flyerMadp',
            'Curso Distancia':          'pages/flyer/flyerOtros',
            'Seminario Distancia':      'pages/flyer/flyerSeminario',
        };

        const vista = vistas[curso.dispositivo] || 'pages/flyer/flyerOtros';

        res.render(vista, { curso, user: req.user });

    } catch (error) {
        console.error('Error al generar flyer:', error);
        res.status(500).send('Error al generar el flyer.');
    }
};


module.exports = {
    vincularCurso,
    getCursosLocales,
    getCursosPorCiieId,
    getCursosPorCargoClaveCiieClave,
    post,
    getPorCiie,
    viewFormAltaPorCargoClaveCiieClave,
    getVincularConSitioOficial,
    getCalificaciones,
    getCalificacionesPendientes,
    getCalificacionesCursoDetail,
    getCalificacionesDocumentosCurso,
    getCalificacionesDocumentosLote,
    postVincularConSitioOficial,
    postEditarCursoPendiente,
    postCrearYVincularConSitioOficial,
    postEnviarCalificacionesLote,
    postGuardarYEnviarCalificacionesCurso,
    postEnviarCalificacionesCurso,
    postMarcarImpresionDocumentos,
    getFlyerCurso
}