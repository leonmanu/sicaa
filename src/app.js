const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport'); // Importamos el módulo
const flash = require('connect-flash');
const mongoose = require('mongoose');
require('dotenv').config();
require('./config/passport'); // Ejecuta toda la config de arriba


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas (Base: nodociie)'))
  .catch(err => console.error('❌ Error de conexión:', err));

const app = express();

// 1. Middlewares de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 2. Configuración de Sesión y Passport
app.use(session({
    secret: process.env.SESSION_SECRET || 'secreto-fallback',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
    res.locals.mensajes = {
        success: req.flash('success'),
        error: req.flash('error'),
        info: req.flash('info')
    };
    res.locals.usuario = req.user || null; // Aprovechamos para pasar el usuario
    next();
});


// 3. Vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 4. Rutas
app.use('/auth', require('./routes/authRoutes'));
app.use('/curso', require('./routes/cursoRoutes'));
app.use('/cursante', require('./routes/cursanteRoutes'));
app.use('/usuario', require('./routes/usuarioRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/ciie', require('./routes/ciieRouter'));
app.use('/agente', require('./routes/agenteRoutes')); 
//app.use('/cargos', require('./routes/cargoRoutes')); está fallando
app.use('/asignaciones', require('./routes/asignacionRoutes'));

app.get('/', (req, res) => res.render('pages/index'));

module.exports = app;