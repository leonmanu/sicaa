const express = require('express');
const router = express.Router();
const { soloCiie } = require('../middleware/auth');

const {
    postCrear,
    postDuplicar,
    getLista,
    getPreview,
    postImagen,
    postPublicar,
    putActualizar,
    deleteEliminar,
    getConfiguracion,
    postConfiguracion,
    postVerificarMeta,
    postConexionMeta,
    postDesconectarMeta
} = require('../controllers/publicacionController');

router
    // ─── rutas estáticas primero ───
    .get('/', soloCiie, getLista)
    .get('/configuracion', soloCiie, getConfiguracion)
    .post('/configuracion', soloCiie, postConfiguracion)
    .post('/configuracion/verificar-meta', soloCiie, postVerificarMeta)
    .post('/configuracion/conexion-meta', soloCiie, postConexionMeta)
    .post('/configuracion/desconectar-meta', soloCiie, postDesconectarMeta)
    .post('/', soloCiie, postCrear)
    // ─── rutas con ID ───
    .get('/:id/preview', soloCiie, getPreview)
    .post('/:id/imagenes', soloCiie, postImagen)
    .post('/:id/publicar', soloCiie, postPublicar)
    .post('/:id/duplicar', soloCiie, postDuplicar)
    .put('/:id', soloCiie, putActualizar)
    .delete('/:id', soloCiie, deleteEliminar);

module.exports = router;
