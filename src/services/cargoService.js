const cargoRepo = require('../repos/cargoRepo');
const Asignacion = require('../models/Asignacion');
const asignacionRepo = require('../repos/asignacionRepo');
const ciieService = require('./ciieService');

class CargoService {

    async obtenerPanelAsignacion(ciieId) {
        try {
            const agenteService = require('./agenteService');
            
            const cargos = await cargoRepo.findAllConDetalles(ciieId);
            const agentes = await agenteService.getAgentes()

            const pofConEstado = await Promise.all(cargos.map(async (cargo) => {
            // 1. Buscamos la asignación que esté únicamente 'Activo'
            const asignacion = await Asignacion.findOne({ 
                cargoId: cargo._id, 
                estado: 'Activo' // Filtro estricto
            }).populate({
                path: 'usuarioId',
                model: 'Usuario', // Aseguramos el modelo
                populate: { 
                    path: 'referenciaId', 
                    model: 'Persona' // Trae Nombre, Apellido, DNI
                } 
            }).lean(); // lean() hace que sea un objeto JS puro, más liviano y fácil de manipular

            // 2. Retornamos el cargo con su ocupante (si no hay, ocupante será null)
            return { 
                ...(cargo.toObject ? cargo.toObject() : cargo), 
                ocupante: asignacion 
            };
}));

            return { pofConEstado, agentes };
        } catch (error) {
            console.error('Error en obtenerPanelAsignacion:', error);
            throw error;
        }
    }

    async getPorClave(clave) {
        try {
            return await cargoRepo.findByClave(clave);
        } catch (error) {
            console.error('Error en getCargoPorClave:', error);
            throw error;
        }
    }

    async getPorCargoClaveCiieId(clave, ciieClave) {
        try {
            //console.log('cargoServie/getPorCargoClaveCiieId -> cargoClave: ', clave, ' || ciieId: ',ciieId)
            const ciie = await ciieService.getPorClave(ciieClave)
            //console.log('cargoServie/getPorCargoClaveCiieId -> CIIE encontrado: ', ciie)
            
            const cargo = await cargoRepo.getPorCargoClaveCiieId(clave, ciie._id);

            return cargo;
        } catch (error) {
            console.error('Error en getCargoPorClave:', error);
            throw error;
        }
    }

    async getConRolAreaCiie(ciieId) {
        try {
            const cargos = await cargoRepo.getConRolAreaCiie(ciieId);
            return cargos;
        } catch (error) {
            console.error('Error en getConRolAreaCiie:', error);
            throw error;
        }
    }

    async getCargosPorUsuarioTipo(usuario) {
        try {
            if (usuario.tipo === 'agente') {
                const cargos = await cargoRepo.getPorAgente(usuario._id);
                //console.log('Cargos encontrados para agente:', cargos);
                return cargos
            }
            if (usuario.tipo === 'institucion') {
                console.log('usuario: ', usuario)
                const cargos = await cargoRepo.getPorCiieReferenciaId(usuario.referenciaId);
                console.log('Cargos encontrados para institución:', cargos);
                return cargos
            }
            return [];
        } catch (error) {
            console.error('Error en getCargosPorUsuarioTipo:', error);
            throw error;
        }
    }
}

// Exportamos una instancia única (Singleton) para mantener la coherencia con tu CiieService
module.exports = new CargoService();