// models/CargoBase.js
const mongoose = require('mongoose');

const cargoBaseSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    nombreCorto: { type: String, required: true },
    clave: { type: String, required: true, unique: true },
    tipo: { type: String }
});

module.exports = mongoose.model('CargoBase', cargoBaseSchema);