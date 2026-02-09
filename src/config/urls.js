// urls.js

const BASE = 'https://formacionpermanente.abc.gob.ar/inscripcion';

module.exports = {
    BASE_URL: BASE,
    PROPUESTAS: {
        LISTA: `${BASE}/propuestas/misofertas.php`,
        DATOS: `${BASE}/propuestas/datosmisofertas.php`,
        REFERER_ORIGEN: `${BASE}/menuciie/menu.php`
    },
    INSCRIPTOS: {
        LISTA: `${BASE}/propuestas/inscriptos.php`,
        DATOS: `${BASE}/propuestas/datosins.php` // Generalmente los datos en este sitio siguen este patrón
    },
    CURSANTE:{
        DATOS: `${BASE}/propuestas/moddocente.php?`, //ej: ?id=361164&quees=M&qi=65 
        INSCRIPCION: `${BASE}/propuestas/inscripcion.php?`,
    },
    LOGIN: {
        LOGIN_CIIE: `${BASE}/login_ciie/index.php`
    }
};