const mongoose = require('mongoose');

const cursoSchema = new mongoose.Schema({
    // Identificadores Oficiales
    idOfertaOficial: { type: String, unique: true }, // Índice [0]
    idCursoOriginal: { type: String },               // Índice [13]
    idCiieOriginal: { type: String },                // Índice [14]
    
    // Datos de la Propuesta
    nombrePropuesta: { type: String },               // Índice [9]
    dispositivo: { type: String },                   // Índice [10] (Curso, Taller, etc)
    dirigidaA: { type: String },                     // Índice [11]
    formadorAbc: { type: String },                   // Índice [17] (Nombre que viene del ABC)
    
    // Tiempos (Guardar como Date para poder filtrar/ordenar)
    anio: Number,                                    // Índice [1]
    cohorte: { 
        type: Number, 
        default: 1 
    },                             // Índice [2]
    fechaInicioInscripcion: Date,                    // Índice [3]
    fechaFinInscripcion: Date,                       // Índice [4]
    fechaInicioCurso: Date,                          // Índice [5]
    fechaFinCurso: Date,                             // Índice [6]
    
    // Estado y Cupos
    disponible: String,                              // Índice [7] ('S' o 'N')
    cupo: Number,                                    // Índice [8]
    certifica: String,                               // Índice [16]
    
    // Enlaces
    enlaceInscripcion: String,                       // Índice [12]

    cantidadEncuentros: Number,

    // Relaciones Locales (Tu Sistema)
    cargoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cargo' },
    ciieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    propuestaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Propuesta' },
    
    estado: { type: String, default: 'pendiente' },
    creadoPor: { type: String }
}, { 
    timestamps: true, 
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('CursoLocal', cursoSchema);