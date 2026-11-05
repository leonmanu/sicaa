const mongoose = require('mongoose');

// Visitas a páginas públicas, un documento por institución, página y día (hora argentina).
// `huellas` son hashes anónimos (IP + navegador + día, con sal secreta) para contar
// personas distintas en el día sin guardar datos identificables: el mismo visitante
// da otra huella al día siguiente.
const visitaDiariaSchema = new mongoose.Schema({
    ciieId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Ciie', required: true },
    pagina:  { type: String, required: true },   // ej: 'cursos-publico'
    fecha:   { type: String, required: true },   // 'YYYY-MM-DD'
    visitas: { type: Number, default: 0 },
    huellas: [String]
}, { versionKey: false });

visitaDiariaSchema.index({ ciieId: 1, pagina: 1, fecha: 1 }, { unique: true });

module.exports = mongoose.model('VisitaDiaria', visitaDiariaSchema);
