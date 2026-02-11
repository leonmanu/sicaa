const express = require('express');
const router = express.Router();



const { getDashboard,  getUsuarioPorModelo, putAgenteEstado, getAgentesPendientes} = require('../controllers/ciieController');
const {vistaAsignacionCiie, vistaCargosEtr} = require('../controllers/cargoController');
const {getCursos} = require('../controllers/cursoExternoController');
const {getCursosPorCiieId, getCursosPorCargoClaveCiieId} = require('../controllers/cursoLocalController')
const { viewInscripto, getExternosPorIdOfertaOficial, vincularCursantes } = require('../controllers/inscriptoController')

router
    // url cii
    .get('/dashboard', getDashboard)
    .get('/agentes', getUsuarioPorModelo)
    .post('/agente/cambiar-estado/:dni', putAgenteEstado)
    .get('/estados-pendientes', getAgentesPendientes)
    // URL cargo
    .get('/cargo/asignar', vistaAsignacionCiie)
    .get('/cargos/etr', vistaCargosEtr)
    // URL curso
    .get('/curso/externo', getCursos)
    .get('/cursos', getCursosPorCiieId) //vista pendiente
    .get('/cursos/cargo/:cargoClave', getCursosPorCargoClaveCiieId)

    .get('/inscriptos/curso/:idOfertaOficial', viewInscripto)


module.exports = router;