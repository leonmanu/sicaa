const express = require('express');
const router = express.Router();
const { soloCiie } = require('../middleware/auth');

const {
    getLista,
    postCrear,
    putActualizar,
    deleteEliminar
} = require('../controllers/plantillaDispositivoController');

router
    .get('/', soloCiie, getLista)
    .post('/', soloCiie, postCrear)
    .put('/:id', soloCiie, putActualizar)
    .delete('/:id', soloCiie, deleteEliminar);

module.exports = router;
