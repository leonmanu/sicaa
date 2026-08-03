const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true 
    },
    nombreCorto: { 
        type: String, 
        required: true 
    },
    clave: { 
        type: String, 
        required: true,
        lowercase: true,
        unique: true
    },
    nivel: { 
        type: String, 
        required: true,
        // Opcional: enum para normalizar los niveles educativos
        enum: ['Inicial', 'Primaria', 'Secundaria', 'Todos']
    }
}, { 
    timestamps: true,
    versionKey: false 
});

module.exports = mongoose.model('Area', areaSchema);