const mongoose = require('mongoose');

const cargoSchema = new mongoose.Schema({
    ciieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ciie', required: true },
    rolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rol', required: true },
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', default: null },
    comision: { type: Number, default: null },
    clave: { type: String, required: true, lowercase: true, unique: true }
}, { 
    timestamps: true, 
    versionKey: false,
    // CLAVE: Esto permite que los virtuals se incluyan cuando usas .lean() o JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// VIRTUAL: "ocupante"
// Esto le dice a Mongoose: "Buscá en la colección Asignacion a aquel cuyo 'cargoId' 
// sea igual a mi '_id'".
cargoSchema.virtual('ocupante', {
    ref: 'Asignacion',
    localField: '_id',
    foreignField: 'cargoId',
    justOne: true // Porque un cargo solo puede tener una asignación activa (habitualmente)
});

cargoSchema.index({ ciieId: 1, rolId: 1, areaId: 1, comision: 1 }, { unique: true });

module.exports = mongoose.model('Cargo', cargoSchema);