const client = require('../services/httpClient');
const URLS = require('../config/urls');

class InscriptosRepo {
    // Sincroniza la sesión interna visitando la página de la propuesta
    async sincronizarFiltros(idInscripcion, idCurso) {
        const urlNavegacion = `${URLS.INSCRIPTOS.LISTA}?id=${idInscripcion}&volver=misofertas.php&idcurso=${idCurso}&qi=65`;
        return await client.get(urlNavegacion);
    }

    // Pide el aaData de los alumnos
    async getRawCursantes(idInscripcion, idCurso) {
        const urlReferer = `${URLS.INSCRIPTOS.LISTA}?id=${idInscripcion}&volver=misofertas.php&idcurso=${idCurso}&qi=65`;
        
        return await client.get(URLS.INSCRIPTOS.DATOS, {
            params: { 
                id: idInscripcion,
                qi: '65',
                sEcho: 1,
                iDisplayStart: 0,
                iDisplayLength: 100
            },
            headers: { 
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': urlReferer 
            }
        });
    }

// src/repos/cursanteRepo.js
async actualizarCalificacion(idInscripcion, nuevaCalificacion, idCursoBase) {
    const urlReferer = `https://formacionpermanente.abc.gob.ar/inscripcion/propuestas/inscriptos.php?id=${idInscripcion}&volver=misofertas.php&idcurso=${idCursoBase}&qi=65`;

    const params = new URLSearchParams();
    params.append('idalumno', idInscripcion); // El ABC espera este nombre
    params.append('calificacion', nuevaCalificacion); // El ABC espera este nombre

    return await client.post(
        `${URLS.BASE_URL}/propuestas/cambiacali.php`, 
        params.toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': urlReferer
            }
        }
    );
}
}


module.exports = new InscriptosRepo();