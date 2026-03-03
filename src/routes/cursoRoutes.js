const express = require('express');
const router = express.Router();
const cursoExternoController = require('../controllers/cursoExternoController');

const {
    vincularCurso,
    getCursosPorCargoClaveCiieClave,
    getCursosLocales,
    getPorCiie
} = require('../controllers/cursoLocalController');

router
    //Locales
    .get('/ciie', getPorCiie)
    .get('/:cargoClave/:ciieClave', getCursosPorCargoClaveCiieClave)
    .post('/vincularLocal', vincularCurso)

    //Externos
    .get('/lista', cursoExternoController.getCursos)

module.exports = router;