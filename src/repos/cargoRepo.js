const mongoose = require('mongoose');
const Cargo = require('../models/Cargo');
// ESTO ES CLAVE: Forzamos el registro de los modelos relacionados
const Rol = require('../models/Rol'); 
const Area = require('../models/Area');

class CargoRepo {
    async findAllConDetalles(ciieId) {
        try {
            
            // Validar que el ID sea correcto
            if (!mongoose.Types.ObjectId.isValid(ciieId)) {
                throw new Error('ID de CIIE no válido');
            }

            const cargos = await Cargo.find({ ciieId: new mongoose.Types.ObjectId(ciieId) })
                .populate('rolId')
                .populate('areaId')
                .lean();

            return cargos;
        } catch (error) {
            console.error('Error en CargoRepo.findAllConDetalles:', error.message);
            throw error;
        }
    }
    async getConRolAreaCiie(ciieId) {
    try {
        if (!mongoose.Types.ObjectId.isValid(ciieId)) {
            throw new Error('ID de CIIE no válido');
        }

        return await Cargo.find({ ciieId: new mongoose.Types.ObjectId(ciieId), rolId: '6982b2c0f5525a98107f7553' })
            .populate('rolId')
            .populate('areaId')
            .populate({
                path: 'ocupante',
                // Opcional: solo traer la asignación si está activa
                match: { estado: 'Activo' }, 
                populate: {
                    path: 'usuarioId',
                    populate: { path: 'referenciaId' } // Aquí llega al Agente (Nombre, Apellido, etc)
                }
            })
            .lean({ virtuals: true }); // IMPORTANTE: lean necesita avisarle que use virtuals

    } catch (error) {
        console.error('Error en CargoRepo:', error.message);
        throw error;
    }
}
    async findByClave(clave) {
        try {
            const cargo = await Cargo.findOne({ clave: clave })
                .populate('areaId')
                .lean();
            return cargo;
        } catch (error) {
            console.error('Error en CargoRepo.findByClave:', error.message);
            throw error;
        }
    }

    async getPorCargoClaveCiieId(clave, ciieId) {
        try {
            const cargo = await Cargo.findOne(
                { 
                    ciieId: new mongoose.Types.ObjectId(ciieId),
                    clave: clave 
                }
            )
                .populate('areaId')
                .lean();
            return cargo;
        } catch (error) {
            console.error('Error en CargoRepo.findByClave:', error.message);
            throw error;
        }
    }
    

    async getByAgente(usuarioId) {
        try {
            const cargos = await Cargo.find({ usuarioId: usuarioId }).lean();
            return cargos;
        } catch (error) {
            console.error('Error en CargoRepo.getByAgente:', error.message);
            throw error;
        }
    }
}

module.exports = new CargoRepo();