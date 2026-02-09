const express = require('express');
const router = express.Router();
const cursoExternoController = require('../controllers/cursoExternoController');

const { vincularCurso} = require('../controllers/cursoLocalController');

router
    .get('/lista', cursoExternoController.getCursos)
    .post('/vincularLocal', vincularCurso);

module.exports = router;