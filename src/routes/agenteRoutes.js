//agenteRoutes.js

const express = require('express');
const router = express.Router();
const cursanteExternoController = require('../controllers/cursanteExternoController');
const { asegurarRegistro } = require('../middleware/auth');

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

const {getAgentesPorCiie, getAgentesPorAlcance} = require('../controllers/agenteController');

//http://localhost:3000/agente/curso/cdi-1/ciie06901
router
    //.get('/cargo', getCargosPorAgenteEmail)


    //Cursantes
    .get('/cursante/inscriptos/:idInscripcion', asegurarRegistro, cursanteExternoController.getCursantes)


    .post('/cursante/calificar', asegurarRegistro, cursanteExternoController.calificar)
    .get('/inscriptos/:idInscripcion', asegurarRegistro, cursanteExternoController.getCursantes)


    //ajax
    .get('/inscriptosExternos/curso/:idOfertaOficial/consultar', asegurarRegistro, getExternosPorIdOfertaOficial)
    .post('/inscriptos/guardar', asegurarRegistro, vincularCursantes)
    .get('/porCiie/:ciieClave', asegurarRegistro, getAgentesPorCiie)
    .get('/porAlcance/:ciieId', asegurarRegistro, getAgentesPorAlcance)


    //encuentros
    .post('/encuentro', asegurarRegistro, post)
    .put('/encuentro/:idOfertaOficial/:numero', asegurarRegistro, putPorNumeroIdOfertaOficial)
    .delete('/encuentro/:idOfertaOficial/:numero', asegurarRegistro, delPorNumeroIdOfertaOficial)


module.exports = router;
