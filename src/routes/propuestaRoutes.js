const express = require('express');
const router = express.Router();
const cursoExternoController = require('../controllers/propuestaExternaController');

const {
    vincularCurso,
    getCursosPorCargoClaveCiieClave,
    getCursosLocales,
    getPorCiie,
    viewFormAltaPorCargoClaveCiieClave
} = require('../controllers/propuestaLocalController');

router
    //Locales
    .get('/ciie', getPorCiie)
    .get('/:cargoClave/:ciieClave', getCursosPorCargoClaveCiieClave)
    .get('/:cargoClave/:ciieClave/alta', viewFormAltaPorCargoClaveCiieClave)
    .post('/vincularLocal', vincularCurso)

    //Externos
    .get('/lista', cursoExternoController.getCursos)

module.exports = router;




