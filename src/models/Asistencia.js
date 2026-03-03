// models/Asistencia.js
const mongoose = require('mongoose');

const AsistenciaSchema = new mongoose.Schema({
    inscriptoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'InscriptoLocal', 
        required: true,
        index: true
    },
    encuentroId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Encuentro', 
        required: true,
        index: true
    },
    cursoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'CursoLocal', 
        required: true,
        index: true
    },
    estado: {
        type: String,
        enum: ['Presente', 'Ausente', 'Justificado', 'Tardanza', 'Pendiente'],
        default: 'Pendiente',
        required: true
    },
    horarioLlegada: String,     // "18:15" (si llegó tarde)
    motivoJustificacion: String, // Si es justificado
    observaciones: String,
    registradoPor: String,      // Email del usuario que tomó lista
    registradoEn: Date          // Timestamp de cuando se registró
}, { 
    timestamps: true 
});

// Un inscripto solo puede tener 1 registro de asistencia por encuentro
AsistenciaSchema.index(
    { inscriptoId: 1, encuentroId: 1 }, 
    { unique: true }
);

// Índice para queries frecuentes
AsistenciaSchema.index({ cursoId: 1, encuentroId: 1 });

module.exports = mongoose.model('Asistencia', AsistenciaSchema);