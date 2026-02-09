// models/Usuario.js
const { stringStream } = require('cheerio');
const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }, // Aquí entran las cuentas @abc.gob.ar
    tipo: { 
        type: String, 
        enum: ['institucion', 'agente'], 
        required: true 
    },
    referenciaId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        refPath: 'tipoModel' 
    },
    tipoModel: {
        type: String,
        required: true,
        enum: ['Persona', 'Ciie']
    },
        rol: { 
        type: String, 
        enum: ['usuario','observador', 'admin'], 
        default: 'usuario' 
    },
    estado: { 
    type: String, 
    required: true, 
    enum: ['pendiente', 'aprobado', 'rechazado'], 
    default: 'pendiente' 
}
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);