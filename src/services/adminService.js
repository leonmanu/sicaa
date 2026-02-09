// src/services/adminService.js
const usuarioRepo = require('../repos/usuarioRepo');
const ciieRepo = require('../repos/ciieRepo'); // Quizás el admin también gestiona CIIEs

class AdminService {
    
    // Lista de espera para el Dashboard
    async obtenerUsuariosPendientes() {
        // Solo traemos los que necesitan acción del admin
        return await usuarioRepo.buscarPorCriterio({ 
            aprobado: 'pendiente' 
        });
    }

    // Acción de aprobación
    async aprobarUsuario(id) {
        const usuario = await usuarioRepo.actualizarEstado(id, 'aprobado');
        
        // Aquí podrías agregar lógica que SOLO el admin dispara:
        // Ej: Notificar por mail, crear logs de auditoría, etc.
        console.log(`[AUDITORÍA] Admin aprobó a: ${usuario.email}`);
        
        return usuario;
    }

    // Estadísticas para tu dashboard
    async obtenerResumenSistema() {
        const totalCiies = await usuarioRepo.contarPorTipo('institucion');
        const totalPendientes = await usuarioRepo.contarPorCriterio({ aprobado: 'pendiente' });
        
        return {
            totalCiies,
            totalPendientes
        };
    }
}

module.exports = new AdminService();