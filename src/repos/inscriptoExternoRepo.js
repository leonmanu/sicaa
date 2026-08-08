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
        console.log("urlReferer: ", urlReferer)
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

    // Actualiza la calificación de un alumno
    async actualizarCalificacion(idInscripcion, nuevaCalificacion, idCursoBase) {
        const urlReferer = `https://formacionpermanente.abc.gob.ar/inscripcion/propuestas/inscriptos.php?id=${idInscripcion}&volver=misofertas.php&idcurso=${idCursoBase}&qi=65`;

        const params = new URLSearchParams();
        params.append('idalumno', idInscripcion);
        params.append('calificacion', nuevaCalificacion);

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

    // Registra una inscripción manual (cursante que no llegó a anotarse a tiempo)
    // Respuesta cruda del servidor: "CC~resto", donde CC es un código de 2 dígitos.
    // CC >= 90 -> éxito, resto = "idInscripcionOficial~nombreCurso~region~nombreCiie"
    // CC < 90  -> error, resto = mensaje de error (ej: "Debe seleccionar CIIE")
    async postRegistrarInscripcion(datos) {
        const params = new URLSearchParams();
        params.append('apelnom', datos.apelnom || '');
        params.append('idcurso', datos.idcurso || '');
        params.append('tipo', datos.tipo || 'A');
        params.append('cohorte', datos.cohorte ?? '0');
        params.append('email', datos.email || '');
        params.append('conmail', datos.conmail || datos.email || '');
        params.append('region', datos.region ?? '3');
        params.append('idciie', datos.idciie ?? '65');
        params.append('cuil', datos.cuil || '');
        params.append('nombres', datos.nombres || '');
        params.append('codarea', datos.codarea || '');
        params.append('idciudad', datos.idciudad ?? '0');
        params.append('emailalt', datos.emailalt || '');
        params.append('couli', datos.couli ?? '1');
        params.append('conemailalt', datos.conemailalt || datos.emailalt || '');
        params.append('domicilio', datos.domicilio || '');
        params.append('fechanac', datos.fechanac || '');
        params.append('opciones', '[]');
        params.append('cargos', '[]');
        params.append('anioegre', datos.anioegre || '0');
        params.append('iddirigida', '1');
        params.append('idfechaciie', datos.idfechaciie || '');
        params.append('telefono', datos.telefono || '');

        const urlReferer = `${URLS.CURSANTE.INSCRIPCION}i_f=${datos.idfechaciie}&qi=65`;

        return await client.post(URLS.CURSANTE.REGISTRAR, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': urlReferer
            }
        });
    }

    // Obtiene detalles de un cursante
    async getDetalleCursante(idInscripcionOficial) {
        const url = `${URLS.CURSANTE.DATOS}id=${idInscripcionOficial}&quees=M&qi=65`;
        
        const html = await client.get(url, {
            headers: { 'Referer': URLS.INSCRIPTOS.LISTA }
        });

        return html;
    }

    // Obtiene HTML del docente con manejo de sesión expirada
    async getHtmlDocente(idInscripcion, idCurso) {
        const intentarPeticion = async (esReintento = false) => {
            if (esReintento) {
                await sesionService.asegurarSesion(true);
            } else {
                await sesionService.asegurarSesion();
            }
            
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
                console.log('⚠️ Sesión expirada, reintentando...');
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