const express = require('express');
const router = express.Router();

const cursoBaseController = require('../controllers/cursoBaseController');

router
    .get('/', cursoBaseController.get)
    .get('/getNuevosaBC', cursoBaseController.getExternos)
    .post('/sincronizar', cursoBaseController.sincronizar)
    

module.exports = router;




