// services/asignacionService.js
const { RANGOS } = require('../config/hojas');
const asignacionRepo = require('../repos/asignacionRepo');

class AsignacionService {
    async obtenerAsignacionesPorCuil(cuil) {
        try {
            const filas = await asignacionRepo.obtenerTodas();
            
            // Filtramos por CUIL (Columna D / Índice 3)
            const misAsignaciones = filas.filter(f => f[3] === cuil);

            return misAsignaciones.map(f => ({
                id: f[0],
                idUsuario: f[1],
                idCargo: f[2],
                cuil: f[3],
                nombreDocente: f[4],
                nombreCargo: f[5],
                nivel: f[6],
                ciie: f[7],
                region: f[8],
                aprobado: f[9] === 'TRUE' // Convertimos el string de la Sheet a Booleano
            }));
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    }
}