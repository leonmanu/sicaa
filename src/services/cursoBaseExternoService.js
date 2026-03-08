// src/services/cursoBaseExternoService.js
const cursoBaseExternoRepo = require('../repos/cursoBaseExternoRepo');
const sesionService = require('./sesionService');

class CursoBaseExternoService {
    async listar() {
        // 1. Intento inicial
        await sesionService.asegurarSesion();

        console.log('📡 Sincronizando y solicitando datos...');
        await cursoBaseExternoRepo.sincronizarFiltros();
        
        let response = await cursoBaseExternoRepo.getRaw()
        console.log('Respuesta inicial del ABC:', response.data[0]);
        
        // 2. Verificación de sesión (si viene vacío o es un string HTML, renovamos)
        if (!response.data?.aaData || response.data.aaData.length === 0 || typeof response.data === 'string') {
            console.log('⚠️ Sesión expirada o respuesta vacía. Renovando...');
            
            await sesionService.asegurarSesion(true); // Forzamos nuevo login
            await cursoBaseExternoRepo.sincronizarFiltros();
            response = await cursoBaseExternoRepo.getRawCursosTodos();
        }

        // Guardamos los datos "crudos" en la variable
        const rawData = response.data?.aaData || [];
        // 3. Ordenamos directamente sobre el array original (usando el índice [0] que es el ID)
        return rawData;
    }
}

module.exports = new CursoBaseExternoService();




