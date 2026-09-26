const express = require('express');
const router = express.Router();
const cursanteExternoController = require('../controllers/cursanteExternoController');
const { asegurarRegistro } = require('../middleware/auth');

router
    .get('/inscriptos/:idInscripcion', asegurarRegistro, cursanteExternoController.getCursantes)
    .post('/calificar', asegurarRegistro, cursanteExternoController.calificar);

module.exports = router;
