const mongoose = require('mongoose')

const CredencialSitioSchema = new mongoose.Schema({
    sitioNombre: { type: String, required: true }, // Ej: 'DFDP' o 'ABC_PORTAL'
    usuario: { type: String, required: true },
    password: { type: String, required: true },    // Recordá encriptar antes de guardar
    ultimaSincronizacion: { type: Date, default: Date.now }
})

const CiieSchema = new mongoose.Schema({
    clave: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    distrito: { type: String, required: true },
    region: { type: String, required: true },
    sede: { type: String, required: false },
    direccion: String,
    telefono: String,
// Ahora es un Array de configuraciones
    wrappingConfigs: [CredencialSitioSchema]
})

module.exports = mongoose.models.Ciie || mongoose.model('Ciie', CiieSchema);