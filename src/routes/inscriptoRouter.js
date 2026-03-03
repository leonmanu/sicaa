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
    postAsistencia
} = require('../controllers/inscriptoController')

router
    .get('/curso/:idOfertaOficial', viewInscripto)

    //asistencia
    .get('/curso/:idOfertaOficial/listaAsistencia', viewListaAsistencia)
    .get('/curso/:idOfertaOficial/asistencia', viewAsistencia)
    .post('/asistencia', postAsistencia)//ajax asistencia
    
    //calificaion
    .post('/calificacion', putCalificacion)
module.exports = router;