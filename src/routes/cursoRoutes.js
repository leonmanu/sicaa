const express = require('express');
const router = express.Router();
const cursoExternoController = require('../controllers/cursoExternoController');

const {
    post,
    vincularCurso,
    getCursosPorCargoClaveCiieClave,
    getCursosLocales,
    getPorCiie,
    viewFormAltaPorCargoClaveCiieClave,
    getFlyerCurso
} = require('../controllers/cursoLocalController');

router
    .get('/lista', cursoExternoController.getCursos)
    .get('/ciie', getPorCiie)
    .post('/alta', post)
    .post('/vincularLocal', vincularCurso)
    // ─── rutas estáticas primero ───
    .get('/flyer/:ofertaId', getFlyerCurso)
    // ─── rutas dinámicas después ───
    .get('/:cargoClave/:ciieClave', getCursosPorCargoClaveCiieClave)
    .get('/:cargoClave/:ciieClave/alta', viewFormAltaPorCargoClaveCiieClave)



module.exports = router;