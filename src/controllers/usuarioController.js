const usuarioService = require('../services/usuarioService');

const postUsuarioForm    = async (req, res) => {
    try {
        //console.log(`Mostrando formulario de alta para el usuario ${req.user}`);
        res.render('pages/usuario/usuarioForm', { 
            usuario: req.user,
            title: "Gestión de Usuario"
        });

    } catch (error) {
        console.error('Error al obtener cursantes:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const getcargos = async (req, res) => {
    try {
        const cargos = await usuarioService.getCargos();
        res.render('pages/usuario/cargo', { 
            asignaciones: [],
            title: "Gestión de Usuario"
        });
    } catch (error) {
        console.error('Error al obtener cargos:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const getUsuarioPorModelo = async (req, res) => {
        try{
            const ciies = await usuarioService.getPorModelo('Persona');
            res.render('pages/usuario/personaList', {
                ciies,
                user: req.user
            })
        }   catch (error) {
            console.error('Error al listar las instituciones:', error);
            req.flash('error', 'No se pudieron listar las instituciones.');
            res.redirect('/usuario/dashboard');
        }
    }

const postUsuario = async (req, res) => {
    try {
        const usuario = req.user;
        const resultado = await usuarioService.postUsuario(req.body, usuario)
        req.flash('success', `Tu solicitud de alta para ${req.user.email} ha sido recibida.`);
        res.redirect('/');
    } catch (error) {
        console.error('Error al procesar el alta del usuario:', error.message);
        req.flash('error', 'Error al procesar la solicitud de alta.');
        res.redirect('/usuario/form');
    }
}

module.exports = { 
    postUsuarioForm,
    postUsuario,
    getcargos,
    getUsuarioPorModelo
}