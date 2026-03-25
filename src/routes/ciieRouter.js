//ciieRouter.js

const express = require('express');
const router = express.Router();



const { getDashboard,  getUsuarioPorModelo, putAgenteEstado, getAgentesPendientes} = require('../controllers/ciieController');
const {vistaAsignacionCiie, vistaCargosEtr} = require('../controllers/cargoController');
const {getCursos} = require('../controllers/cursoExternoController');
const {
    getCursosPorCiieId,
    getVincularConSitioOficial,
    postVincularConSitioOficial,
    postCrearYVincularConSitioOficial,
    postEditarCursoPendiente,
    getCalificacionesPendientes,
    getCalificacionesCursoDetail,
    getCalificacionesDocumentosCurso,
    getCalificacionesDocumentosLote,
    postEnviarCalificacionesLote,
    postEnviarCalificacionesCurso,
    postGuardarYEnviarCalificacionesCurso,
    postMarcarImpresionDocumentos,
    getCalificaciones
} = require('../controllers/cursoLocalController')
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
    .get('/cursos/nuevo', getVincularConSitioOficial)
    .post('/cursos/nuevo/vincular', postVincularConSitioOficial)
    .post('/cursos/nuevo/editar', postEditarCursoPendiente)
    .post('/cursos/nuevo/publicar', postCrearYVincularConSitioOficial)

    // URL calificaciones
    .get('/calificaciones', getCalificaciones)
    .get('/certificados', getCalificaciones)
    .get('/calificaciones/documentos', getCalificacionesDocumentosLote)
    .get('/calificaciones/:idOfertaOficial', getCalificacionesCursoDetail)
    .get('/calificaciones/:idOfertaOficial/documentos', getCalificacionesDocumentosCurso)
    .post('/calificaciones/enviar-lote', postEnviarCalificacionesLote)
    .post('/calificaciones/:idOfertaOficial/enviar', postGuardarYEnviarCalificacionesCurso)
    .post('/calificaciones/:idOfertaOficial/enviar-directo', postEnviarCalificacionesCurso)
    .post('/calificaciones/:idOfertaOficial/documentos/impresion', postMarcarImpresionDocumentos)

    .get('/inscriptos/curso/:idOfertaOficial', viewInscripto)


module.exports = router;