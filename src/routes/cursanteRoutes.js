const express = require('express');
const router = express.Router();
const cursanteExternoController = require('../controllers/cursanteExternoController');

router
    .get('/inscriptos/:idInscripcion', cursanteExternoController.getCursantes)
    .post('/calificar', cursanteExternoController.calificar);

module.exports = router;

