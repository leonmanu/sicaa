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
    postAltaManualCursante,
    getCierreAdministrativo,
    postCierreAdministrativo,
    deleteCierreAdministrativo
} = require('../controllers/inscriptoController');
const { asegurarSesion } = require('../services/sesionService');

router
    .get('/curso/:idOfertaOficial', viewInscripto)

    //asistencia
    .get('/curso/:idOfertaOficial/listaAsistencia', viewListaAsistencia)
    .get('/curso/:idOfertaOficial/asistencia', viewAsistencia)
    .post('/asistencia', postAsistencia)//ajax asistencia

    //cierre administrativo (asistencia + calificaciones completas)
    .get('/curso/:idOfertaOficial/cierre-administrativo', getCierreAdministrativo)
    .post('/curso/:idOfertaOficial/cierre-administrativo', postCierreAdministrativo)
    .delete('/curso/:idOfertaOficial/cierre-administrativo', deleteCierreAdministrativo)

    //alta manual de cursante (no se anotó a tiempo en el sistema oficial)
    .get('/curso/:idOfertaOficial/buscar-cursante', buscarCursantePorValor)
    .post('/curso/:idOfertaOficial/alta-manual', postAltaManualCursante)

    //calificaion
    .post('/calificacion', putCalificacion)
module.exports = router;