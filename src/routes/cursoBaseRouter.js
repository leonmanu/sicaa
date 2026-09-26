const express = require('express');
const router = express.Router();

const cursoBaseController = require('../controllers/cursoBaseController');
const { asegurarRegistro, soloCiie } = require('../middleware/auth');

router
    .get('/', soloCiie, cursoBaseController.getPorCiie) // esto sirve sólo para usuarios CIIEs
    .get('/getNuevosaBC', soloCiie, cursoBaseController.getExternos)
    .get('/porCiie/:ciieClave', asegurarRegistro, cursoBaseController.getPorCiieClavejson) // ajax Nuevo endpoint para obtener por ciieClave
    .post('/sincronizar', soloCiie, cursoBaseController.sincronizar)


module.exports = router;
