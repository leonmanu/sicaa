// config/tablas.js

const TABLAS = {
    USUARIOS: 'usuario',           // Tu tabla principal de perfiles
    CARGOS: 'cargo',               // La tabla maestra de tipos de cargos
    USUARIO_CARGO: 'usuario_cargo', // La tabla de relaciones desnormalizada
    REVISTAS: 'revista'            // Tabla maestra de situaciones de revista (Titular, etc.)
};

// Rangos predefinidos para evitar errores de escritura en los métodos
const RANGOS = {
    USUARIOS: `${TABLAS.USUARIOS}!A:H`,
    CARGOS: `${TABLAS.CARGOS}!A:C`,
    USUARIO_CARGO: `${TABLAS.USUARIO_CARGO}!A:M`, // Hasta la col I como planeamos
    REVISTAS: `${TABLAS.REVISTAS}!A:F`
};

module.exports = { TABLAS, RANGOS };