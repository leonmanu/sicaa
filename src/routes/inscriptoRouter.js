//inscriptoRouter.js

const express = require('express');
const router = express.Router();

const {
    viewInscripto,
    getExternosPorIdOfertaOficial,
    vincularCursantes,
    viewListaAsistencia,
    viewRegistroCursantes,
    viewAsistencia,
    putCalificacion,
    postAsistencia,
    buscarCursantePorValor,
    postAltaManualCursante,
    getCierreAdministrativo,
    postCierreAdministrativo,
    deleteCierreAdministrativo
} = require('../controllers/inscriptoController');
const { asegurarRegistro } = require('../middleware/auth');

router
    .get('/curso/:idOfertaOficial', asegurarRegistro, viewInscripto)

    //asistencia
    .get('/curso/:idOfertaOficial/listaAsistencia', asegurarRegistro, viewListaAsistencia)
    .get('/curso/:idOfertaOficial/registro', asegurarRegistro, viewRegistroCursantes)
    .get('/curso/:idOfertaOficial/asistencia', asegurarRegistro, viewAsistencia)
    .post('/asistencia', asegurarRegistro, postAsistencia)//ajax asistencia

    //cierre administrativo (asistencia + calificaciones completas)
    .get('/curso/:idOfertaOficial/cierre-administrativo', asegurarRegistro, getCierreAdministrativo)
    .post('/curso/:idOfertaOficial/cierre-administrativo', asegurarRegistro, postCierreAdministrativo)
    .delete('/curso/:idOfertaOficial/cierre-administrativo', asegurarRegistro, deleteCierreAdministrativo)

    //alta manual de cursante (no se anotó a tiempo en el sistema oficial)
    .get('/curso/:idOfertaOficial/buscar-cursante', asegurarRegistro, buscarCursantePorValor)
    .post('/curso/:idOfertaOficial/alta-manual', asegurarRegistro, postAltaManualCursante)

    //calificaion
    .post('/calificacion', asegurarRegistro, putCalificacion)
module.exports = router;
