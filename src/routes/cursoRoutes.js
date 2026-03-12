const express = require('express');
const router = express.Router();
const cursoExternoController = require('../controllers/cursoExternoController');

const {
    post,
    vincularCurso,
    getCursosPorCargoClaveCiieClave,
    getCursosLocales,
    getPorCiie,
    viewFormAltaPorCargoClaveCiieClave
} = require('../controllers/cursoLocalController');

router
    //Externos
    .get('/lista', cursoExternoController.getCursos)
    //Locales
    .get('/ciie', getPorCiie)
    .get('/:cargoClave/:ciieClave', getCursosPorCargoClaveCiieClave)
    .get('/:cargoClave/:ciieClave/alta', viewFormAltaPorCargoClaveCiieClave)
    .post('/alta', post)
    .post('/vincularLocal', vincularCurso)



module.exports = router;