// Institución (CIIE) "actual" de cada request, para que las llamadas al sitio oficial
// usen las credenciales, las cookies y el `qi` de esa institución y no las de otra.
const { AsyncLocalStorage } = require('async_hooks');
const mongoose = require('mongoose');
const CursoLocal = require('../models/CursoLocal');

const almacen = new AsyncLocalStorage();

// Middleware: guarda el request para poder resolver la institución en el momento en que
// haga falta (req.params ya está cargado cuando llega el controlador, acá todavía no).
const middleware = (req, res, next) => almacen.run({ req, ciieId: null }, next);

// Para tareas fuera de un request (scripts, jobs): ejecuta `fn` como la institución dada.
const ejecutarComo = (ciieId, fn) => almacen.run({ req: null, ciieId: String(ciieId) }, fn);

const _idOfertaDelRequest = (req) => {
    const id = req?.params?.idOfertaOficial
        ?? req?.body?.idOfertaOficial
        ?? req?.query?.idOfertaOficial;
    return id ? String(id).trim() : null;
};

// Regla de resolución:
//  1. Usuario institución: su propio CIIE.
//  2. Cualquier otro usuario (docente, admin): el CIIE dueño de la oferta que el request nombra.
async function _resolver(req) {
    const user = req?.user;
    if (user?.tipo === 'institucion' && mongoose.isValidObjectId(user.referenciaId)) {
        return String(user.referenciaId);
    }

    const idOferta = _idOfertaDelRequest(req);
    if (idOferta) {
        const curso = await CursoLocal.findOne({ idOfertaOficial: idOferta }).select('ciieId').lean();
        if (curso?.ciieId) return String(curso.ciieId);
    }
    return null;
}

async function ciieIdActual() {
    const store = almacen.getStore();
    if (!store) {
        throw new Error('No hay contexto de institución (CIIE) para esta operación.');
    }
    if (!store.ciieId) {
        store.ciieId = await _resolver(store.req);
    }
    if (!store.ciieId) {
        throw new Error('No se pudo determinar a qué institución (CIIE) corresponde esta operación.');
    }
    return store.ciieId;
}

// Versión síncrona: solo devuelve la institución si ya fue resuelta en este request.
const ciieIdResuelto = () => almacen.getStore()?.ciieId || null;

module.exports = { middleware, ejecutarComo, ciieIdActual, ciieIdResuelto };
