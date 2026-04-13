const cargoRepo = require('../repos/cargoRepo');
const cursoLocalRepo = require('../repos/cursoLocalRepo');
const inscriptoLocalRepo = require('../repos/inscriptoLocalRepo');
const cursoExternoRepo = require('../repos/cursoExternoRepo');
const cargoService = require('./cargoService');
const cursoExternoService = require('./cursoExternoService');
const inscriptoExternoService = require('./inscriptoExternoService');
const sesionService = require('./sesionService');
const certificadoExternoService = require('./certificadoExternoService');
const ciieRepo = require('../repos/ciieRepo');
const ciieService = require('./ciieService');
const encuentroRepo = require('../repos/encuentroRepo');
const CursoLocal = require('../models/CursoLocal');

class CursoLocalService {

    // ─── Alta desde formulario propio ────────────────────────────────────────
    async post(data = {}, usuario = {}) {
        console.log('Datos recibidos para alta de curso local:', data);
        const cursoBaseId = this._sanitizeObjectId(data.cursoBaseId);
        const cargoId     = this._sanitizeObjectId(data.cargoId);
        const fechasEncuentrosNormalizadas = this._normalizeFechasEncuentros(data.fechasEncuentros);
        const cantidadEncuentrosCalculada = fechasEncuentrosNormalizadas.length > 0
            ? fechasEncuentrosNormalizadas.length
            : (this._toNumberOrNull(data.cantidadEncuentros) ?? 1);

        if (!cursoBaseId) {
            const err = new Error('El campo cursoBaseId es obligatorio.');
            err.statusCode = 400;
            throw err;
        }
        if (!cargoId) {
            const err = new Error('El campo cargoId es obligatorio.');
            err.statusCode = 400;
            throw err;
        }

        const fechaInicioInscripcion = new Date();
        fechaInicioInscripcion.setDate(fechaInicioInscripcion.getDate() - 1)
        fechaInicioInscripcion.setHours(0, 0, 0, 0)

        const anio = this._toNumberOrNull(data.anio) ?? new Date().getFullYear();
        const dispositivo = this._sanitizeString(data.dispositivo) || 'No especificado';
        const ciieId = this._sanitizeObjectId(data.ciieId) || this._sanitizeObjectId(usuario?.referenciaId);
        
        //const itinerarioCalculado = await this._calcularProximoItinerario(ciieId, anio, dispositivo);

        const documento = {
            // Identificadores oficiales
            idOfertaOficial: this._sanitizeString(data.idOfertaOficial), // null hasta que se publique en ABC
            idCursoOriginal: this._sanitizeString(data.idCursoOriginal),
            idCiieOriginal:  this._sanitizeString(data.idCiieOriginal),

            // Datos de la propuesta
            nombrePropuesta:  this._sanitizeString(data.nombrePropuesta)  || 'Sin nombre',
            dispositivo:      dispositivo,
            formadorAbc:      this._sanitizeString(data.formadorAbc)      || 'A designar',
            tituloFormulario: this._sanitizeString(data.tituloFormulario) || '',

            // Tiempos
            anio:    anio,
            cohorte: this._toNumberOrNull(data.cohorte) ?? 0,
            itinerario: this._toNumberOrNull(data.itinerario) ?? 0,
            fechaInicioInscripcion: this._toDateOrNull(fechaInicioInscripcion),
            fechaFinInscripcion:  this._toDateOrNull(data.fechasEncuentros[0]),
            cantidadEncuentros: cantidadEncuentrosCalculada,
            cantidadHoras:      this._toNumberOrNull(data.cantidadHoras)      ?? 0,

            // Estado y cupos
            disponible: this._sanitizeString(data.disponible),
            cupo:       this._toNumberOrNull(data.cupo) ?? 0,
            certifica:  this._sanitizeString(data.certifica),
            alcance:    this._normalizeAlcance(data.alcance),

            // Enlace
            enlaceInscripcion: this._sanitizeString(data.enlaceInscripcion),

            // Relaciones
            cargoId,
            cursoBaseId,
            ciieId: ciieId,
            cargosInvitados: Array.isArray(data.cargosInvitados)
                ? data.cargosInvitados.map(id => this._sanitizeObjectId(id)).filter(Boolean)
                : [],

            // Meta
            estado:    'pendiente',
            creadoPor: this._sanitizeString(data.creadoPor) || this._sanitizeString(usuario?.email),

            // Calificaciones
            calificaciones: this._normalizeCalificaciones(data.calificaciones) ?? { estado: 'sin_cargar' },

            // Publicación Drupal
            publicacionDrupal: this._normalizePublicacionDrupal(
                data.publicacionDrupal,
                data.cantidadHoras 
            )
        };

        const cursoCreado = await cursoLocalRepo.post(documento);

        try {
            const fechasEncuentrosFinales = fechasEncuentrosNormalizadas.length > 0
                ? fechasEncuentrosNormalizadas
                : this._buildFechasEncuentrosDesdeInicio(this._toDateOrNull(data.fechaInicioCurso), cantidadEncuentrosCalculada);

            await this._crearEncuentrosIniciales(cursoCreado, fechasEncuentrosFinales, data);
            return cursoCreado;
        } catch (error) {
            try {
                await encuentroRepo.delPorCursoId(cursoCreado._id);
                await cursoLocalRepo.delPorId(cursoCreado._id);
            } catch (cleanupError) {
                console.error('Error en limpieza post-fallo de alta de encuentros:', cleanupError.message);
            }
            throw error;
        }
    }

    // ─── Publicar en sitio oficial ABC ───────────────────────────────────────
    // TODO: implementar en próximo paso
    // async publicarEnAbc(cursoLocalId) {
    //     const curso = await cursoLocalRepo.getPorId(cursoLocalId);
    //     await sesionService.asegurarSesion();
    //     const params = new URLSearchParams({
    //         id:           '0',
    //         idcurso:      curso.idCursoOriginal,
    //         quees:        'A',
    //         volver:       `ofertas.php?id=${curso.idCursoOriginal}&quees=M&qi=65`,
    //         anio:         curso.anio,
    //         inicioa:      formatDateTimeLocal(curso.fechaInicioInscripcion),
    //         fina:         formatDate(curso.fechaFinInscripcion),
    //         fechaini:     formatDate(curso.fechaInicioCurso),
    //         fechafin:     formatDate(curso.fechaFinCurso),
    //         disponible:   curso.disponible || 'S',
    //         cupo:         curso.cupo,
    //         idalcance:    curso.alcance,
    //         tituloform:   curso.tituloFormulario || '',
    //         nombrecapa:   curso.formadorAbc,
    //         iddispositivo: curso.idDispositivoAbc  // entero 1-9, pendiente mapear
    //     });
    //     const response = await axios.post(
    //         'https://formacionpermanente.abc.gob.ar/inscripcion/propuestas/actualiza.php',
    //         params.toString(),
    //         {
    //             headers: {
    //                 'Content-Type':    'application/x-www-form-urlencoded',
    //                 'Referer':         'https://formacionpermanente.abc.gob.ar/inscripcion/propuestas/nueva.php',
    //                 'X-Requested-With': 'XMLHttpRequest'
    //             }
    //         }
    //     );
    //     // Respuesta del ABC: "res~control~mensaje"
    //     const [res, , mensaje] = response.data.split('~');
    //     if (res !== '99') throw new Error(mensaje || 'Error al publicar en ABC');
    //     // Guardar idOfertaOficial que devuelve el ABC en `control`
    //     // await cursoLocalRepo.actualizarIdOficial(cursoLocalId, control);
    //     return response.data;
    // }

    // ─── Consultas ───────────────────────────────────────────────────────────
    async getPorCursoClaveCiieClave(cargoClave, ciieClave) {
        const cargo = await cargoService.getPorCargoClaveCiieId(cargoClave, ciieClave);
        const cursosLocales = await cursoLocalRepo.getPorCargoId(cargo._id);
        
        // Cargar encuentros para cada curso
        const cursosConEncuentros = await Promise.all(
            cursosLocales.map(async (curso) => {
                const encuentros = await encuentroRepo.getPorCursoId(curso._id);
                return {
                    ...curso,
                    encuentros: encuentros || []
                };
            })
        );
        
        return { cursosLocales: cursosConEncuentros, cargo };
    }

    async getCursosPorCiieId(ciieId) {
        const cursos = await cursoLocalRepo.getPorCiieId(ciieId);
        if (!cursos || cursos.length === 0) return [];

        const cursoIds = cursos.map(c => c._id);

        const [inscriptos, encuentros] = await Promise.all([
            inscriptoLocalRepo.getPorListaDeCursos(cursoIds),
            encuentroRepo.getPorCursoIds(cursoIds)
        ]);

        return cursos.map(curso => ({
            ...curso,
            cantidadInscriptos: inscriptos.filter(i =>
                i.cursoId.toString() === curso._id.toString()
            ).length,
            encuentros: encuentros
                .filter(e => String(e.cursoId) === String(curso._id))
                .sort((a, b) => a.numero - b.numero)
        }));
    }

    async getCursosPorCiieIdDrupal(ciieId) {
        const cursos = await cursoLocalRepo.getPorCiieId(ciieId);
        if (!cursos || cursos.length === 0) return [];

        const cursoIds = cursos.map(c => c._id);

        const [inscriptos, encuentros] = await Promise.all([
            inscriptoLocalRepo.getPorListaDeCursos(cursoIds),
            encuentroRepo.getPorCursoIds(cursoIds)
        ]);

        return cursos.map(curso => ({
            ...curso,
            cantidadInscriptos: inscriptos.filter(i =>
                i.cursoId.toString() === curso._id.toString()
            ).length,
            encuentros: encuentros
                .filter(e => String(e.cursoId) === String(curso._id))
                .sort((a, b) => a.numero - b.numero)
        }));
    }

    async getPorIdOfertaOficial(ofertaId) {
        const cursoLocal = await cursoLocalRepo.getPorIdOfertaOficial(ofertaId)
        const encuentros = await encuentroRepo.getPorCursoIds(cursoLocal._id);
        //console.log('encuentros: ', encuentros);
        //console.log('Curso local encontrado para idOfertaOficial', ofertaId, ':', cursoLocal);
        return { ...cursoLocal, encuentros };

    }

    async getPorCargoId(cargoId) {
        return await cursoLocalRepo.getPorCargoId(cargoId);
    }

    async getCursosPorDocente(usuarioId) {
        // Obtener los cargos (asignaciones) del docente
        const asignacionRepo = require('../repos/asignacionRepo');
        const asignaciones = await asignacionRepo.getByAgente(usuarioId);
        
        if (!asignaciones || asignaciones.length === 0) {
            return [];
        }

        // Obtener todos los cursos de todos sus cargos
        const cargoIds = asignaciones.map(a => a.cargoId._id);
        const cursos = await cursoLocalRepo.getTodosPorCargosIds(cargoIds);
        
        // Cargar encuentros para cada curso
        const cursosConEncuentros = await Promise.all(
            cursos.map(async (curso) => {
                const encuentros = await encuentroRepo.getPorCursoId(curso._id);
                return {
                    ...curso.toObject(),
                    encuentros: encuentros || []
                };
            })
        );

        return cursosConEncuentros;
    }

    async getTodos() {
        return await cursoLocalRepo.getTodos();
    }

    async getPendientesVinculacionPorCiie(ciieId) {
        const cursosLocales = await cursoLocalRepo.getPendientesVinculacionPorCiie(ciieId);
        return cursosLocales;
    }

    async getPendientesCalificacionesPorCiie(ciieId) {
        return await cursoLocalRepo.getPendientesCalificacionesPorCiie(ciieId);
    }

    async getCalificacionesPorCiie(ciieId) {
        const cursos = await cursoLocalRepo.getCalificacionesPorCiie(ciieId);
        if (!cursos || cursos.length === 0) return [];

        const cursoIds = cursos.map(c => c._id);
        const inscriptos = await inscriptoLocalRepo.getPorListaDeCursos(cursoIds);

        return cursos.map(curso => {
            const delCurso = inscriptos.filter(i => String(i.cursoId) === String(curso._id));
            const cantidadSinCalificar = delCurso.filter(i => {
                const calificacion = this._sanitizeString(i.calificacion);
                return !calificacion || calificacion === 'Sin Calificar';
            }).length;

            return {
                ...curso,
                cantidadInscriptos: delCurso.length,
                cantidadSinCalificar
            };
        });
    }

    async getItinerariosDisponiblesPorCiie(ciieId) {
        const itinerarios = await cursoLocalRepo.getItinerariosDisponiblesPorCiie(ciieId);
        if (!Array.isArray(itinerarios)) return [];

        return itinerarios.map(item => {
            const anio = this._toNumberOrNull(item.anio);
            const itinerario = this._toNumberOrNull(item.itinerario);
            return {
                anio,
                itinerario,
                cantidadCursos: this._toNumberOrNull(item.cantidadCursos) || 0,
                clave: `${anio}-${itinerario}`,
                etiqueta: `${anio} - ${itinerario}`
            };
        }).filter(item => item.anio !== null && item.itinerario !== null);
    }

    async getPlanillaAprobadosPorItinerario(ciieId, anio, itinerario) {
        const anioNum = this._toNumberOrNull(anio);
        const itinerarioNum = this._toNumberOrNull(itinerario);

        if (anioNum === null || itinerarioNum === null) {
            const err = new Error('Debes seleccionar un itinerario valido.');
            err.statusCode = 400;
            throw err;
        }

        const cursos = await cursoLocalRepo.getPorCiieAnioItinerario(ciieId, anioNum, itinerarioNum);
        if (!cursos || cursos.length === 0) {
            return {
                cursos: [],
                aprobados: [],
                resumen: {
                    cantidadCursos: 0,
                    cantidadAprobados: 0
                }
            };
        }

        const cursoIds = cursos.map(c => c._id);
        const inscriptos = await inscriptoLocalRepo.getPorListaDeCursos(cursoIds);
        const cursoPorId = new Map(cursos.map(c => [String(c._id), c]));
        const encuentros = await encuentroRepo.getPorCursoIds(cursoIds);

        const encuentrosPorCursoId = new Map();
        for (const encuentro of (encuentros || [])) {
            const key = String(encuentro.cursoId);
            if (!encuentrosPorCursoId.has(key)) encuentrosPorCursoId.set(key, []);
            encuentrosPorCursoId.get(key).push(encuentro);
        }

        const fechasPorCursoId = new Map();
        for (const curso of cursos) {
            const key = String(curso._id);
            const lista = (encuentrosPorCursoId.get(key) || [])
                .filter(e => e && e.fecha)
                .sort((a, b) => {
                    const na = this._toNumberOrNull(a.numero);
                    const nb = this._toNumberOrNull(b.numero);
                    if (na !== null && nb !== null && na !== nb) return na - nb;
                    return new Date(a.fecha) - new Date(b.fecha);
                });

            const inicioEncuentro = lista.length > 0 ? this._toDateOrNull(lista[0].fecha) : null;
            const finEncuentro = lista.length > 0 ? this._toDateOrNull(lista[lista.length - 1].fecha) : null;

            fechasPorCursoId.set(key, {
                fechaInicioCursada: inicioEncuentro || this._toDateOrNull(curso.fechaInicioCurso),
                fechaFinCursada: finEncuentro || this._toDateOrNull(curso.fechaFinCurso)
            });
        }

        const aprobados = inscriptos
            .filter(i => this._esAprobado(i.calificacion))
            .map(i => {
                const cursoId = String(i.cursoId);
                const curso = cursoPorId.get(cursoId) || {};
                const fechasCursada = fechasPorCursoId.get(cursoId) || {};
                const nombreCompleto = this._buildNombreCompleto(i);
                const area = curso?.cargoId?.areaId?.nombreCorto || 'Area no definida';
                const formadorPersona = curso?.cargoId?.ocupante?.usuarioId?.referenciaId;
                const formador = formadorPersona
                    ? `${formadorPersona.apellido || ''}, ${formadorPersona.nombre || ''}`.replace(/(^\s*,\s*)|(\s+,\s*$)/g, '').trim()
                    : (curso.formadorAbc || 'Sin formador');

                return {
                    nombreCompleto,
                    dni: this._sanitizeString(i.dni) || '',
                    curso: this._sanitizeString(curso.nombrePropuesta) || 'Sin propuesta',
                    area,
                    formador,
                    fechaInicioCursada: fechasCursada.fechaInicioCursada || null,
                    fechaFinCursada: fechasCursada.fechaFinCursada || null
                };
            })
            .sort((a, b) => {
                const porNombre = (a.nombreCompleto || '').localeCompare((b.nombreCompleto || ''), 'es');
                if (porNombre !== 0) return porNombre;
                return (a.curso || '').localeCompare((b.curso || ''), 'es');
            })
            .map((fila, index) => ({ ...fila, orden: index + 1 }));

        return {
            cursos,
            aprobados,
            resumen: {
                cantidadCursos: cursos.length,
                cantidadAprobados: aprobados.length
            }
        };
    }

    async getDetalleCalificacionesCurso(idOfertaOficial, usuario = {}) {
        const curso = await this._getCursoVinculadoDelCiiePorOferta(idOfertaOficial, usuario);
        const inscriptosLocales = await inscriptoLocalRepo.getPorCursoId(curso._id);
        return { curso, inscriptosLocales };
    }

    async getDocumentosCurso(idOfertaOficial, usuario = {}) {
        const curso = await this._getCursoVinculadoDelCiiePorOferta(idOfertaOficial, usuario);
        const inscriptosLocales = await inscriptoLocalRepo.getPorCursoId(curso._id);
        return this._buildDocumentosCurso(curso, inscriptosLocales, cursoLocal);
    }

    async getDocumentosCursosLote(idOfertasOficiales = [], usuario = {}) {
    if (!Array.isArray(idOfertasOficiales) || idOfertasOficiales.length === 0) {
        const err = new Error('No se recibieron cursos para consultar documentos.');
        err.statusCode = 400;
        throw err;
    }

    const cursosDocumentos = []; // Cambiamos el nombre para mayor claridad

    for (const idOfertaOficial of idOfertasOficiales) {
        // 1. Datos que vienen del "vinculador" (probablemente scraping/api abc)
        const cursoAbc = await this._getCursoVinculadoDelCiiePorOferta(idOfertaOficial, usuario);
        
        // 2. Datos que vienen de TU base de datos (con el populate del cargo y persona)
        const cursoDb = await cursoLocalRepo.getPorIdOfertaOficial(idOfertaOficial);
        const ciie = await ciieService.getPorId(cursoDb.ciieId);
        console.log('Curso local encontrado para idOfertaOficial', idOfertaOficial, ':', cursoDb);
        // 3. Inscriptos
        const inscriptosLocales = await inscriptoLocalRepo.getPorCursoId(cursoAbc._id);

        // IMPORTANTE: Aquí enviamos 'cursoDb' que es el que tiene el cargoId populado
        // Si _buildDocumentosCurso espera el curso, asegúrate de pasarle el de la DB
        cursosDocumentos.push(await this._buildDocumentosCurso(cursoAbc, inscriptosLocales, cursoDb, ciie));
    }

    return cursosDocumentos;
}

    async marcarImpresionDocumentos(idOfertaOficial, tipo = 'ambos', usuario = {}) {
        const curso = await this._getCursoVinculadoDelCiiePorOferta(idOfertaOficial, usuario);
        const tipoNormalizado = this._normalizeTipoDocumento(tipo);
        const dataImpresion = {
            'impresionDocumentos.actualizadoPor': this._sanitizeString(usuario?.email)
        };

        if (tipoNormalizado === 'certificados' || tipoNormalizado === 'ambos') {
            dataImpresion['impresionDocumentos.certificadosImpresos'] = true;
            dataImpresion['impresionDocumentos.fechaCertificadosImpresos'] = new Date();
        }

        if (tipoNormalizado === 'acta' || tipoNormalizado === 'ambos') {
            dataImpresion['impresionDocumentos.actaImpresa'] = true;
            dataImpresion['impresionDocumentos.fechaActaImpresa'] = new Date();
        }

        return await cursoLocalRepo.actualizarImpresionDocumentos(curso._id, dataImpresion);
    }

    async actualizarCalificacionesYEnviarCurso(idOfertaOficial, calificaciones = [], usuario = {}) {
        const curso = await this._getCursoVinculadoDelCiiePorOferta(idOfertaOficial, usuario);

        if (!Array.isArray(calificaciones) || calificaciones.length === 0) {
            const err = new Error('No se recibieron calificaciones para guardar.');
            err.statusCode = 400;
            throw err;
        }

        await inscriptoLocalRepo.putCalificaciones(calificaciones);

        const datosPendienteEnvio = {
            estado: 'pendiente_envio',
            enviadoPor: this._sanitizeString(usuario?.email)
        };
        await cursoLocalRepo.actualizarEstadoCalificaciones(curso._id, datosPendienteEnvio);

        const resultadoEnvio = await this._enviarCalificacionesCurso(curso);

        const datosEnviado = {
            estado: 'enviado',
            fechaEnvio: new Date(),
            enviadoPor: this._sanitizeString(usuario?.email)
        };
        const cursoActualizado = await cursoLocalRepo.actualizarEstadoCalificaciones(curso._id, datosEnviado);

        return {
            curso: cursoActualizado,
            enviados: resultadoEnvio.enviados
        };
    }

    async enviarCalificacionesCursoPorOferta(idOfertaOficial, usuario = {}) {
        const curso = await this._getCursoVinculadoDelCiiePorOferta(idOfertaOficial, usuario);
        const resultadoEnvio = await this._enviarCalificacionesCurso(curso);

        const cursoActualizado = await cursoLocalRepo.actualizarEstadoCalificaciones(curso._id, {
            estado: 'enviado',
            fechaEnvio: new Date(),
            enviadoPor: this._sanitizeString(usuario?.email)
        });

        return {
            curso: cursoActualizado,
            enviados: resultadoEnvio.enviados
        };
    }

    async enviarCalificacionesPendientesEnLote(idOfertasOficiales = [], usuario = {}) {
        if (!Array.isArray(idOfertasOficiales) || idOfertasOficiales.length === 0) {
            const err = new Error('No se recibieron cursos para enviar calificaciones.');
            err.statusCode = 400;
            throw err;
        }

        const resumen = {
            ok: 0,
            error: 0,
            detalles: []
        };

        for (const idOfertaOficial of idOfertasOficiales) {
            try {
                const curso = await this._getCursoVinculadoDelCiiePorOferta(idOfertaOficial, usuario);
                const resultadoEnvio = await this._enviarCalificacionesCurso(curso);

                await cursoLocalRepo.actualizarEstadoCalificaciones(curso._id, {
                    estado: 'enviado',
                    fechaEnvio: new Date(),
                    enviadoPor: this._sanitizeString(usuario?.email)
                });

                resumen.ok += 1;
                resumen.detalles.push({
                    idOfertaOficial: this._sanitizeString(curso.idOfertaOficial),
                    nombrePropuesta: curso.nombrePropuesta,
                    area: curso?.cargoId?.areaId?.nombre || 'Sin area',
                    enviados: resultadoEnvio.enviados,
                    success: true
                });
            } catch (error) {
                resumen.error += 1;
                resumen.detalles.push({
                    idOfertaOficial: String(idOfertaOficial),
                    success: false,
                    error: error.message
                });
            }
        }

        return resumen;
    }

    async getOfertasOficialesDisponibles() {
        const [cursosExternos, cursosLocales] = await Promise.all([
            cursoExternoService.listarCursos(),
            cursoLocalRepo.getTodos()
        ]);

        const idsVinculados = new Set(
            (cursosLocales || [])
                .map(c => this._sanitizeString(c.idOfertaOficial))
                .filter(Boolean)
        );

        return (cursosExternos || [])
            .filter(c => !idsVinculados.has(this._sanitizeString(c[0])))
            .map(c => ({
                idOfertaOficial: this._sanitizeString(c[0]),
                anio: this._toNumberOrNull(c[1]),
                fechaInicioInscripcion: this._sanitizeString(c[3]),
                fechaFinInscripcion: this._sanitizeString(c[4]),
                fechaInicioCurso: this._sanitizeString(c[5]),
                fechaFinCurso: this._sanitizeString(c[6]),
                cupo: this._toNumberOrNull(c[8]),
                nombrePropuesta: this._sanitizeString(c[9]),
                dispositivo: this._sanitizeString(c[10]),
                enlaceInscripcion: this._sanitizeString(c[12]),
                idCursoOriginal: this._sanitizeString(c[13]),
                formadorAbc: this._sanitizeString(c[17]),
                raw: c
            }));
    }

    async vincularCursoConSitioOficial(data = {}, usuario = {}) {
        const cursoLocalId = this._sanitizeObjectId(data.cursoLocalId);
        const idOfertaOficial = this._sanitizeString(data.idOfertaOficial);

        if (!cursoLocalId) {
            const err = new Error('El campo cursoLocalId es obligatorio.');
            err.statusCode = 400;
            throw err;
        }
        if (!idOfertaOficial) {
            const err = new Error('El campo idOfertaOficial es obligatorio.');
            err.statusCode = 400;
            throw err;
        }

        const [cursoLocal, ofertaYaVinculada] = await Promise.all([
            cursoLocalRepo.getPorId(cursoLocalId),
            cursoLocalRepo.getPorIdOfertaOficial(idOfertaOficial)
        ]);

        if (!cursoLocal) {
            const err = new Error('Curso local no encontrado.');
            err.statusCode = 404;
            throw err;
        }

        if (ofertaYaVinculada && String(ofertaYaVinculada._id) !== String(cursoLocalId)) {
            const err = new Error('Esa oferta oficial ya esta vinculada a otro curso local.');
            err.statusCode = 409;
            throw err;
        }

        const mismoCiie = String(cursoLocal.ciieId?._id || cursoLocal.ciieId) === String(usuario?._id);
        if (!mismoCiie) {
            const err = new Error('No tenes permisos para vincular este curso.');
            err.statusCode = 403;
            throw err;
        }

        const oferta = this._sanitizeOfertaRaw(data.ofertaRaw);

        const update = {
            idOfertaOficial,
            estado: 'vinculado',
            enlaceInscripcion: oferta.enlaceInscripcion || cursoLocal.enlaceInscripcion,
            idCursoOriginal: oferta.idCursoOriginal || cursoLocal.idCursoOriginal,
            idCiieOriginal: oferta.idCiieOriginal || cursoLocal.idCiieOriginal,
            nombrePropuesta: oferta.nombrePropuesta || cursoLocal.nombrePropuesta,
            dispositivo: oferta.dispositivo || cursoLocal.dispositivo,
            formadorAbc: oferta.formadorAbc || cursoLocal.formadorAbc,
            anio: oferta.anio ?? cursoLocal.anio,
            cupo: oferta.cupo ?? cursoLocal.cupo,
            fechaInicioInscripcion: oferta.fechaInicioInscripcion || cursoLocal.fechaInicioInscripcion,
            fechaFinInscripcion: oferta.fechaFinInscripcion || cursoLocal.fechaFinInscripcion,
            fechaInicioCurso: oferta.fechaInicioCurso || cursoLocal.fechaInicioCurso,
            fechaFinCurso: oferta.fechaFinCurso || cursoLocal.fechaFinCurso,
            creadoPor: this._sanitizeString(usuario?.email) || cursoLocal.creadoPor
        };

        return await cursoLocalRepo.vincularConOfertaOficial(cursoLocalId, update);
    }

    async crearYVincularCursoEnSitioOficial(data = {}, usuario = {}) {
        const cursoLocalId = this._sanitizeObjectId(data.cursoLocalId);
        if (!cursoLocalId) {
            const err = new Error('El campo cursoLocalId es obligatorio.');
            err.statusCode = 400;
            throw err;
        }

        const cursoLocal = await cursoLocalRepo.getPorId(cursoLocalId);
        const encuentros = await encuentroRepo.getPorCursoId(cursoLocalId);
        console.log('Curso local para crear oferta oficial:', cursoLocal);
        console.log('Encuentros del curso:', encuentros);

        if (!cursoLocal) {
            const err = new Error('Curso local no encontrado.');
            err.statusCode = 404;
            throw err;
        }

        const mismoCiie = String(cursoLocal.ciieId?._id || cursoLocal.ciieId) === String(usuario?.referenciaId);
        if (!mismoCiie) {
            const err = new Error('No tenes permisos para publicar este curso.');
            err.statusCode = 403;
            throw err;
        }

        if (this._sanitizeString(cursoLocal.idOfertaOficial)) {
            const err = new Error('El curso ya esta vinculado a una oferta oficial.');
            err.statusCode = 409;
            throw err;
        }

        const idCursoOriginal = this._sanitizeString(cursoLocal.idCursoOriginal);
        if (!idCursoOriginal) {
            const err = new Error('El curso no tiene idCursoOriginal para crear la oferta en ABC.');
            err.statusCode = 400;
            throw err;
        }

        await sesionService.asegurarSesion();
        await cursoExternoRepo.sincronizarFiltros();
        await cursoExternoRepo.prepararSesionParaAlta(idCursoOriginal);

        const idDispositivo = this._mapDispositivoAId(cursoLocal.dispositivo);
        if (idDispositivo === '0') {
            const err = new Error('No se pudo determinar el dispositivo oficial para publicar en ABC.');
            err.statusCode = 400;
            throw err;
        }

        const inicioInscripcion = cursoLocal.fechaInicioInscripcion || new Date();
        const finInscripcion = cursoLocal.fechaFinInscripcion || cursoLocal.fechaInicioCurso || cursoLocal.fechaFinCurso;

        const payload = new URLSearchParams({
            id: '0',
            idcurso: idCursoOriginal,
            quees: 'A',
            volver: `ofertas.php?id=${idCursoOriginal}&quees=M&qi=65`,
            anio: String(cursoLocal.anio || new Date().getFullYear()),
            inicioa: this._toDateTimeLocalString(inicioInscripcion), // que va a ser la fecha de momento con lo mínimo posible de horas y minutos para evitar errores de validación del ABC
            fina: this._toDateString(finInscripcion), // esta fecha coincide con la del primer encuentro del curso
            fechaini: this._toDateString(encuentros[0]?.fecha), // esta fecha coincide con la del primer encuentro del curso
            fechafin: this._toDateString(encuentros[encuentros.length - 1]?.fecha), // esta fecha coincide con la del último encuentro del curso. si es un solo encuentro, va a ser la misma que fechaInicioCurso
            disponible: this._sanitizeString(cursoLocal.disponible) || 'S', // al principio siempre disponible, luego se puede actualizar desde el localRepo para que se oculte en el sitio oficial
            cupo: String(Math.round(cursoLocal.cupo * 1.15) || 35),
            iddispositivo: idDispositivo, // acá va el valor del select
            idalcance: String(this._normalizeAlcance(cursoLocal.alcance)), // acá va el valor del select
            tituloform: this._sanitizeString(cursoLocal.tituloFormulario) || '', //
            numero: String(cursoLocal.itinerario || 0), //aca va el número del itinerario
            nombrecapa: this._sanitizeString(cursoLocal.formadorAbc) || '' // acá va el nombre del formador que figura en el curso local, si no tiene se puede dejar vacío o poner "A designar"
        });

        let response = await cursoExternoRepo.crearOfertaOficial(payload);
        const ofertasResponse = await cursoExternoRepo.getOfertasDelCursoActivo();
        const todasLasOfertas = ofertasResponse?.data?.aaData || [];

        // La oferta recién creada tiene el id más alto (autoincremental)
        const ofertaCreada = todasLasOfertas.reduce((max, o) => 
            parseInt(o[0]) > parseInt(max[0]) ? o : max
        , todasLasOfertas[0]);
        console.log('Ofertas tras el alta:', ofertasResponse?.data);
        // console.log('Respuesta cruda ABC:', JSON.stringify(response?.data));
        // console.log('Respuesta headers:', response?.headers);
        // console.log('Status:', response?.status);
        let parsedResponse = this._parseAbcActionResponse(response?.data);

        if (parsedResponse.tipo === 'login') {
            await sesionService.asegurarSesion(true);
            await cursoExternoRepo.sincronizarFiltros();
            await cursoExternoRepo.prepararSesionParaAlta(idCursoOriginal);
            response = await cursoExternoRepo.crearOfertaOficial(payload);
            parsedResponse = this._parseAbcActionResponse(response?.data);
        }

        const { res, control, mensaje } = parsedResponse;

        if (res !== '99') {
            const err = new Error(mensaje || 'ABC no permitio crear la oferta oficial.');
            err.statusCode = 502;
            throw err;
        }

        const cursoActualizado = await cursoLocalRepo.vincularConOfertaOficial(cursoLocalId, {
            idOfertaOficial:        ofertaCreada[0],
            enlaceInscripcion:      ofertaCreada[11],
            fechaInicioInscripcion: this._parseFechaAbc(ofertaCreada[3]),
            fechaFinInscripcion:    this._parseFechaAbc(ofertaCreada[4]),
            disponible:             ofertaCreada[7],
            estado:                 'vinculado',
            creadoPor:              this._sanitizeString(usuario?.email) || cursoLocal.creadoPor
        });

        return {
            curso: cursoActualizado,
            abc: {
                res,
                idOfertaOficial: this._sanitizeString(control),
                mensaje: this._sanitizeString(mensaje)
            }
        };
    }

    // ─── Obtener un curso por ID ────────────────────────────────────────────────
    async getCursoById(cursoId) {
        const sanitizedId = this._sanitizeObjectId(cursoId);
        if (!sanitizedId) {
            const err = new Error('ID de curso inválido.');
            err.statusCode = 400;
            throw err;
        }

        const curso = await cursoLocalRepo.getPorId(sanitizedId);
        if (!curso) {
            const err = new Error('Curso no encontrado.');
            err.statusCode = 404;
            throw err;
        }

        // Cargar encuentros relacionados
        const encuentros = await encuentroRepo.getPorCursoId(sanitizedId);
        
        // Hacer populate del cargo para obtener clave y ciieId
        const cursoPopulado = await CursoLocal.findById(sanitizedId)
            .populate({
                path: 'cargoId',
                populate: {
                    path: 'ciieId',
                    select: 'clave nombre'
                }
            })
            .lean();
        
        return {
            ...cursoPopulado,
            encuentros: encuentros || []
        };
    }

    async getCursoByIdEdit(cursoId) {
        const sanitizedId = this._sanitizeObjectId(cursoId);
        if (!sanitizedId) {
            const err = new Error('ID de curso inválido.');
            err.statusCode = 400;
            throw err;
        }

        const curso = await cursoLocalRepo.getPorId(sanitizedId);
        if (!curso) {
            const err = new Error('Curso no encontrado.');
            err.statusCode = 404;
            throw err;
        }

        // Cargar encuentros relacionados
        const encuentros = await encuentroRepo.getPorCursoId(sanitizedId);
        
          
        return {
            ...curso,
            encuentros: encuentros || []
        };
    }
    // ─── Editar curso pendiente (por ID) ────────────────────────────────────────
async editarCursoPorId(cursoId, data = {}, usuario = {}) {
    const cursoLocalId = this._sanitizeObjectId(cursoId);
    if (!cursoLocalId) {
        const err = new Error('ID de curso inválido.');
        err.statusCode = 400;
        throw err;
    }

    const cursoLocal = await cursoLocalRepo.getPorId(cursoLocalId);
    if (!cursoLocal) {
        const err = new Error('Curso local no encontrado.');
        err.statusCode = 404;
        throw err;
    }

    const dispositivoNuevo = this._sanitizeString(data.dispositivo) || cursoLocal.dispositivo;
    const anioNuevo = this._toNumberOrNull(data.anio) ?? cursoLocal.anio;
    let itinerarioFinal = this._toNumberOrNull(data.itinerario);

    if (dispositivoNuevo !== cursoLocal.dispositivo || anioNuevo !== cursoLocal.anio) {
        itinerarioFinal = await this._calcularProximoItinerario(cursoLocal.ciieId, anioNuevo, dispositivoNuevo);
    } else if (itinerarioFinal === null) {
        itinerarioFinal = cursoLocal.itinerario;
    }

    const formatoDictado = this._sanitizeString(data.drupalFormatoDictado || data.publicacionDrupal?.formatoDictado);
    const modalidad = this._mapFormatoDictadoAModalidad(formatoDictado);

    // Actualizar encuentros si vienen fechas nuevas
    if (data.fechasEncuentros && Array.isArray(data.fechasEncuentros) && data.fechasEncuentros.length > 0) {
        const fechasNormalizadas = this._normalizeFechasEncuentros(data.fechasEncuentros);
        await encuentroRepo.delPorCursoId(cursoLocalId);
        for (let i = 0; i < fechasNormalizadas.length; i++) {
            await encuentroRepo.post({
                cursoId: cursoLocalId,
                numero: i + 1,
                fecha: fechasNormalizadas[i],
                modalidad
            });
        }
    }

    const update = {
        dispositivo:        dispositivoNuevo,
        formadorAbc:        this._sanitizeString(data.formadorAbc) || cursoLocal.formadorAbc,
        tituloFormulario:   this._sanitizeString(data.tituloFormulario),
        anio:               anioNuevo,
        itinerario:         itinerarioFinal,
        cupo:               this._toNumberOrNull(data.cupo) ?? cursoLocal.cupo,
        alcance:            this._toNumberOrNull(data.alcance) ?? cursoLocal.alcance,
        cantidadHoras:      this._toNumberOrNull(data.cantidadHoras),
        cantidadEncuentros: data.fechasEncuentros?.length || cursoLocal.cantidadEncuentros,
        publicacionDrupal: {
            ...cursoLocal.publicacionDrupal,
            formatoDictado,
            nivel:        this._sanitizeString(data.drupalNivel       || data.publicacionDrupal?.nivel),
            sede:         this._sanitizeString(data.drupalSede        || data.publicacionDrupal?.sede),
            organiza:     this._sanitizeString(data.drupalOrganiza    || data.publicacionDrupal?.organiza),
            puntaje:      this._toNumberOrNull(data.drupalPuntaje     || data.publicacionDrupal?.puntaje),
            diasHorarios: this._sanitizeString(data.drupalDiaDictado  || data.publicacionDrupal?.diasHorarios)
        }
    };

    Object.keys(update).forEach(key => {
        if (update[key] === undefined) delete update[key];
    });

    return await cursoLocalRepo.actualizarPendiente(cursoLocalId, update);
}

    async editarCursoPendiente(data = {}, usuario = {}) {
        console.log('entró a editarCursoPendiente')
        const cursoLocalId = this._sanitizeObjectId(data.cursoLocalId);
        if (!cursoLocalId) {
            const err = new Error('El campo cursoLocalId es obligatorio.');
            err.statusCode = 400;
            throw err;
        }

        const cursoLocal = await cursoLocalRepo.getPorId(cursoLocalId);
        if (!cursoLocal) {
            const err = new Error('Curso local no encontrado.');
            err.statusCode = 404;
            throw err;
        }

        const mismoCiie = String(cursoLocal.ciieId || '') === String(usuario?.referenciaId || '');
        if (!mismoCiie) {
            const err = new Error('No tenes permisos para editar este curso.');
            err.statusCode = 403;
            throw err;
        }

        // Si el curso está vinculado, guarda valores previos y cambia estado
        if (this._sanitizeString(cursoLocal.idOfertaOficial)) {
            const update = {
                estado: 'modificacion_pendiente',
                datosPrevios: {
                    dispositivo: cursoLocal.dispositivo,
                    formadorAbc: cursoLocal.formadorAbc,
                    tituloFormulario: cursoLocal.tituloFormulario,
                    anio: cursoLocal.anio,
                    cupo: cursoLocal.cupo,
                    alcance: cursoLocal.alcance,
                    certifica: cursoLocal.certifica,
                    enlaceInscripcion: cursoLocal.enlaceInscripcion
                }
            };
            return await cursoLocalRepo.actualizarPendiente(cursoLocalId, update);
        }

        const dispositivoNuevo = this._sanitizeString(data.dispositivo) || cursoLocal.dispositivo;
        const anioNuevo = this._toNumberOrNull(data.anio) ?? cursoLocal.anio;
        let itinerarioFinal = this._toNumberOrNull(data.itinerario);

        // Si se cambió dispositivo o año, recalcula itinerario
        if (dispositivoNuevo !== cursoLocal.dispositivo || anioNuevo !== cursoLocal.anio) {
            itinerarioFinal = await this._calcularProximoItinerario(cursoLocal.ciieId, anioNuevo, dispositivoNuevo);
        } else if (itinerarioFinal === null) {
            itinerarioFinal = cursoLocal.itinerario;
        }

        const update = {
            dispositivo: dispositivoNuevo,
            formadorAbc: this._sanitizeString(data.formadorAbc),
            tituloFormulario: this._sanitizeString(data.tituloFormulario),
            anio: anioNuevo,
            cohorte: this._toNumberOrNull(data.cohorte),
            itinerario: itinerarioFinal,
            fechaInicioInscripcion: this._toDateOrNull(data.fechaInicioInscripcion),
            fechaFinInscripcion: this._toDateOrNull(data.fechaFinInscripcion),
            disponible: this._sanitizeString(data.disponible),
            cupo: this._toNumberOrNull(data.cupo),
            alcance: this._toNumberOrNull(data.alcance),
            certifica: this._sanitizeString(data.certifica),
            enlaceInscripcion: this._sanitizeString(data.enlaceInscripcion),
            creadoPor: this._sanitizeString(usuario?.email) || cursoLocal.creadoPor
        };

        if (update.alcance !== null && update.alcance !== undefined) {
            update.alcance = this._normalizeAlcance(update.alcance);
        }

        Object.keys(update).forEach((key) => {
            if (update[key] === undefined) delete update[key];
        });

        if (Object.keys(update).length === 0) {
            const err = new Error('No hay campos validos para actualizar.');
            err.statusCode = 400;
            throw err;
        }

        return await cursoLocalRepo.actualizarPendiente(cursoLocalId, update);
    }

    async deleteCurso(cursoLocalId, usuario = {}) {
        const cursoId = this._sanitizeObjectId(cursoLocalId);
        if (!cursoId) {
            const err = new Error('El campo cursoLocalId es obligatorio.');
            err.statusCode = 400;
            throw err;
        }

        const curso = await cursoLocalRepo.getPorId(cursoId);
        if (!curso) {
            const err = new Error('Curso local no encontrado.');
            err.statusCode = 404;
            throw err;
        }

        // Verificar permisos según tipo de usuario
        let tienePermiso = false;
        
        if (usuario?.tipoModel === 'Ciie') {
            // Usuario de institución (CIIE)
            tienePermiso = String(curso.ciieId || '') === String(usuario?.referenciaId || '');
        } else if (usuario?.tipoModel === 'Persona') {
            // Usuario docente: debe tener el cargo del curso
            const asignacionRepo = require('../repos/asignacionRepo');
            const asignaciones = await asignacionRepo.getByAgente(usuario?._id);
            const cargoIds = asignaciones.map(a => String(a.cargoId._id));
            tienePermiso = cargoIds.includes(String(curso.cargoId?._id || curso.cargoId || ''));
        }

        if (!tienePermiso) {
            const err = new Error('No tenes permisos para eliminar este curso.');
            err.statusCode = 403;
            throw err;
        }

        // Si el curso está vinculado
        if (this._sanitizeString(curso.idOfertaOficial)) {
            const inscriptos = await inscriptoLocalRepo.getPorCursoId(cursoId);
            if (inscriptos && inscriptos.length > 0) {
                const err = new Error(`No se puede eliminar: hay ${inscriptos.length} inscriptos. El sistema no permite eliminar cursos con inscriptos del sitio oficial.`);
                err.statusCode = 409;
                throw err;
            }

            // Para usuarios CIIE, eliminar físicamente
            if (usuario?.tipoModel === 'Ciie') {
                try {
                    // 1. Eliminar encuentros asociados
                    await encuentroRepo.delPorCursoId(cursoId);

                    // 2. Eliminar el curso
                    await cursoLocalRepo.delPorId(cursoId);

                    return { success: true, message: 'Curso y sus encuentros eliminados correctamente.' };
                } catch (error) {
                    console.error('Error al eliminar curso:', error.message);
                    throw error;
                }
            } else {
                // Para usuarios Persona, cambiar a estado dormido
                const update = {
                    estado: 'dormido',
                    itinerario: 0,
                    datosPrevios: {
                        estado: curso.estado,
                        itinerario: curso.itinerario,
                        dispositivo: curso.dispositivo,
                        formadorAbc: curso.formadorAbc
                    }
                };
                return await cursoLocalRepo.actualizarPendiente(cursoId, update);
            }
        }

        // Si es pendiente (sin vincular), eliminar físicamente con cascada
        try {
            // 1. Eliminar encuentros asociados
            await encuentroRepo.delPorCursoId(cursoId);

            // 2. Eliminar el curso
            await cursoLocalRepo.delPorId(cursoId);

            return { success: true, message: 'Curso y sus encuentros eliminados correctamente.' };
        } catch (error) {
            console.error('Error al eliminar curso:', error.message);
            throw error;
        }
    }

    // ─── Helpers privados ────────────────────────────────────────────────────
    _parseFechaAbc(fechaStr) {
        if (!fechaStr || fechaStr === '0' || typeof fechaStr !== 'string') return null;
        const [fecha] = fechaStr.split(' ');
        const [dia, mes, anio] = fecha.split('-');
        return new Date(anio, mes - 1, dia);
    }

    async _getCursoVinculadoDelCiie(cursoLocalId, usuario = {}) {
        const cursoId = this._sanitizeObjectId(cursoLocalId);
        if (!cursoId) {
            const err = new Error('El campo cursoLocalId es obligatorio.');
            err.statusCode = 400;
            throw err;
        }

        const curso = await cursoLocalRepo.getPorId(cursoId);
        if (!curso) {
            const err = new Error('Curso local no encontrado.');
            err.statusCode = 404;
            throw err;
        }

        const mismoCiie = String(curso.ciieId?._id || curso.ciieId) === String(usuario?.referenciaId);
        if (!mismoCiie) {
            const err = new Error('No tenes permisos para gestionar este curso.');
            err.statusCode = 403;
            throw err;
        }

        if (this._sanitizeString(curso.estado) !== 'vinculado') {
            const err = new Error('Solo se pueden enviar calificaciones de cursos vinculados.');
            err.statusCode = 409;
            throw err;
        }

        if (!this._sanitizeString(curso.idOfertaOficial) || !this._sanitizeString(curso.idCursoOriginal)) {
            const err = new Error('El curso no tiene los datos oficiales necesarios para enviar calificaciones.');
            err.statusCode = 409;
            throw err;
        }

        return curso;
    }

    async _getCursoVinculadoDelCiiePorOferta(idOfertaOficial, usuario = {}) {
        const oferta = this._sanitizeString(idOfertaOficial);
        if (!oferta) {
            const err = new Error('El idOfertaOficial es obligatorio.');
            err.statusCode = 400;
            throw err;
        }

        const curso = await cursoLocalRepo.getPorIdOfertaOficial(oferta);
        if (!curso) {
            const err = new Error('Curso local no encontrado para la oferta oficial.');
            err.statusCode = 404;
            throw err;
        }

        const mismoCiie = String(curso.ciieId?._id || curso.ciieId) === String(usuario?.referenciaId);
        if (!mismoCiie) {
            const err = new Error('No tenes permisos para gestionar este curso.');
            err.statusCode = 403;
            throw err;
        }

        if (this._sanitizeString(curso.estado) !== 'vinculado') {
            const err = new Error('Solo se pueden gestionar documentos y calificaciones de cursos vinculados.');
            err.statusCode = 409;
            throw err;
        }

        if (!this._sanitizeString(curso.idOfertaOficial) || !this._sanitizeString(curso.idCursoOriginal)) {
            const err = new Error('El curso no tiene los datos oficiales necesarios para continuar.');
            err.statusCode = 409;
            throw err;
        }

        return curso;
    }

    async _enviarCalificacionesCurso(curso) {
        const inscriptos = await inscriptoLocalRepo.getPorCursoId(curso._id);
        if (!inscriptos || inscriptos.length === 0) {
            const err = new Error('El curso no tiene inscriptos locales para enviar.');
            err.statusCode = 400;
            throw err;
        }

        const pendientes = inscriptos.filter(i => this._sanitizeString(i.calificacion) && i.calificacion !== 'Sin Calificar');
        if (pendientes.length === 0) {
            const err = new Error('No hay calificaciones cargadas para enviar a ABC.');
            err.statusCode = 400;
            throw err;
        }

        const sinCalificar = inscriptos.filter(i => !this._sanitizeString(i.calificacion) || i.calificacion === 'Sin Calificar');
        if (sinCalificar.length > 0) {
            const err = new Error('Hay inscriptos sin calificar. Completá las calificaciones antes de enviar.');
            err.statusCode = 400;
            throw err;
        }

        for (const inscripto of pendientes) {
            const nota = this._mapCalificacionAbc(inscripto.calificacion);
            await inscriptoExternoService.cambiarNota(
                this._sanitizeString(inscripto.idInscripcionOficial),
                nota,
                this._sanitizeString(curso.idCursoOriginal)
            );
        }

        return { enviados: pendientes.length };
    }

    async _buildDocumentosCurso(curso, inscriptosLocales = [], cursoLocal, ciie) {
        const externos = await certificadoExternoService.obtenerCertificado(curso.idOfertaOficial);
        const metadatos = externos?.parsed?.metadatos || {};
        const propuesta = externos?.parsed?.propuesta || this._sanitizeString(curso.nombrePropuesta);
        // Extraemos los datos del formador de TU base de datos (cursoLocal)
        const persona = cursoLocal?.cargoId?.ocupante?.usuarioId?.referenciaId;
        const nombreCompletoLocal = persona ? `${persona.apellido}, ${persona.nombre}` : null;
        // Extraemos la clave del cargo (ej: 'artm-1') y el nombre del área
        const claveCargo = cursoLocal?.cargoId?.clave || 'Sin clave';
        const nombreArea = cursoLocal?.cargoId?.areaId?.nombre || 'Área no definida';
        const cohorte = cursoLocal?.cohorte || ''

        const certificados = inscriptosLocales
            .filter(i => this._esAprobado(i.calificacion))
            .map(i => ({
                nombreCompleto: this._buildNombreCompleto(i),
                dni: this._sanitizeString(i.dni),
                calificacion: this._normalizarResultado(i.calificacion),
                idInscripcionOficial: this._sanitizeString(i.idInscripcionOficial)
            }));

        const acta = inscriptosLocales
            .map(i => ({
                nombreCompleto: this._buildNombreCompleto(i),
                dni: this._sanitizeString(i.dni),
                calificacion: this._normalizarResultado(i.calificacion),
                idInscripcionOficial: this._sanitizeString(i.idInscripcionOficial)
            }))
            .sort((a, b) => (a.nombreCompleto || '').localeCompare((b.nombreCompleto || ''), 'es'))
            .map((fila, index) => ({ ...fila, orden: index + 1 }));

        return {
            curso: {
                _id: curso._id,
                idOfertaOficial: curso.idOfertaOficial,
                idCursoOriginal: curso.idCursoOriginal,
                nombrePropuesta: curso.nombrePropuesta,
                anio: curso.anio,
                cohorte: cohorte || curso.cohorte,
                fechaInicioCurso: curso.fechaInicioCurso,
                fechaFinCurso: curso.fechaFinCurso,
                dispositivo: curso.dispositivo,
                formadorAbc: nombreCompletoLocal || curso.formadorAbc,
                claveCargo: claveCargo, // <--- NUEVA PROPIEDAD
                areaNombre: nombreArea,  // <--- NUEVA PROPIEDAD
                impresionDocumentos: curso.impresionDocumentos || {}
            },
            administrativos: {
                resolucion: metadatos.resolucion,
                proyecto: metadatos.proyecto,
                dictamen: metadatos.dictamen,
                puntaje: metadatos.puntaje,
                horas: metadatos.horas,
                cursoClave: cursoLocal.cargoId.clave,
                propuesta
            },
            institucion:{
                distrito: ciie.distrito,
                localidad: ciie.localidad
            },
            certificados,
            acta
        };
    }

    _mapCalificacionAbc(calificacion) {
        const value = this._sanitizeString(calificacion);
        if (!value) return '';
        return value;
    }

_capitalizarNombrePropio(str = '') {
    return str
        .toLowerCase()
        .replace(/(?:^|[\s,\-])(\S)/g, (match, letra) => 
            match.replace(letra, letra.toUpperCase())
        );
}

_buildNombreCompleto(inscripto = {}) {
    const apellido = this._capitalizarNombrePropio(this._sanitizeString(inscripto.apellido) || '');
    const nombres  = this._capitalizarNombrePropio(this._sanitizeString(inscripto.nombres)  || '');
    return `${apellido}, ${nombres}`.replace(/(^\s*,\s*)|(\s+,\s*$)/g, '').trim();
}

    _esAprobado(calificacion) {
        const value = this._sanitizeString(calificacion) || '';
        const normalizado = value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
        return ['aprobado', 'aprobo', 'asistio'].includes(normalizado);
    }

    _normalizarResultado(calificacion) {
        const value = this._sanitizeString(calificacion);
        if (!value) return 'Sin Calificar';

        const normalizado = value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();

        const mapa = {
            aprobado: 'Aprobado',
            aprobo: 'Aprobado',
            desaprobado: 'Desaprobado',
            desaprobo: 'Desaprobado',
            ausente: 'Ausente',
            asistio: 'Aprobado'
        };

        return mapa[normalizado] || value;
    }

    _normalizeTipoDocumento(tipo) {
        const value = (this._sanitizeString(tipo) || 'ambos').toLowerCase();
        if (value === 'certificados' || value === 'acta' || value === 'ambos') {
            return value;
        }
        const err = new Error('Tipo de documento invalido.');
        err.statusCode = 400;
        throw err;
    }

    _sanitizeString(value) {
        if (value === null || value === undefined) return undefined;
        const out = String(value).trim();
        return out === '' ? undefined : out;
    }

    _toNumberOrNull(value) {
        if (value === null || value === undefined || value === '') return null;
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    _toDateOrNull(value) {
        if (!value) return null;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    _sanitizeObjectId(value) {
        const s = this._sanitizeString(value);
        return s || undefined;
    }

    _normalizeAlcance(value) {
        const n = this._toNumberOrNull(value);
        return n === 2 ? 2 : 1;
    }

    _normalizeCalificaciones(value) {
        if (!value || typeof value !== 'object') return undefined;
        const estadosValidos = ['sin_cargar', 'pendiente_envio', 'enviado'];
        const estado = this._sanitizeString(value.estado) || 'sin_cargar';
        const cal = {
            estado: estadosValidos.includes(estado) ? estado : 'sin_cargar'
        };
        const fechaEnvio = this._toDateOrNull(value.fechaEnvio);
        const enviadoPor = this._sanitizeString(value.enviadoPor);
        if (fechaEnvio) cal.fechaEnvio = fechaEnvio;
        if (enviadoPor) cal.enviadoPor = enviadoPor;
        return cal;
    }

    _normalizePublicacionDrupal(value, cantidadHoras, horaDictado) {
        if (!value || typeof value !== 'object') return undefined;

        const formatosValidos = ['Asincrónico (239)', 'Presencial (237)', 'Sincrónico (238)', 'Virtual (236)'];
        const formatoDictado  = this._sanitizeString(value.formatoDictado);

        // Armamos diasHorarios combinando día + hora + duración
        // Ej: "Martes, 14:00 hs. (4 hs. por encuentro)"
        const dia   = this._sanitizeString(value.diasHorarios);
        const horas = this._toNumberOrNull(cantidadHoras);
        let diasHorarios;
        if (dia) {
            diasHorarios = dia;
            if (horas) diasHorarios += ` (${horas} hs. por encuentro)`;
        }

        const publicacion = {
            nodeId:         this._sanitizeString(value.nodeId),
            nivel:          this._sanitizeString(value.nivel),
            materia:        this._sanitizeString(value.materia),
            modalidad:      this._sanitizeString(value.modalidad),
            formatoDictado: formatosValidos.includes(formatoDictado) ? formatoDictado : undefined,
            puntaje:        this._toNumberOrNull(value.puntaje),
            duracion:       this._sanitizeString(value.duracion),
            diasHorarios,
            sede:           this._sanitizeString(value.sede),
            organiza:       this._sanitizeString(value.organiza),
            distrito:       this._sanitizeString(value.distrito),
            publicado:      Boolean(value.publicado)
        };

        const tieneDatos = Object.keys(publicacion).some(k => {
            if (k === 'publicado') return publicacion[k] === true;
            return publicacion[k] !== undefined && publicacion[k] !== null;
        });

        return tieneDatos ? publicacion : undefined;
    }

    _normalizeFechasEncuentros(value) {
        if (!Array.isArray(value)) return [];

        const fechas = value
            .map(v => this._toDateOrNull(v))
            .filter(Boolean)

        const fechasUnicas = new Set(fechas.map(f => f.toISOString().split('T')[0]));
        if (fechasUnicas.size !== fechas.length) {
            const err = new Error('No se pueden repetir fechas de encuentros.');
            err.statusCode = 400;
            throw err;
        }

        return fechas;
    }

    _buildFechasEncuentrosDesdeInicio(fechaInicioCurso, cantidadEncuentros) {
        const inicio = this._toDateOrNull(fechaInicioCurso);
        const cantidad = this._toNumberOrNull(cantidadEncuentros) ?? 0;
        if (!inicio || cantidad < 1) return [];

        const fechas = [];
        for (let i = 0; i < cantidad; i += 1) {
            const d = new Date(inicio);
            d.setDate(d.getDate() + (i * 7));
            d.setUTCHours(0, 0, 0, 0);
            fechas.push(d);
        }
        return fechas;
    }

    _mapFormatoDictadoAModalidad(formatoDictado) {
        const value = this._sanitizeString(formatoDictado) || '';
        if (value.includes('Presencial')) return 'Presencial';
        if (value.includes('Virtual')) return 'Virtual';
        if (value.includes('Asincrónico')) return 'Virtual';
        if (value.includes('Sincrónico')) return 'Virtual';
        return 'Presencial';
    }

    async _crearEncuentrosIniciales(cursoCreado, fechasEncuentros, data = {}) {
        if (!cursoCreado?._id) {
            const err = new Error('No se pudo determinar el curso para crear encuentros.');
            err.statusCode = 500;
            throw err;
        }

        if (!Array.isArray(fechasEncuentros) || fechasEncuentros.length === 0) {
            const err = new Error('Debes ingresar al menos una fecha de encuentro.');
            err.statusCode = 400;
            throw err;
        }

        const modalidad = this._mapFormatoDictadoAModalidad(data?.publicacionDrupal?.formatoDictado);

        for (let i = 0; i < fechasEncuentros.length; i += 1) {
            await encuentroRepo.post({
                cursoId: cursoCreado._id,
                numero: i + 1,
                fecha: fechasEncuentros[i],
                modalidad
            });
        }
    }

    _sanitizeOfertaRaw(value) {
        if (!Array.isArray(value)) return {};
        return {
            anio: this._toNumberOrNull(value[1]),
            fechaInicioInscripcion: this._parseFechaAbc(value[3]),
            fechaFinInscripcion: this._parseFechaAbc(value[4]),
            fechaInicioCurso: this._parseFechaAbc(value[5]),
            fechaFinCurso: this._parseFechaAbc(value[6]),
            cupo: this._toNumberOrNull(value[8]),
            nombrePropuesta: this._sanitizeString(value[9]),
            dispositivo: this._sanitizeString(value[10]),
            enlaceInscripcion: this._sanitizeString(value[12]),
            idCursoOriginal: this._sanitizeString(value[13]),
            formadorAbc: this._sanitizeString(value[17])
        };
    }

    _toDateString(value) {
        if (!value) return '';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    _toDateTimeLocalString(value) {
        if (!value) return '';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    }

    _mapDispositivoAId(dispositivo) {
        const value = this._sanitizeString(dispositivo) || '';
        const mapa = {
            'Taller Fuera de Servicio': '1',
            'Curso Distancia': '2',
            'Taller en Servicio': '3',
            'Ateneo Distancia': '4',
            'MADP + Ateneo': '5',
            'Extensión CIIE': '7',
            'Seminario': '8',
            'Seminario Distancia': '9'
        };
        return mapa[value] || '0';
    }

    async _calcularProximoItinerario(ciieId, anio, dispositivo) {
        const anioNum = this._toNumberOrNull(anio);
        const dispositivoStr = this._sanitizeString(dispositivo);
        
        if (anioNum === null || !dispositivoStr) {
            return 1;
        }

        const cursosDelDispositivo = await cursoLocalRepo.getPorCiieAnioDispositivo(
            ciieId,
            anioNum,
            dispositivoStr
        );

        if (!cursosDelDispositivo || cursosDelDispositivo.length === 0) {
            return 1; // Primer curso de este dispositivo
        }

        const itinerarios = cursosDelDispositivo
            .map(c => this._toNumberOrNull(c.itinerario))
            .filter(it => it !== null);

        if (itinerarios.length === 0) {
            return 1;
        }

        return Math.max(...itinerarios) + 1;
    }

    _parseAbcActionResponse(raw) {
        const text = String(raw || '').trim();
        const lower = text.toLowerCase();

        if (!text) {
            return {
                tipo: 'error',
                res: undefined,
                control: undefined,
                mensaje: 'ABC devolvio una respuesta vacia.'
            };
        }

        if (lower.includes('<title>inicio de sesi') || lower.includes('id="loginform"') || lower.includes("id='loginform'")) {
            return {
                tipo: 'login',
                res: undefined,
                control: undefined,
                mensaje: 'La sesion en ABC expiro y se requiere reautenticacion.'
            };
        }

        const parts = text.split('~');
        if (parts.length >= 3) {
            return {
                tipo: 'abc',
                res: parts[0],
                control: parts[1],
                mensaje: parts[2]
            };
        }

        const preview = text.replace(/\s+/g, ' ').slice(0, 180);
        return {
            tipo: 'error',
            res: undefined,
            control: undefined,
            mensaje: `Respuesta inesperada de ABC: ${preview}`
        };
    }

    _normalizeFechasEncuentros(fechas) {
        if (!Array.isArray(fechas)) return [];
        return fechas.map(f => new Date(f)).filter(d => !isNaN(d.getTime()));
    }
}

module.exports = new CursoLocalService();
