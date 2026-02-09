// src/middlewares/auth.js

function asegurarRegistro(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }

    // Bypass para TODO el personal de gestión (Admin y Observadores)
    const esGestion = req.user.rol === 'admin' || req.user.rol === 'observador';
    if (esGestion) return next();

    // Lógica para usuarios comunes (CIIEs / Docentes)
    if (!req.user.autorizado && req.path !== '/usuario/alta') {
        return res.redirect('/usuario/alta');
    }
    
    next();
}

function esAdmin(req, res, next) {
    // Primero asegurar que esté logueado (por las dudas)
    if (req.isAuthenticated() && req.user.rol === 'admin') {
        return next();
    }
    req.flash('error', 'Acceso denegado: Se requieren permisos de Administrador.');
    res.redirect('/'); 
}

function puedeConsultar(req, res, next) {
    if (req.isAuthenticated() && (req.user.rol === 'admin' || req.user.rol === 'observador')) {
        return next();
    }
    req.flash('error', 'No tienes permiso para ver esta sección.');
    res.redirect('/');
}

module.exports = {
    asegurarRegistro,
    esAdmin,
    puedeConsultar
};