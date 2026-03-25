const express = require('express');
const router = express.Router();

const { getCertificadoExterno } = require('../controllers/certificadoExternoController');

router.get('/externo/:idOfertaOficial', getCertificadoExterno);

module.exports = router;