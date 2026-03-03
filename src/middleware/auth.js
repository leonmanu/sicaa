// src/middlewares/auth.js

const asegurarRegistro = (req, res, next) => {
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

const esAdmin = (req, res, next) => {
    // Primero asegurar que esté logueado (por las dudas)
    if (req.isAuthenticated() && req.user.rol === 'admin') {
        return next();
    }
    req.flash('error', 'Acceso denegado: Se requieren permisos de Administrador.');
    res.redirect('/'); 
}

const puedeConsultar = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.rol === 'admin' || req.user.rol === 'observador')) {
        return next();
    }
    req.flash('error', 'No tienes permiso para ver esta sección.');
    res.redirect('/');
}

const soloAgente = (req, res, next) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    if (req.user.tipo !== 'agente' || req.user.estado !== 'aprobado') {
        req.flash('error', 'Acceso denegado.');
        return res.redirect('/');
    }
    next();
};

const soloCiie = (req, res, next) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    if (req.user.tipo !== 'institucion' || req.user.estado !== 'aprobado') {
        req.flash('error', 'Acceso denegado.');
        return res.redirect('/');
    }
    next();
};

const multiRol = (...roles) => (req, res, next) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    if (!roles.includes(req.user.tipo)) {
        req.flash('error', 'No tenés permisos para acceder a esta sección.');
        return res.redirect('/');
    }
    next();
};

module.exports = {
    asegurarRegistro,
    esAdmin,
    puedeConsultar,
    soloAgente,
    soloCiie,
    multiRol
};