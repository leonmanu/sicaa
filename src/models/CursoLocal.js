const mongoose = require('mongoose');

const cursoSchema = new mongoose.Schema({
    // Identificadores Oficiales
    idOfertaOficial: { type: String },
    idCursoOriginal: { type: String },
    idCiieOriginal: { type: String },
    
    // Datos de la Propuesta
    nombrePropuesta: { type: String },
    dispositivo: { type: String },
    formadorAbc: { type: String },
    tituloFormulario: { type: String, default: '' },
    
    // Tiempos
    anio: Number,
    cohorte: { type: Number, default: 0 },
    fechaInicioInscripcion: Date,
    fechaFinInscripcion: Date,
    fechaInicioCurso: Date,
    fechaFinCurso: Date,
    cantidadEncuentros: { type: Number, default: 1 },

    // Estado y Cupos
    disponible: String,
    cupo: Number,
    certifica: String,
    alcance: { type: Number, enum: [1, 2], default: 1 },

    // Enlaces
    enlaceInscripcion: String,

    // Relaciones Locales
    cargoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cargo' },
    ciieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    cursoBaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'CursoBase' },
    
    estado: { type: String, default: 'pendiente' },
    calificaciones: {
        estado: {
            type: String,
            enum: ['sin_cargar', 'pendiente_envio', 'enviado'],
            default: 'sin_cargar'
        },
        fechaEnvio: Date,
        enviadoPor: String
    },

    // Publicación en sitio visual Drupal
    publicacionDrupal: {
        nodeId: { type: String },
        nivel: { type: String },
        materia: { type: String },
        modalidad: { type: String },
        formatoDictado: { 
            type: String,
            enum: ['Asincrónico (239)', 'Presencial (237)', 'Sincrónico (238)', 'Virtual (236)']
        },
        puntaje: { type: Number },
        duracion: { type: String },
        diasHorarios: { type: String },
        sede: { type: String },
        organiza: { type: String },
        publicado: { type: Boolean, default: false }
    },

    creadoPor: { type: String }
}, { 
    timestamps: true, 
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('CursoLocal', cursoSchema);