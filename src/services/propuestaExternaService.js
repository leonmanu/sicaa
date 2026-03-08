// src/services/cursoExternoService.js
const cursoExternoRepo = require('../repos/propuestaExternaRepo');
const sesionService = require('./sesionService');

class PropuestaExternaService {
    async listarCursos() {
        // 1. Intento inicial
        await sesionService.asegurarSesion();

        console.log('📡 Sincronizando y solicitando datos...');
        await cursoExternoRepo.sincronizarFiltros();
        
        let response = await cursoExternoRepo.getRawCursos();
        
        // 2. Verificación de sesión (si viene vacío o es un string HTML, renovamos)
        if (!response.data?.aaData || response.data.aaData.length === 0 || typeof response.data === 'string') {
            console.log('⚠️ Sesión expirada o respuesta vacía. Renovando...');
            
            await sesionService.asegurarSesion(true); // Forzamos nuevo login
            await cursoExternoRepo.sincronizarFiltros();
            response = await cursoExternoRepo.getRawCursos();
        }

        // Guardamos los datos "crudos" en la variable
        const rawData = response.data?.aaData || [];
        // 3. Ordenamos directamente sobre el array original (usando el índice [0] que es el ID)
        return rawData.sort((a, b) => b[0] - a[0]);
    }
}

module.exports = new PropuestaExternaService();




