const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

router
    .get('/alta', usuarioController.postUsuarioForm)
    .post('/alta', usuarioController.postUsuario)
    .get('/cargo', usuarioController.getcargos);
module.exports = router;