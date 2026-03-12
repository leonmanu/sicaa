// urls.js

const { actualizar } = require("../repos/personaRepo");

const BASE = 'https://formacionpermanente.abc.gob.ar/inscripcion';
// URL que al parecer edita las propuestas por id
//https://formacionpermanente.abc.gob.ar/inscripcion/propuestas/am.php?id=4247&volver=misofertas.php&quees=M&qi=65
module.exports = {
    BASE_URL: BASE,
    PROPUESTASBASE: {
        LISTA: `${BASE}/propuestas/tabla.php`,
        DATOS: `${BASE}/propuestas/datos.php`,
        REFERER_ORIGEN: `${BASE}/menuciie/menu.php`
    },
    PROPUESTAS_TODAS: {
        LISTA: `${BASE}/propuestas/tabla.php`
    },
    PROPUESTAS: {
        LISTA: `${BASE}/propuestas/misofertas.php`,
        DATOS: `${BASE}/propuestas/datosmisofertas.php`,
        ACTUALIZA: `${BASE}/propuestas/actualiza.php`,
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