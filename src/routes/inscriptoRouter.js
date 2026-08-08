//inscriptoRouter.js

const express = require('express');
const router = express.Router();

const {
    viewInscripto,
    getExternosPorIdOfertaOficial,
    vincularCursantes,
    viewListaAsistencia,
    viewAsistencia,
    putCalificacion,
    postAsistencia,
    buscarCursantePorValor,
    postAltaManualCursante
} = require('../controllers/inscriptoController');
const { asegurarSesion } = require('../services/sesionService');

router
    .get('/curso/:idOfertaOficial', viewInscripto)

    //asistencia
    .get('/curso/:idOfertaOficial/listaAsistencia', viewListaAsistencia)
    .get('/curso/:idOfertaOficial/asistencia', viewAsistencia)
    .post('/asistencia', postAsistencia)//ajax asistencia

    //alta manual de cursante (no se anotó a tiempo en el sistema oficial)
    .get('/curso/:idOfertaOficial/buscar-cursante', buscarCursantePorValor)
    .post('/curso/:idOfertaOficial/alta-manual', postAltaManualCursante)

    //calificaion
    .post('/calificacion', putCalificacion)
module.exports = router;