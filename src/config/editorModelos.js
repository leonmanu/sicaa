// Modelos que se pueden editar "en crudo" desde /editor/:modelo.
// Para sumar uno nuevo alcanza con agregar una entrada acá.
//
//   modelo     modelo de Mongoose
//   titulo     nombre para mostrar
//   etiqueta   cómo se nombra un documento en títulos y listados
//   columnas   campos que se muestran en el listado (admiten paths con punto)
//   populate   referencias a poblar en el listado
//   refs       corrige el `ref` del esquema cuando está mal declarado
//   comparador (opcional) compara el documento con el sitio oficial: (id) => { filas, alertas }
//   campoCiie  campo que dice a qué institución pertenece el documento: una institución
//              solo ve y edita los suyos, y no puede cambiar ese campo
//   (sin campoCiie el modelo queda solo para admin)
const CursoLocal = require('../models/CursoLocal');

const MODELOS = {
    cursos: {
        modelo: CursoLocal,
        titulo: 'Cursos',
        etiqueta: (d) => d.nombrePropuesta || d.tituloFormulario || String(d._id),
        columnas: [
            { path: 'nombrePropuesta', titulo: 'Propuesta' },
            { path: 'idOfertaOficial', titulo: 'Oferta ABC' },
            { path: 'ciieId.nombre', titulo: 'CIIE' },
            { path: 'dispositivo', titulo: 'Dispositivo' },
            { path: 'anio', titulo: 'Año' },
            { path: 'estado', titulo: 'Estado' },
            { path: 'updatedAt', titulo: 'Modificado', tipo: 'fecha' }
        ],
        populate: [{ path: 'ciieId', model: 'Ciie', select: 'nombre' }],
        // En el esquema dice ref 'Usuario', pero lo que se guarda es el _id del Ciie.
        refs: { ciieId: 'Ciie' },
        campoCiie: 'ciieId',
        comparador: (id) => require('../services/ofertaAbcService').compararCursoLocal(id)
    }
};

// Cómo se muestra un documento referenciado en los desplegables, por modelo.
// filtroCiie: campo por el que se restringen las opciones para una institución
// (sin filtroCiie son datos compartidos, como el catálogo de cursos base).
const ETIQUETAS_REF = {
    Ciie:      { select: 'nombre clave', etiqueta: (d) => `${d.nombre} (${d.clave})`, filtroCiie: '_id' },
    Cargo:     { select: 'clave', etiqueta: (d) => d.clave, filtroCiie: 'ciieId' },
    CursoBase: { select: 'idCursoOriginal nombre', etiqueta: (d) => `${d.idCursoOriginal} · ${d.nombre}` },
    Usuario:   { select: 'email', etiqueta: (d) => d.email },
    Area:      { select: 'nombre', etiqueta: (d) => d.nombre }
};

module.exports = { MODELOS, ETIQUETAS_REF };
