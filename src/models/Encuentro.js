    // models/Encuentro.js
    const mongoose = require('mongoose');

    const EncuentroSchema = new mongoose.Schema({
        cursoId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'CursoLocal', 
            required: true,
            index: true
        },
        numero: { 
            type: Number, 
            required: true 
        },
        fecha: { 
            type: Date, 
            required: true 
        },
        horaInicio: String, // "18:00"
        horaFin: String,    // "21:00"
        tema: String,       // "Introducción a la evaluación formativa"
        modalidad: {
            type: String,
            enum: ['Presencial', 'Virtual', 'Híbrido'],
            default: 'Presencial'
        },
        lugar: String,      // "Sala 3, CIIE La Matanza"
        enlaceVirtual: String, // URL de Meet/Zoom si es virtual
        estado: {
            type: String,
            enum: ['Programado', 'En curso', 'Finalizado', 'Cancelado'],
            default: 'Programado'
        },
        duracionHoras: Number,
        observaciones: String,
        creadoPor: String
    }, { 
        timestamps: true 
    });

    EncuentroSchema.pre('save', function() {
    console.log('fecha ANTES:', this.fecha);
    if (this.fecha) {
        this.fecha.setUTCHours(0, 0, 0, 0);
    }
    console.log('fecha DESPUÉS:', this.fecha);
});
    EncuentroSchema.pre('findByIdAndUpdate', function(next) {
        const update = this.getUpdate();
        if (update.$set && update.$set.fecha) {
            update.$set.fecha = new Date(update.$set.fecha);
            update.$set.fecha.setUTCHours(0, 0, 0, 0);
        }
        next();
    });
    
    EncuentroSchema.index({ cursoId: 1, numero: 1 }, { unique: true });
    EncuentroSchema.index({ cursoId: 1, fecha: 1 }, { unique: true });

    module.exports = mongoose.model('Encuentro', EncuentroSchema);