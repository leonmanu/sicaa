// src/controllers/editorDatosController.js
const editorDatosService = require('../services/editorDatosService');

const BASE = '/editor';

// Para meter datos en un <script> sin que un "</script>" dentro de un valor corte la página.
const jsonSeguro = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

// Institución a la que se restringe el editor: la del usuario, salvo un admin (ve todo).
const ciieDelUsuario = (user) => (user?.rol === 'admin' ? null : String(user?.referenciaId || ''));

const volverA = (user) => (user?.rol === 'admin' ? '/admin/dashboard' : '/ciie/dashboard');

const responderError = (res, e) => {
    const status = e.statusCode || 500;
    if (status === 500) console.error('Error en el editor de datos:', e);
    res.status(status).json({ ok: false, error: e.message, errores: e.errores });
};

const getLista = async (req, res) => {
    try {
        const conf = editorDatosService.getConfig(req.params.modelo);
        const filas = await editorDatosService.listar(req.params.modelo, ciieDelUsuario(req.user));
        res.render('pages/admin/editorLista', {
            base: BASE,
            volver: volverA(req.user),
            clave: req.params.modelo,
            titulo: conf.titulo,
            columnas: conf.columnas,
            filas,
            user: req.user
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect(volverA(req.user));
    }
};

const getForm = async (req, res) => {
    const { modelo, id } = req.params;
    try {
        const datos = await editorDatosService.getParaEditar(modelo, id, ciieDelUsuario(req.user));
        res.render('pages/admin/editorForm', {
            base: BASE,
            clave: modelo,
            titulo: datos.conf.titulo,
            etiqueta: datos.etiqueta,
            id,
            tieneComparador: Boolean(datos.conf.comparador),
            datosJson: jsonSeguro({
                campos: datos.campos,
                valores: datos.valores,
                opciones: datos.opciones,
                historial: datos.historial
            }),
            user: req.user
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect(`${BASE}/${modelo}`);
    }
};

const getComparar = async (req, res) => {
    try {
        const resultado = await editorDatosService.comparar(req.params.modelo, req.params.id, ciieDelUsuario(req.user));
        res.json({ ok: true, ...resultado });
    } catch (e) {
        responderError(res, e);
    }
};

const postGuardar = async (req, res) => {
    try {
        const { valores, version } = req.body || {};
        const resultado = await editorDatosService.guardar(
            req.params.modelo, req.params.id, valores, version, req.user?.email, ciieDelUsuario(req.user)
        );
        res.json({ ok: true, ...resultado });
    } catch (e) {
        responderError(res, e);
    }
};

const postRestaurar = async (req, res) => {
    try {
        const resultado = await editorDatosService.restaurar(
            req.params.modelo, req.params.historialId, req.user?.email, ciieDelUsuario(req.user)
        );
        res.json({ ok: true, ...resultado });
    } catch (e) {
        responderError(res, e);
    }
};

module.exports = { getLista, getForm, getComparar, postGuardar, postRestaurar };
