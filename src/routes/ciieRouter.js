const express = require('express');
const router = express.Router();



const { getDashboard,  getUsuarioPorModelo, putAgenteEstado, getAgentesPendientes} = require('../controllers/ciieController');
const {vistaAsignacionCiie} = require('../controllers/cargoController');
const {getCursos} = require('../controllers/cursoExternoController');
const {  } = require('../controllers/asignacionController');


router
    // url cii
    .get('/dashboard', getDashboard)
    .get('/agentes', getUsuarioPorModelo)
    .post('/agente/cambiar-estado/:dni', putAgenteEstado)
    .get('/estados-pendientes', getAgentesPendientes)
    // URL cargo
    .get('/cargo/asignar', vistaAsignacionCiie)
    .get('/curso/externo', getCursos)


module.exports = router;