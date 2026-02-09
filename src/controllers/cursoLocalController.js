const cursoLocalService = require('../services/cursoLocalService');

const vincularCurso = async (req, res) => {
    try {
        const resultado = await cursoLocalService.vincularCurso(req.body, req.user);
        console.log('Curso vinculado localmente con éxito:', req.body);
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

const getCursosPorCiiId = async (req, res) => {
    try {
        const { ciiId } = req.params;
        const cursos = await cursoLocalService.getCursosPorCiiId(ciiId);
        res.render('pages/curso/cursoLocalList', { 
            cursos, 
            title: `Cursos Locales Vinculados al ID Oficial ${ciiId}` 
        });
    } catch (error) {
        console.error('Error al obtener cursos por ID oficial:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}


module.exports = {
    vincularCurso,
    getCursosLocales,
    getCursosPorCiiId
}