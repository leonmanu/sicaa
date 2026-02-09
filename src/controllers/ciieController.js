const usuarioService = require('../services/usuarioService');
const agenteService = require('../services/agenteService');

const getDashboard = async (req, res) => {
    try {
        // Obtenemos las personas reales de Mongo
        const personasPendientes = await usuarioService.getSolicitudesPorTipo('Persona');
        
        // Renderizamos el dashboard del CIIE
        res.render('pages/ciie/dashboardCiie', {
            personasPendientes, // Array real de solicitudes
            user: req.user
        });
    } catch (error) {
        console.error("Error en dashboardCiie:", error);
        res.render('error', { error });
    }
}

const getUsuarioPorModelo = async (req, res) => {
    try{
        const agentes = await usuarioService.getPorModelo('Persona');
        res.render('pages/agente/agenteList', {
            agentes,
            user: req.user
        })
    }   catch (error) {
        console.error('Error al listar las instituciones:', error);
        req.flash('error', 'No se pudieron listar las instituciones.');
        res.redirect('/admin/dashboard');
    }
}

const getAgentesPendientes = async (req, res) => {
    try {
        const agentesPendientes = await agenteService.getAgentesPendientes();
        res.render('pages/ciie/agentesPendientes', {
            agentesPendientes,
            user: req.user
        });
    } catch (error) {
        console.error('Error al obtener agentes pendientes:', error);
        req.flash('error', 'No se pudieron obtener los agentes pendientes.');
        res.redirect('/ciie/dashboard');
    }   
}

const putEstadoUsuario = async (req, res) => {
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

const putAgenteEstado = async (req, res) => {
    try {
        // Mantenemos 'clave' como nombre del parámetro si así lo definís en el router,
        // pero sabemos que para el CIIE esa clave será el DNI del Agente.
        const { dni } = req.params; 
        const { nuevoEstado } = req.body; 
        
        console.log('CIIE cambiando estado de agente:', dni, 'a:', nuevoEstado);

        // Reutilizamos el servicio que ya tenés, que es el que hace la magia en la DB
        await agenteService.putAgenteEstado(dni, nuevoEstado);

        req.flash('success', `El agente con DNI ${dni} ha sido ${nuevoEstado} correctamente.`);

        // El referer es clave aquí para que vuelva a la lista de agentes del CIIE
        res.redirect(req.get('referer') || '/ciie/agentesList');
    } catch (error) {
        console.error('Error en ciieController (cambiarEstadoAgente):', error);
        console.log('Redirigiendo a /ciie/dashboard por error');
        req.flash('error', 'Hubo un problema al procesar la solicitud.');
        res.redirect('/ciie/dashboard');
    }
}


module.exports = {
    getDashboard,
    getUsuarioPorModelo,
    putAgenteEstado,
    getAgentesPendientes
}