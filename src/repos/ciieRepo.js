const Ciie = require('../models/Ciie');

class CiieRepo {
    async postCiie(datos) {
        try {
            const nuevoCiie = new Ciie(datos);
            return await nuevoCiie.save();
        } catch (error) {
            console.error('Error en CiieRepo al guardar:', error);
            throw error;
        }
    }

    async getPorClave(clave) {
    try {
        // Buscamos el usuario por el campo clave
        return await Ciie.findOne({ clave }); 
    } catch (error) {
        // Corregimos el nombre en el log para que coincida con la función
        console.error('Error en UsuarioRepo (getPorClave):', error);
        throw error;
    }
}

    async getXemail(email) {
        return await Ciie.findOne({ emailInstitucional: email });
    }

    async getXdistrito(distrito) {
        return await ciieRepo.find({ distrito });
    }
}

module.exports = new CiieRepo();