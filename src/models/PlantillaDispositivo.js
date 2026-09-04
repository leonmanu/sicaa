const mongoose = require('mongoose');

const plantillaDispositivoSchema = new mongoose.Schema({
    dispositivo: { type: String, required: true, unique: true },
    nombrePlural: { type: String, required: true },
    hashtag: { type: String, default: '' },
    queSonBullets: { type: [String], default: [] },
    requisitosBullets: { type: [String], default: [] }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('PlantillaDispositivo', plantillaDispositivoSchema);
