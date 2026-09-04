const mongoose = require('mongoose');

const configuracionPublicacionesSchema = new mongoose.Schema({
    requisitosDefaultBullets: {
        type: [String],
        default: ['Ser docente titulado/a o estudiante con más del 80% de materias aprobadas']
    },
    cierreFacebook: { type: String, default: '📢 Compartí esta info con colegas y no te quedes afuera 🚀📚' },
    cierreInstagram: { type: String, default: '👥 Compartí con colegas' },
    hashtagsFijos: { type: [String], default: ['#FormaciónDocente'] }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('ConfiguracionPublicaciones', configuracionPublicacionesSchema);
