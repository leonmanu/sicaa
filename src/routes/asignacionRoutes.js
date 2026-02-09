const express = require('express');
const router = express.Router();
const { crearAsignacion } = require('../controllers/asignacionController');

router.post('/', crearAsignacion);

module.exports = router;