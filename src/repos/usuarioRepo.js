// repos/usuarioRepo.js
const Usuario = require('../models/Usuario'); // El modelo que definimos antes
const Ciie = require('../models/Ciie'); // <--

class UsuarioRepo {
    // Reemplaza a 'obtenerTodasLasFilas'
    async obtenerTodos() {
        // En Mongo no hay rangos, solo pedimos la colección completa
        return await Usuario.find({}).populate('perfilId'); 
    }

    async buscarPorEmail(email) {
        // La 'i' al final significa "case-insensitive" (ignora mayúsculas/minúsculas)
        return await Usuario.findOne({ email: new RegExp(`^${email}$`, 'i') });
    }

    // Reemplaza a 'insertarFila'
    async postUsuario(datosUsuario) {
        // En lugar de pasar un array [valor1, valor2], pasamos un objeto { email: '...', rol: '...' }
        const nuevoUsuario = new Usuario(datosUsuario);
        return await nuevoUsuario.save();
    }

    // src/repos/usuarioRepo.js

    async actualizarEstado(clave, nuevoEstado) {
    // 1. Buscamos el CIIE (o Persona) que tiene esa clave
    // Importante: Asegurate de tener importado el modelo Ciie aquí
    const perfil = await Ciie.findOne({ clave: clave });
    
    if (!perfil) {
        throw new Error("No se encontró el perfil con esa clave");
    }

    

    // 2. Ahora sí, buscamos el Usuario que tiene ese perfil en su referenciaId
    return await Usuario.findOneAndUpdate(
        { referenciaId: perfil._id }, 
        { estado: nuevoEstado }, 
        { new: true }
    );
}

    async putEstadoUsuarioPersona(dni, nuevoEstado) {
        const perfil = await Persona.findOne({ dni });
        if (!perfil) throw new Error("No se encontró la Persona");
        return await Usuario.findOneAndUpdate({ referenciaId: perfil._id }, { estado: nuevoEstado }, { new: true });
    }

    async putEstadoUsuarioCiie(clave, nuevoEstado) {
        const perfil = await Ciie.findOne({ clave });
        if (!perfil) throw new Error("No se encontró el CIIE");
        return await Usuario.findOneAndUpdate({ referenciaId: perfil._id }, { estado: nuevoEstado }, { new: true });
    }

    // Método nuevo que no tenías en Sheets: buscar por ID de Google
    async buscarPorGoogleId(id) {
        return await Usuario.findOne({ googleId: id });
    }

    async buscarPorCriterio(query) {
        // Esto te sirve para buscar { tipo: 'institucion', aprobado: 'pendiente' }
        return await Usuario.find(query);
    }

    async getPendientesPorModelo(tipoModel) {
        // Buscamos usuarios donde 'aprobado' sea 'pendiente' 
        // y el 'tipoModel' coincida con lo que pedimos.
        // Usamos .populate('referenciaId') para traer los datos del CIIE o Persona de una vez
        return await Usuario.find({ 
            estado: 'pendiente', 
            tipoModel: tipoModel 
        }).populate('referenciaId');
    }

    async getPorModelo(tipoModel) {
        try {
        // Buscamos todos los usuarios cuyo tipoModel sea 'Ciie'
        return await Usuario.find({ tipoModel: tipoModel })
            .populate('referenciaId') // Trae los datos de la colección Ciies
            .sort({ estado: 1 }); // Agrupa por estado (pendientes primero)
        } catch (error) {
            req.flash('error', 'Error al listar las instituciones.');
            res.redirect('/admin/dashboard');
        }
    }

    async putEstadoUsuario(clave, nuevoEstado) {
        try {
            const ciie = await Ciie.findOne({ clave: claveCIIE }); 
            if (!ciie) return null;
    
            return await Usuario.findOneAndUpdate(
            { referenciaId: ciie._id }, 
            { estado: nuevoEstado }, // Cambio de 'aprobado' a 'estado'
            { new: true }
        )
        } catch (error) {
            console.error('Error al actualizar el estado del usuario:', error);
            throw error;
        }

}
}

module.exports = new UsuarioRepo();