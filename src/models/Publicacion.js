const mongoose = require('mongoose');

const redSocialSchema = new mongoose.Schema({
    seleccionado: { type: Boolean, default: true },
    caption: { type: String, default: '' },
    estado: {
        type: String,
        enum: ['pendiente', 'publicando', 'publicado', 'error', 'no_seleccionado'],
        default: 'pendiente'
    },
    postId: { type: String, default: null },
    publicadoEn: { type: Date, default: null },
    error: { type: String, default: null }
}, { _id: false });

const imagenSchema = new mongoose.Schema({
    orden: { type: Number, required: true },
    url: { type: String, default: null },
    path: { type: String, default: null },
    esCaratula: { type: Boolean, default: false }
}, { _id: false });

const publicacionSchema = new mongoose.Schema({
    cursoLocalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CursoLocal', required: true }],
    tipoAgrupacion: {
        type: String,
        enum: ['individual', 'itinerario', 'dispositivo'],
        default: 'individual'
    },
    dispositivoTipo: { type: String, default: null },
    incluirCaratula: { type: Boolean, default: false },
    grupoId: { type: mongoose.Schema.Types.ObjectId, default: null },
    parteActual: { type: Number, default: 1 },
    totalPartes: { type: Number, default: 1 },
    imagenes: { type: [imagenSchema], default: [] },
    facebook: { type: redSocialSchema, default: () => ({}) },
    instagram: { type: redSocialSchema, default: () => ({}) },
    creadoPor: { type: String }
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Publicacion', publicacionSchema);
