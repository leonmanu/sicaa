const { configDotenv } = require('dotenv');
const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/google', (req, res, next) => {
        
    const quiereAdmin = (req.query.admin === 'true');
    
    // SOLUCIÓN: Pasar la intención en el state de OAuth
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        state: JSON.stringify({ quiereAdmin: quiereAdmin })
    })(req, res, next);
});

// Callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/',
    failureFlash: true
  }),
  (req, res) => {
    // SOLUCIÓN: Recuperar del state en lugar de la sesión
    let quiereAdmin = false;
    
    try {
        // El state viene en req.query.state
        if (req.query.state) {
            const state = JSON.parse(req.query.state);
            quiereAdmin = state.quiereAdmin || false;
        }
    } catch (err) {
        console.error('Error parseando state:', err);
    }
    
    const esPersonalAutorizado = req.user.rol === 'admin' || req.user.rol === 'observador';
    
    if (quiereAdmin) {
        if (esPersonalAutorizado) {
            req.flash('success', `¡Bienvenido al Panel de Gestión, ${req.user.nombre}!`);
            return res.redirect('/admin/dashboard');
        } else {
            return req.logout((err) => {
                req.flash('error', 'Tu cuenta no tiene permisos de administrador. Por favor, ingresá sin marcar la opción de Gestión.');
                res.redirect('/');
            });
        }
    }

    if (req.user.autorizado) {
    //admin
    if (req.user.tipo === 'admin' ) {
        req.flash('success', `¡Bienvenido Administrador, ${req.user.nombre}!`);
        res.redirect('/admin/dashboard');
    }
    // CASO 1: YA COMPLETÓ EL REGISTRO
    if (req.user.estado === 'aprobado') {
    req.flash('success', `¡Hola de nuevo, ${req.user.nombre}!`);

    // Discriminamos según el tipo de cuenta
    if (req.user.tipo === 'institucion') {
        // Si es un CIIE, quizás va directo a su panel institucional
        return res.redirect('/ciie/dashboard'); 
    } else {
        // Si es una Persona, va a elegir su cargo (docente, director, etc.)
        return res.redirect('/agente/cargo');
    }
}
    else if (req.user.estado === 'rechazado') {
        // Importante: Manejar el rechazo explícitamente
        req.flash('error', 'Tu solicitud de acceso ha sido rechazada. Contacta al administrador.');
        res.redirect('/'); // O una página de "Acceso Denegado"
    } 
    else {
        // Estado: 'pendiente'
        req.flash('info', `Tu cuenta ${req.user.email} está en revisión. Pronto podrás acceder.`);
        res.redirect('/');
    }
} else {
    // CASO 2: ES SU PRIMERA VEZ O NO COMPLETÓ EL FORMULARIO
    req.flash('info', 'Tu cuenta es válida, pero necesitamos completar tus datos de registro.');
    res.redirect('/usuario/alta');
  }
}
);

// Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { 
            return next(err); 
        }
        // Destruir la sesión manualmente para mayor seguridad
        req.session.destroy(() => {
            res.clearCookie('connect.sid'); // Limpia la cookie del navegador
            res.redirect('/');
        });
    });
});

module.exports = router;