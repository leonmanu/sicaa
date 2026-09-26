const express = require('express');
const router = express.Router();
const { asegurarRegistro } = require('../middleware/auth');

const {

    getCargos
    } = require('../controllers/cargoController')
// Aquí importarías tus middlewares de autenticación
// const { isAuthenticated, isCiie } = require('../middlewares/auth');

// Ruta principal para ver el panel de asignación
// GET /cargos/gestion-planta
//router.get('/asignar', vistaAsignacion);
router.get('/todos', asegurarRegistro, getCargos);

module.exports = router;
