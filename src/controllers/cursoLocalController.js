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
        const ciieId = req.user._id;
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


module.exports = {
    vincularCurso,
    getCursosLocales,
    getCursosPorCiieId,
    getCursosPorCargoClaveCiieClave,
    post,
    getPorCiie,
    viewFormAltaPorCargoClaveCiieClave,
    getVincularConSitioOficial,
    postVincularConSitioOficial,
    postEditarCursoPendiente,
    postCrearYVincularConSitioOficial,
}