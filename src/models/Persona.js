const mongoose = require('mongoose');

const PersonaSchema = new mongoose.Schema({
    cuil: { type: String, required: true, unique: true, index: true },
    dni: { type: String, required: true, unique: true },
    apellido: { type: String, required: true },
    nombre: { type: String, required: true },
    fecha_nacimiento: { type: Date },
    genero: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Persona', PersonaSchema);