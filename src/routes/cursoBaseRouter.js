const express = require('express');
const router = express.Router();

const cursoBaseController = require('../controllers/cursoBaseController');

router
    .get('/', cursoBaseController.getPorCiie) // esto sirve sólo para usuarios CIIEs
    .get('/getNuevosaBC', cursoBaseController.getExternos)
    .get('/porCiie/:ciieClave', cursoBaseController.getPorCiieClavejson) // ajax Nuevo endpoint para obtener por ciieClave
    .post('/sincronizar', cursoBaseController.sincronizar)
    

module.exports = router;




