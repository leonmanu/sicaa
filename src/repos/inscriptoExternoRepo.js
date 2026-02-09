//inscriptoExternoRepo

const client = require('../services/httpClient');
const URLS = require('../config/urls');
const sesionService = require('../services/sesionService');

class inscriptoExternoRepo {
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

async getDetalleCursante(idInscripcionOficial) {
        const url = `${URLS.CURSANTE.DATOS}id=${idInscripcionOficial}&quees=M&qi=65`;
        
        // Obtenemos el HTML puro de la página
        const html = await client.get(url, {
            headers: { 'Referer': URLS.INSCRIPTOS.LISTA }
        });

        return html; // Devolvemos el string del HTML para procesarlo
    }

    async getHtmlDocente(idInscripcion, idCurso) {
        const intentarPeticion = async (esReintento = false) => {
            if (esReintento) {
                await sesionService.asegurarSesion(true);
            } else {
                await sesionService.asegurarSesion();
            }
            
            // IMPORTANTE: Sincronizar filtros primero (igual que en listarCursantes)
            if (idCurso) {
                await this.sincronizarFiltros(idInscripcion, idCurso);
            }
            
            return await client.get(URLS.CURSANTE.DATOS, {
                params: { 
                    id: idInscripcion,
                    quees: 'M',
                    qi: '65'
                },
                headers: { 
                    // El referer debe ser la página de inscriptos del curso específico
                    'Referer': idCurso 
                        ? `${URLS.INSCRIPTOS.LISTA}?id=${idInscripcion}&volver=misofertas.php&idcurso=${idCurso}&qi=65`
                        : `${URLS.INSCRIPTOS.LISTA}?qi=65`,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'es-ES,es;q=0.9',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
        };

        try {
            const response = await intentarPeticion();
            
            if (response.data.includes('Inicio de Sesión')) {
                console.log('⚠️  Sesión expirada, reintentando...');
                sesionService.invalidarSesion();
                return await intentarPeticion(true);
            }
            
            return response;
            
        } catch (error) {
            console.error('Error al obtener HTML del docente:', error.message);
            throw error;
        }
    }
}


module.exports = new inscriptoExternoRepo();