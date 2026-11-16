const express = require('express');
const router = express.Router();
const { soloCiie, esAdmin } = require('../middleware/auth');

const {
    getLista,
    postCrear,
    putActualizar,
    deleteEliminar
} = require('../controllers/plantillaDispositivoController');

// Las plantillas las define la DFDP y son comunes a todos los CIIE: cualquier
// CIIE las puede consultar, pero solo el administrador las crea, edita o borra.
const ciieOAdmin = (req, res, next) => (req.user?.rol === 'admin' ? next() : soloCiie(req, res, next));

router
    .get('/', ciieOAdmin, getLista)
    .post('/', esAdmin, postCrear)
    .put('/:id', esAdmin, putActualizar)
    .delete('/:id', esAdmin, deleteEliminar);

module.exports = router;
