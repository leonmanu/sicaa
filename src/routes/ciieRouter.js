//ciieRouter.js

const express = require('express');
const router = express.Router();



const { getDashboard, getSubDashboard, getUsuarioPorModelo, putAgenteEstado, getAgentesPendientes} = require('../controllers/ciieController');
const {vistaAsignacionCiie, vistaCargosEtr, getFormAltaCargo, postCargo} = require('../controllers/cargoController');
const areaController = require('../controllers/areaController');
const { soloCiie } = require('../middleware/auth');
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
    getCalificaciones,
    getPlanillaAprobadosItinerario,
    getComunicadoItinerario,
    getTrayectoriaCursantes,
    getRegistroCursantesMasivo,
    getListaAsistenciaMasiva,
    getSincronizarItinerario,
    getSincronizarItinerarioStream,
    getAcreditacionSeminarios,
    getAcreditacionSeminariosStream,
    postCertificarSeminario
} = require('../controllers/cursoLocalController')
const { viewInscripto, getExternosPorIdOfertaOficial, vincularCursantes } = require('../controllers/inscriptoController')

router
    // url cii
    .get('/dashboard', soloCiie, getDashboard)
    .get('/subdashboard', soloCiie, getSubDashboard)
    .get('/agentes', soloCiie, getUsuarioPorModelo)
    .post('/agente/cambiar-estado/:dni', soloCiie, putAgenteEstado)
    .get('/estados-pendientes', soloCiie, getAgentesPendientes)
    // URL cargo
    .get('/cargo/asignar', soloCiie, vistaAsignacionCiie)
    .get('/cargos/etr', soloCiie, vistaCargosEtr)
    .get('/cargos/nuevo', soloCiie, getFormAltaCargo)
    .post('/cargos/nuevo', soloCiie, postCargo)
    // URL área
    .get('/areas', soloCiie, areaController.getForm)
    .post('/areas', soloCiie, areaController.postArea)
    // URL curso
    .get('/curso/externo', soloCiie, getCursos)
    .get('/cursos', soloCiie, getCursosPorCiieId) //vista pendiente
    .get('/cursos/nuevo', soloCiie, getVincularConSitioOficial)
    .post('/cursos/nuevo/vincular', soloCiie, postVincularConSitioOficial)
    .post('/cursos/nuevo/editar', soloCiie, postEditarCursoPendiente)
    .post('/cursos/nuevo/publicar', soloCiie, postCrearYVincularConSitioOficial)
    .get('/comunicado', soloCiie, getComunicadoItinerario)
    .get('/registro-cursantes-masivo', soloCiie, getRegistroCursantesMasivo)
    .get('/lista-asistencia-masiva', soloCiie, getListaAsistenciaMasiva)
    .get('/itinerario/sincronizar', soloCiie, getSincronizarItinerario)
    .get('/itinerario/sincronizar-stream', soloCiie, getSincronizarItinerarioStream)
    .get('/acreditacion-seminarios', soloCiie, getAcreditacionSeminarios)
    .get('/acreditacion-seminarios/stream', soloCiie, getAcreditacionSeminariosStream)
    .post('/acreditacion-seminarios/certificar', soloCiie, postCertificarSeminario)

    // URL calificaciones
    .get('/calificaciones', soloCiie, getCalificaciones)
    .get('/certificados', soloCiie, getCalificaciones)
    .get('/certificados/aprobados-itinerario', soloCiie, getPlanillaAprobadosItinerario)
    .get('/certificados/trayectoria-cursantes', soloCiie, getTrayectoriaCursantes)
    .get('/calificaciones/documentos', soloCiie, getCalificacionesDocumentosLote)
    .get('/calificaciones/:idOfertaOficial', soloCiie, getCalificacionesCursoDetail)
    .get('/calificaciones/:idOfertaOficial/documentos', soloCiie, getCalificacionesDocumentosCurso)
    .post('/calificaciones/enviar-lote', soloCiie, postEnviarCalificacionesLote)
    .post('/calificaciones/:idOfertaOficial/enviar', soloCiie, postGuardarYEnviarCalificacionesCurso)
    .post('/calificaciones/:idOfertaOficial/enviar-directo', soloCiie, postEnviarCalificacionesCurso)
    .post('/calificaciones/:idOfertaOficial/documentos/impresion', soloCiie, postMarcarImpresionDocumentos)

    .get('/inscriptos/curso/:idOfertaOficial', soloCiie, viewInscripto)


module.exports = router;
