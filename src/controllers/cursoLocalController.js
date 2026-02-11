const cargoService = require('../services/cargoService');
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

const getCursosPorCargoClaveCiieId = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const {cargoClave} = req.params
        const cargo = await cargoService.getPorCargoClaveCiieId(cargoClave, ciieId)
        console.log('CARGO: ',cargo)
        const cursosLocales = await cursoLocalService.getPorCargoId(cargo._id)
        
        res.render('pages/curso/cursoLocalList', {
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
    getCursosPorCargoClaveCiieId
}