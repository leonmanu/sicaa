const usuarioRepo = require('../repos/usuarioRepo');
const personaService = require('./personaService');
const ciieService = require('./ciieService');
const agenteRepo = require('../repos/agenteRepo');
const personaRepo = require('../repos/personaRepo');
const cargoService = require('./cargoService');

class AgenteService {

    async postAgente(datos, usuarioGoogle) {
    try {
        // 1. Lógica para crear la referencia (Persona)
        const nuevaPersona = await personaService.postPersona(datos, usuarioGoogle);
        let referenciaId = nuevaPersona._id;

        // 2. Creamos el Usuario con los nombres de campos CORRECTOS
        const nuevoAgente = await usuarioRepo.postUsuario({
            email: usuarioGoogle.email,
            tipo: usuarioGoogle.tipo || 'agente',        // Cambiado: era 'rol'
            aprobado: usuarioGoogle.aprobado || 'pendiente',                             // Agregado: es required en tu schema
            referenciaId: referenciaId,                  // Cambiado: era 'perfilId'
            tipoModel: usuarioGoogle.tipoModel || 'Persona', // Cambiado: era 'perfilModel'
            googleId: usuarioGoogle.id                   // (Opcional, si lo agregaste al schema)
        });

        return nuevoAgente;
    } catch (error) {
        console.error('Error al dar de alta en Mongo:', error);
        throw error;
    }
}

// Función genérica para obtener pendientes según el modelo (Persona o Ciie)
    async getSolicitudesPorTipo(tipoModel) {
        try {
            // Le pedimos al repo que busque por estado y por el modelo de referencia
            return await usuarioRepo.getPendientesPorModelo(tipoModel);
        } catch (error) {
            console.error(`Error al obtener pendientes de ${tipoModel}:`, error);
            throw error;
        }
    }

    async getAgentePorDni(dni) {
        try {
            return await agenteRepo.getAgentePorDni(dni);
        } catch (error) {
            throw error;
        }
    }

    // O bien, funciones directas si preferís claridad absoluta
    // async obtenerCiiesPendientes() {
    //     return await this.obtenerSolicitudesPorTipo('Ciie');
    // }

    // async obtenerPersonasPendientes() {
    //     return await this.obtenerSolicitudesPorTipo('Persona');
    // }

    async getPorModelo(tipoModel) {
        try {
            return await  usuarioRepo.getPorModelo(tipoModel);
        } catch (error) {
            console.error('Error al listar las instituciones:', error)
            throw error}
    }

    async getAgentes() {
    try {
        const agentes = await agenteRepo.getAgentes();

        // Aplicamos el ordenamiento por apellido y luego por nombre
        const agentesOrdenados = agentes.sort((a, b) => {
            // Obtenemos los valores de la referencia (Persona)
            // Usamos "" como fallback por si algun dato viene nulo
            const apellidoA = (a.referenciaId?.apellido || "").toLowerCase();
            const apellidoB = (b.referenciaId?.apellido || "").toLowerCase();
            const nombreA = (a.referenciaId?.nombre || "").toLowerCase();
            const nombreB = (b.referenciaId?.nombre || "").toLowerCase();

            // 1. Comparar por apellido
            if (apellidoA < apellidoB) return -1;
            if (apellidoA > apellidoB) return 1;

            // 2. Si el apellido es igual, comparar por nombre
            if (nombreA < nombreB) return -1;
            if (nombreA > nombreB) return 1;

            return 0;
        });

        console.log('Agentes ordenados en servicio:', agentesOrdenados.length);
        return agentesOrdenados;
        
    } catch (error) {
        console.error('Error al obtener agentes:', error);
        throw error;
    }
}
    async getPorDni(dni) {
        try {
            const persona = await personaRepo.getPorDni(dni)
            if (!persona) {
                throw new Error('Persona no encontrada');
            }
            const agente = await agenteRepo.getPorPersonaId(persona._id);
            return agente;
        } catch (error) {
            console.error('Error al obtener agente por DNI:', error);
            throw error;
        }   
    }

    async getPorEmail(email) {
        try {
            const agente = await agenteRepo.getPorEmail(email);
            return agente;
        } catch (error) {
            console.error('Error al obtener agente por email:', error);
            throw error;
        }   
    }

    async getCargosPorDni(dni) {
        try {
            const agente = await this.getPorDni(dni);   
            if (!agente) throw new Error('Agente no encontrado');
            return await cargoService.getCargosPorAgente(agente._id);  
        } catch (error) {
            console.error('Error al obtener cargos:', error);
            throw error;
        }
    }

    async getCargosPorEmail(email) {
        try {
            const agente = await this.getPorEmail(email);   
            if (!agente) throw new Error('Agente no encontrado');
            const cargos = await cargoService.getCargosPorAgente(agente._id);  
            console.log('Cargos obtenidos para el agente con email', email, ':', cargos.length);
            return cargos;
        } catch (error) {
            console.error('Error al obtener cargos:', error);
            throw error;
        }
    }

     async getAgentesPendientes() {
        try {
            return await usuarioRepo.getEstadosPendientes();    
        } catch (error) {
            console.error('Error al obtener estados pendientes:', error);
            throw error;
        }
    }   

    // async putEstadoUsuario(clave, nuevoEstado) {
    //     try {
    //         const usuarioActualizado = await usuarioRepo.actualizarEstado(clave, nuevoEstado);
    //         if (!usuarioActualizado) throw new Error('Usuario no encontrado');
    //         return usuarioActualizado;
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    async putEstadoUsuario(identificador, nuevoEstado, tipo) {
        if (tipo === 'Persona') {
            return await usuarioRepo.putEstadoUsuarioPersona(identificador, nuevoEstado);
        } else {
            return await usuarioRepo.putEstadoUsuarioCiie(identificador, nuevoEstado);
        }
    }

    async putAgenteEstado(dni, nuevoEstado) {
        try {
            console.log('Actualizando estado del agente con DNI:', dni, 'a', nuevoEstado);
            const agenteActualizado = await agenteRepo.putAgenteEstado(dni, nuevoEstado);
            if (!agenteActualizado) throw new Error('Agente no encontrado');
            return agenteActualizado;
        } catch (error) {
            console.error('Error al actualizar el estado del agente:', error);
            throw error;
        }   
    }
}

module.exports = new AgenteService();