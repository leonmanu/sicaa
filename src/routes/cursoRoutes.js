const express = require('express');
const router = express.Router();
const cursoExternoController = require('../controllers/cursoExternoController');
const { asegurarRegistro } = require('../middleware/auth');

const {
    post,
    vincularCurso,
    getCursosPorCargoClaveCiieClave,
    getCursosLocales,
    getPorCiie,
    getPorCiieDrupal,
    viewFormAltaPorCargoClaveCiieClave,
    getFlyerCurso,
    getFlyersList,
    deleteCurso,
    getCursoById,
    getCursoByIdEdit,
    putCurso,
    getMisCursos
} = require('../controllers/cursoLocalController');

router
    // ─── rutas estáticas primero ───
    .get('/lista', cursoExternoController.getCursos)
    .get('/mi-cursos', asegurarRegistro, getMisCursos)
    .get('/ciie', asegurarRegistro, getPorCiie)
    .get('/drupal', asegurarRegistro, getPorCiieDrupal)
    .get('/flyers', asegurarRegistro, getFlyersList)
    .get('/flyer/:ofertaId', getFlyerCurso)
    .post('/alta', asegurarRegistro, post)
    .post('/vincularLocal', asegurarRegistro, vincularCurso)
    // ─── rutas dinámicas con slash (dos parámetros) ───
    .get('/:cargoClave/:ciieClave/alta', asegurarRegistro, viewFormAltaPorCargoClaveCiieClave)
    .get('/:cargoClave/:ciieClave', asegurarRegistro, getCursosPorCargoClaveCiieClave)
    // ─── rutas con ID único (un parámetro) ───
    .get('/:id', asegurarRegistro, getCursoByIdEdit)
    .put('/:id', asegurarRegistro, putCurso)
    .delete('/:id', asegurarRegistro, deleteCurso)



module.exports = router;