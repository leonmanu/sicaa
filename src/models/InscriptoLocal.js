//inscriptoLocalRepo.js

const mongoose = require('mongoose');

const InscriptoLocalSchema = new mongoose.Schema({
    cursoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'CursoLocal', 
        required: true,
        index: true
    },
    idInscripcionOficial: { type: String, unique: true }, 
    
    // Datos identificatorios
    cuil: { type: String, index: true },
    dni: { type: String, index: true },
    apellido: String,
    nombres: String,
    fechaNacimiento: Date,
    
    // Datos de contacto
    domicilio: String,
    telefono: String,
    email: String,
    emailAlternativo: String,
    
    // Datos de ubicación
    localidad: String,
    codigoCiudad: String,
    
    // Datos académicos/profesionales
    anioEgreso: String,
    
    // Metadatos del ABC
    iddocenteOficial: String,
    idCursoOficial: String,
    anioInscripcion: String,
    cohorte: String,

    // Gestión del CIIE
    calificacion: { 
        type: String, 
        enum: ['Sin Calificar', 'Aprobado', 'Desaprobado', 'Ausente'],
        default: 'Sin Calificar' 
    },
    
    // Asistencia por encuentros
    asistencia: [{
        encuentroId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encuentro' },
        estado: { 
            type: String, 
            enum: ['Presente', 'Ausente', 'Pendiente'], 
            default: 'Pendiente' // O 'Ausente' según tu preferencia de carga
        },
        fecha: Date // Duplicamos la fecha aquí para mostrar el historial sin hacer "populate"
    }],
    

    observaciones: String,
    creadoPor: String
}, { timestamps: true });

module.exports = mongoose.model('InscriptoLocal', InscriptoLocalSchema);