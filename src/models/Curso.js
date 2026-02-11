const cursoSchema = new mongoose.Schema({
    propuestaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Propuesta' },
    anio: Number,
    fechaInicioInscripcion: Date,
    fechaFinCurso: Date,
    fechaInicioCurso: Date,
    fechaFinCurso: Date,
    cupo: Number,
    cohorte: String,
    //datos para sitio ciie en el abc
    formatoDictado: String, // Presencial, Virtual, Mixto
    nivel: String, // Primario, Secundario, etc.
    materia: String, // Matemática, Prácticas del Lenguaje, etc.
    modalidad: String, // Taller, Curso, Ateneo, etc.
    puntaje: Number, // Puntaje que otorga el curso para el ABC
    duracion: String, // Duración del curso (ej: "4 horas", "2 días", etc.)
    sede: String, // Lugar donde se dicta el curso (ej: "Escuela N°123", "Online", etc.)
    organizador: String, // Entidad organizadora del curso (ej: "CIIE", "Ministerio de Educación", etc.)
    enlaceInscripcion: String, // URL para inscribirse al curso
    distrito: String, // Distrito al que corresponde el curso (ej: "La Plata", "Berazategui", etc.)
    //
    cargoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cargo' },
    //formador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }, // Tu Agente
    estado: { type: String, default: 'pendiente' },
    idOfertaOficial: { type: String, default: null } // Para cuando el CIIE lo valide en el ABC
});