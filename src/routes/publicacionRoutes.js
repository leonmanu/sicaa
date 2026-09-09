const express = require('express');
const router = express.Router();
const { soloCiie } = require('../middleware/auth');

const {
    postCrear,
    postCrearAgrupada,
    getLista,
    getPreview,
    postImagenYPublicar,
    putActualizar,
    deleteEliminar,
    getConfiguracion,
    postConfiguracion,
    getDiagnosticoMeta
} = require('../controllers/publicacionController');

router
    // ─── rutas estáticas primero ───
    .get('/', soloCiie, getLista)
    .get('/diagnostico-meta', soloCiie, getDiagnosticoMeta)
    .get('/configuracion', soloCiie, getConfiguracion)
    .post('/configuracion', soloCiie, postConfiguracion)
    .post('/agrupada', soloCiie, postCrearAgrupada)
    .post('/', soloCiie, postCrear)
    // ─── rutas con ID ───
    .get('/:id/preview', soloCiie, getPreview)
    .post('/:id/publicar', soloCiie, postImagenYPublicar)
    .put('/:id', soloCiie, putActualizar)
    .delete('/:id', soloCiie, deleteEliminar);

module.exports = router;
