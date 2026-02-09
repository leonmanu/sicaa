// src/controllers/adminController.js
const usuarioService = require('../services/usuarioService');

class AdminController {

    async getDashboard(req, res) {
        try {
        // Contamos cuántos usuarios tienen estado 'pendiente'
        // Supongamos que diferenciamos CIIE de Usuario por un campo 'tipo'
        const [ciiesPendientes, personasPendientes] = await Promise.all([
            usuarioService.getSolicitudesPorTipo('Ciie'),
            usuarioService.getSolicitudesPorTipo('Persona')
        ]);

        res.render('pages/admin/dashboard', { 
            ciies: ciiesPendientes,
            personas: personasPendientes,
            totalCiies: ciiesPendientes.length,
            totalPersonas: personasPendientes.length,
            user: req.user 
        });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
}

    async getPendientes(req, res) {
        try {
            const pendientes = await usuarioService.getSolicitudesPorTipo();
            // Pasamos el usuario (req.user) para que la vista sepa si mostrar botones o no
            res.render('admin/dashboard', { 
                usuarios: pendientes,
                user: req.user // <--- Para el check de rol en EJS
            });
        } catch (error) {
            console.error('Error al cargar dashboard de admin:', error);
            req.flash('error', 'No se pudieron cargar las solicitudes.');
            console.log('Redirigiendo a /dashboard por error');
            res.redirect('/dashboard');
        }
    }

    async getUsuarioPorModelo(req, res) {
        try{
            const ciies = await usuarioService.getPorModelo('Ciie');
            res.render('pages/admin/ciieList', {
                ciies,
                user: req.user
            })
        }   catch (error) {
            console.error('Error al listar las instituciones:', error);
            req.flash('error', 'No se pudieron listar las instituciones.');
            res.redirect('/admin/dashboard');
        }
    }

    async getPorModelo(req, res) {
        try{
            const ciies = await usuarioService.getPorModelo('Ciie');
            res.render('pages/admin/ciieList', {
                ciies,
                user: req.user
            })
        }   catch (error) {
            console.error('Error al listar las instituciones:', error);
            req.flash('error', 'No se pudieron listar las instituciones.');
            res.redirect('/admin/dashboard');
        }
    }

    async cambiarEstadoUsuario (req, res) {
        try {
            const { clave } = req.params; // La clave única viene por URL
            const { estado } = req.body;   // 'aprobado' o 'rechazado'
            console.log('Cambiar estado del usuario con clave:', clave, 'a estado:', estado);
            await usuarioService.putEstadoUsuario(clave, estado);
            
            req.flash('success', `Estado del usuario ${clave} actualizado a ${estado}`);

            res.redirect(req.get('referer') || '/admin/dashboard');
        } catch (error) {
            console.error('Error en adminController:', error);
            req.flash('error', 'No se pudo cambiar el estado.');
            res.redirect('/admin/dashboard');
        }
    }
}
module.exports = new AdminController()