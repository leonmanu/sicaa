const mongoose = require('mongoose');

const propuestaSchema = new mongoose.Schema({
    idOficial: { type: String, required: true, unique: true }, // El 'id' de la URL (ej: 149)
    nombre: { type: String, required: true },
    dispositivo: String, // Taller, Curso, Ateneo, etc.
    area: String, // Matemática, Prácticas del Lenguaje, etc.
    nivel: String, // Primario, Secundario, etc.
    ultimoSync: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Propuesta', propuestaSchema);