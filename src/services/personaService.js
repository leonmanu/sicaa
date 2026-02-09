const personaRepo = require('../repos/personaRepo'); // Necesitaremos este nuevo repo

class PersonaService {
    
    async postPersona(datosForm, usuarioGoogle) {
    try {
        const nuevaPersona = await personaRepo.postPersona({
                cuil: datosForm.cuil,
                dni: datosForm.cuil.substring(2, 10),
                apellido: usuarioGoogle.apellido,
                nombre: usuarioGoogle.nombre,
                fecha_nacimiento: datosForm.fechanac
            })
        return nuevaPersona;
    } catch (error) {
        console.error('Error al dar de alta a la persona en Mongo:', error)
        throw error
    }
}
}

module.exports = new PersonaService()