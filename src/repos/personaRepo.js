const Persona = require('../models/Persona');

class PersonaRepo {
    // Buscar si el docente ya existe por CUIL
    async buscarPorCuil(cuil) {
        try {
            return await Persona.findOne({ cuil: cuil });
        } catch (error) {
            console.error('Error en PersonaRepo (buscarPorCuil):', error);
            throw error;
        }
    }

    async getPorDni(dni) {
        try {
            return await Persona.findOne({ dni: dni }); 
        } catch (error) {
            console.error('Error en PersonaRepo (getPorDni):', error);
            throw error;
        }
    }

    // Crear la identidad física del docente
    async postPersona(datosPersona) {
        try {
            const nuevaPersona = new Persona(datosPersona);
            return await nuevaPersona.save();
        } catch (error) {
            console.error('Error en PersonaRepo (crear):', error);
            throw error;
        }
    }

    // Actualizar datos (por si cambia el mail personal o teléfono)
    async actualizar(id, datos) {
        return await Persona.findByIdAndUpdate(id, datos, { new: true });
    }
}

module.exports = new PersonaRepo();