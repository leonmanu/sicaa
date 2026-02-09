const mongoose = require('mongoose');

const rolSchema = new mongoose.Schema({
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
        lowercase: true // Asegura que se guarde siempre en minúsculas
    },
    tipo: { 
        type: String, 
        enum: ['Jerárquico', 'ETR', 'Soporte', 'Administrativo'], 
        required: true 
    }
}, { 
    timestamps: true,
    versionKey: false 
});

// Exportamos el modelo con el nombre 'Rol'
// Es vital que sea 'Rol' (en singular) para que coincida con el ref de Cargo
module.exports = mongoose.model('Rol', rolSchema);