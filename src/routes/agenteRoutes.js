//agenteRoutes.js

const express = require('express');
const router = express.Router();
const cursanteExternoController = require('../controllers/cursanteExternoController');

const {
    viewInscripto,
    getExternosPorIdOfertaOficial,
    vincularCursantes,
    viewListaAsistencia
} = require('../controllers/inscriptoController')

const {
    delPorNumeroIdOfertaOficial,
    putPorNumeroIdOfertaOficial,
    post
} = require('../controllers/encuentroController');

//http://localhost:3000/agente/curso/cdi-1/ciie06901
router
    //.get('/cargo', getCargosPorAgenteEmail)


    //Cursantes
    .get('/cursante/inscriptos/:idInscripcion', cursanteExternoController.getCursantes)
    

    .post('/cursante/calificar', cursanteExternoController.calificar)
    .get('/inscriptos/:idInscripcion', cursanteExternoController.getCursantes)
    

    //ajax inscripto
    .get('/inscriptosExternos/curso/:idOfertaOficial/consultar', getExternosPorIdOfertaOficial)
    .post('/inscriptos/guardar', vincularCursantes)
    

    //encuentros
    .post('/encuentro', post)
    .put('/encuentro/:idOfertaOficial/:numero', putPorNumeroIdOfertaOficial)
    .delete('/encuentro/:idOfertaOficial/:numero', delPorNumeroIdOfertaOficial)


module.exports = router;

