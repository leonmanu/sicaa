const mongoose = require('mongoose');
const Cargo = require('../models/Cargo');
const Rol = require('../models/Rol'); 
const Area = require('../models/Area');

const populateBase = [
    { path: 'ciieId' },
    { path: 'rolId' },
    { path: 'areaId' }
];

const populateOcupanteAgente = {
    path: 'ocupante',
    match: { estado: 'Activo' },
    populate: { path: 'usuarioId' }
};

const populateOcupanteCiie = {
    path: 'ocupante',
    match: { estado: 'Activo' },
    populate: { 
        path: 'usuarioId', 
        select: 'email tipo' 
    }
};

class CargoRepo {

    //esta función debería revisarse
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
//esta función debería revisarse
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

    async getPorAgente(usuarioId) {
        const cargos = await Cargo.find()
            .populate(populateBase)
            .populate({
                ...populateOcupanteAgente,
                match: { usuarioId: usuarioId, estado: 'Activo' }
            })
            .lean({ virtuals: true });

        return cargos.filter(cargo => cargo.ocupante !== null);
    }

    async getPorCiieReferenciaId(referenciaId) {
        const resultado = await Cargo.find({ ciieId:referenciaId })
            .populate(populateBase)
            .populate(populateOcupanteCiie)
            .lean({ virtuals: true });

        return resultado;
    }

    async getPorClaveCiieId(clave, ciieId) {
        return await Cargo.findOne({ clave, ciieId })
            .populate('areaId')
            .lean();
    }

    async getPorClave(clave) {
        return await Cargo.findOne({ clave })
            .populate('areaId')
            .lean();
    }
}

module.exports = new CargoRepo();