const Asignacion = require('../models/Asignacion');
const { populate } = require('../models/Usuario');

class AsignacionRepo {
    // Ya no usamos "create: async (data) =>" sino el formato de clase:
    async create(data) {
        return await Asignacion.create(data);
    }

    async findActiveByCargo(cargoId) {
        return await Asignacion.findOne({ 
            cargoId, 
            estado: { $in: ['Activo', 'Licencia'] } 
        });
    }

    async updateEstado(id, estado, fechaFin = null) {
        return await Asignacion.findByIdAndUpdate(
            id, 
            { estado, fechaFin }, 
            { new: true }
        );
    }

    async findPendientesByCiie(ciieId) {
        return await Asignacion.find({ 
            ciieId, 
            estado: 'Pendiente' 
        }).populate('agenteId cargoId');
    }

    async getByAgente(usuarioId) {
        return await Asignacion.find({ usuarioId })
            .populate({
            path: 'cargoId',
            populate: [
                { path: 'ciieId' },
                { path: 'rolId' },
                { path: 'areaId' }
            ]
        })
        .lean();
    }
}

// Exportamos una instancia para que en el service hagas: asignacionRepo.create()
module.exports = new AsignacionRepo();