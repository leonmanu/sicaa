const asignacionRepo = require('../repos/asignacionRepo');
const cargoRepo = require('../repos/cargoRepo');
const cargoService = require('./cargoService');
const agenteService = require('./agenteService');

const asignacionService = {
    asignarCargo: async (datos, esCiie, emailUsuario) => {
        console.log('datos y esCiie en asignarCargo:', datos, esCiie);
        // 1. Verificar si el cargo está ocupado
        const cargo = await cargoService.getCargoPorClave(datos.cargoClave);
        console.log('Cargo encontrado en asignarCargo:', cargo);
        const agente = await agenteService.getAgentePorDni(datos.dniAgente);
        console.log('Agente encontrado en asignarCargo:', agente);
        const ocupanteActual = await asignacionRepo.findActiveByCargo(cargo._id);


       
        if (ocupanteActual) {
            if (ocupanteActual.estado === 'Activo' && datos.situacionRevista !== 'Suplente') {
                throw new Error('El cargo está ocupado. Solo se admiten suplentes si el titular entra en licencia.');
            }
            if (ocupanteActual.estado === 'Activo' && datos.situacionRevista === 'Suplente') {
                throw new Error('No se puede asignar un suplente si el titular/provisional no está en licencia.');
            }
        }

        // 2. Definir estado inicial según quién lo crea
        datos.cargoId = cargo._id;
        datos.usuarioId = agente._id;
        datos.creadoPor = emailUsuario;
        datos.estado = esCiie ? 'Activo' : 'Pendiente';

        return await asignacionRepo.create(datos);
    }
};

module.exports = asignacionService;