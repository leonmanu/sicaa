const mongoose = require('mongoose');

const cursoBaseSchema = new mongoose.Schema({
    idCursoOriginal: { type: String, unique: true, required: true }, // [0]
    nombre:          { type: String, required: true },               // [1]
    estadoAbc:       { type: String },                               // [2] 'S' o 'N'
    anioReferencia:  { type: Number },                               // [3]
    dispositivo:     { type: String },                               // [4]
    areaNombre:      { type: String },                               // [5] tal como viene del ABC

    // Relación local
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
    ciiesHabilitados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ciie' }],
    activo: { type: Boolean, default: true }
}, { 
    timestamps: true,
    versionKey: false 
});

module.exports = mongoose.model('CursoBase', cursoBaseSchema);