const express = require('express');
const router = express.Router();

const { getCertificadoExterno } = require('../controllers/certificadoExternoController');
const { asegurarRegistro } = require('../middleware/auth');

router.get('/externo/:idOfertaOficial', asegurarRegistro, getCertificadoExterno);

module.exports = router;
