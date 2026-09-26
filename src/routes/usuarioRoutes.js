const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// No usamos asegurarRegistro acá: esa función compara req.path contra el string
// literal '/usuario/alta', pero dentro de este router (montado en /usuario)
// req.path ya viene sin el prefijo (ej: '/alta'), así que nunca matchea y
// terminaría redirigiendo esta misma página a sí misma en bucle.
// Esta pantalla es justamente la vía de escape para completar el registro,
// así que solo exigimos estar logueado con Google (autorizado o no).
const soloLogueado = (req, res, next) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    next();
};

router
    .get('/alta', soloLogueado, usuarioController.postUsuarioForm)
    .post('/alta', soloLogueado, usuarioController.postUsuario)
    .get('/cargo', soloLogueado, usuarioController.getcargos);
module.exports = router;
