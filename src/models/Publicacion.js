const mongoose = require('mongoose');

// Una publicación = una selección de propuestas que se difunde junta.
//  - individual: una sola propuesta, sin carátula.
//  - carrusel: carátula oficial + flyers. En Facebook sale TODO en un solo post;
//    en Instagram (máx. 10 imágenes por post) se reparte en partes de hasta 9
//    flyers + su carátula, que se publican de a una cuando el CIIE decide.
// Republicar una propuesta = crear otra publicación (queda el historial).

const caratulaSchema = new mongoose.Schema({
    titulo: { type: String, default: '' },     // TALLERES / SEMINARIOS / EXPERIENCIAS DE EXTENSIÓN / PROPUESTAS
    meses: { type: String, default: '' },      // JUNIO / JULIO
    tituloEditado: { type: Boolean, default: false }
}, { _id: false });

// Un envío a una red (el post de Facebook o una parte de Instagram).
const envioCampos = {
    caption: { type: String, default: '' },
    captionEditado: { type: Boolean, default: false }, // si es false, el texto se regenera con los datos actuales
    estado: {
        type: String,
        enum: ['pendiente', 'publicando', 'publicado', 'error'],
        default: 'pendiente'
    },
    postId: { type: String, default: null },
    publicadoEn: { type: Date, default: null },
    error: { type: String, default: null },
    intentoEn: { type: Date, default: null },          // cuándo pasó a "publicando"
    cantidadImagenes: { type: Number, default: 0 } // imágenes subidas para el último intento
};

const parteInstagramSchema = new mongoose.Schema({
    cursoLocalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CursoLocal' }],
    caratula: { type: caratulaSchema, default: () => ({}) },
    ...envioCampos
});

const publicacionSchema = new mongoose.Schema({
    ciieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ciie', index: true },
    tipo: { type: String, enum: ['individual', 'carrusel'], default: 'individual' },
    cursoLocalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CursoLocal', required: true }],
    caratula: { type: caratulaSchema, default: () => ({}) }, // la del post de Facebook
    facebook: { ...envioCampos },
    instagram: {
        partes: { type: [parteInstagramSchema], default: [] }
    },
    creadoPor: { type: String }
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Publicacion', publicacionSchema);
