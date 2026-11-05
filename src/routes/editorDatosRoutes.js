// src/routes/editorDatosRoutes.js
// Editor de datos "en crudo" (modelos habilitados en config/editorModelos.js).
// Una institución ve y edita solo lo de su CIIE; un admin ve todo.

const express = require('express');
const router = express.Router();
const { asegurarRegistro } = require('../middleware/auth');
const editorDatos = require('../controllers/editorDatosController');

const adminOInstitucion = (req, res, next) => {
    const esAdmin = req.user?.rol === 'admin';
    const esInstitucion = req.user?.tipo === 'institucion' && req.user?.estado === 'aprobado';
    if (esAdmin || esInstitucion) return next();
    req.flash('error', 'No tenés permisos para acceder al editor de datos.');
    return res.redirect('/');
};

router.use(asegurarRegistro, adminOInstitucion);

router.get('/:modelo', editorDatos.getLista);
router.get('/:modelo/:id', editorDatos.getForm);
router.get('/:modelo/:id/comparar', editorDatos.getComparar);
router.post('/:modelo/:id', editorDatos.postGuardar);
router.post('/:modelo/historial/:historialId/restaurar', editorDatos.postRestaurar);

module.exports = router;
