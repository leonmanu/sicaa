const mongoose = require('mongoose');

// Cada cambio hecho desde el editor de datos (/editor): guarda el documento
// completo antes y después, para poder ver qué se tocó y deshacerlo.
const historialEdicionSchema = new mongoose.Schema({
    modelo:   { type: String, required: true },  // clave del editor, ej: 'cursos'
    docId:    { type: mongoose.Schema.Types.ObjectId, required: true },
    accion:   { type: String, enum: ['edicion', 'restauracion'], default: 'edicion' },
    cambios:  [String],                           // paths modificados
    antes:    mongoose.Schema.Types.Mixed,
    despues:  mongoose.Schema.Types.Mixed,
    usuario:  String
}, { timestamps: { createdAt: 'fecha', updatedAt: false }, versionKey: false });

historialEdicionSchema.index({ modelo: 1, docId: 1, fecha: -1 });

module.exports = mongoose.model('HistorialEdicion', historialEdicionSchema);
