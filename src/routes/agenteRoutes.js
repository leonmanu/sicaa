const express = require('express');
const router = express.Router();
const cursanteExternoController = require('../controllers/cursanteExternoController');

const {getCargosPorAgenteEmail, getPorCursoClaveCiieClave } = require('../controllers/agenteController');
const { viewInscripto, getExternosPorIdOfertaOficial, vincularCursantes } = require('../controllers/inscriptoController')

//http://localhost:3000/agente/curso/cdi-1/ciie06901
router
    .get('/cargo', getCargosPorAgenteEmail)
    .get('/curso/:cargoClave/:ciieClave', getPorCursoClaveCiieClave)

    //Cursantes
    .get('/cursante/inscriptos/:idInscripcion', cursanteExternoController.getCursantes)
    

    .post('/cursante/calificar', cursanteExternoController.calificar)
    .get('/inscriptos/:idInscripcion', cursanteExternoController.getCursantes)
    .get('/inscriptos/curso/:idOfertaOficial', viewInscripto)

    //ajax inscripto
    .get('/inscriptosExternos/curso/:idOfertaOficial/consultar', getExternosPorIdOfertaOficial)
    .post('/inscriptos/guardar', vincularCursantes)

module.exports = router;

