// src/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middleware interno para asegurar que solo vos (leonmanu) pases
const { asegurarRegistro, esAdmin, puedeConsultar, dashboard } = require('../middleware/auth');
const { getDashboard, getPorModelo, getUsuarioPorModelo, cambiarEstadoUsuario } = require('../controllers/adminController');


// Dashboard principal: ver pendientes
router.get('/dashboard', asegurarRegistro, puedeConsultar, getDashboard);
router.get('/ciies', asegurarRegistro, esAdmin, getPorModelo);

// Acción de aprobar
router.post('/aprobar/:id', asegurarRegistro, esAdmin, getUsuarioPorModelo);
// Usamos :clave para identificar al usuario
router.post('/usuario/cambiar-estado/:clave', asegurarRegistro, esAdmin, cambiarEstadoUsuario);

module.exports = router;