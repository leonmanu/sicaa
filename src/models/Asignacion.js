const mongoose = require('mongoose');

const asignacionSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    cargoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cargo', required: true },
    situacionRevista: { 
        type: String, 
        enum: ['Provisional', 'Suplente', 'Titular'], 
        required: true 
    },
    estado: { 
        type: String, 
        enum: ['Pendiente', 'Activo', 'Licencia', 'Baja','Rechazado'], 
        required: true 
    },
    fechaInicio: { type: Date, default: Date.now },
    fechaFin: { type: Date }, // Se completa en licencias o bajas
    nota: String, // Para registrar motivos de baja o licencias
    creadoPor: {type: String  }
}, { timestamps: true });

module.exports = mongoose.model('Asignacion', asignacionSchema);