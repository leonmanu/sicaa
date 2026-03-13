const cargoRepo = require('../repos/cargoRepo');
const cursoLocalRepo = require('../repos/cursoLocalRepo');
const inscriptoLocalRepo = require('../repos/inscriptoLocalRepo');
const cursoExternoRepo = require('../repos/cursoExternoRepo');
const cargoService = require('./cargoService');
const cursoExternoService = require('./cursoExternoService');
const sesionService = require('./sesionService');

class CursoLocalService {

    // ─── Alta desde formulario propio ────────────────────────────────────────
    async post(data = {}, usuario = {}) {
        const cursoBaseId = this._sanitizeObjectId(data.cursoBaseId);
        const cargoId     = this._sanitizeObjectId(data.cargoId);

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

        const documento = {
            // Identificadores oficiales
            idOfertaOficial: this._sanitizeString(data.idOfertaOficial), // null hasta que se publique en ABC
            idCursoOriginal: this._sanitizeString(data.idCursoOriginal),
            idCiieOriginal:  this._sanitizeString(data.idCiieOriginal),

            // Datos de la propuesta
            nombrePropuesta:  this._sanitizeString(data.nombrePropuesta)  || 'Sin nombre',
            dispositivo:      this._sanitizeString(data.dispositivo)      || 'No especificado',
            formadorAbc:      this._sanitizeString(data.formadorAbc)      || 'A designar',
            tituloFormulario: this._sanitizeString(data.tituloFormulario) || '',

            // Tiempos
            anio:    this._toNumberOrNull(data.anio)    ?? new Date().getFullYear(),
            cohorte: this._toNumberOrNull(data.cohorte) ?? 0,
            fechaInicioInscripcion: this._toDateOrNull(data.fechaInicioInscripcion),
            fechaFinInscripcion:    this._toDateOrNull(data.fechaFinInscripcion),
            fechaInicioCurso:       this._toDateOrNull(data.fechaInicioCurso),
            fechaFinCurso:          this._toDateOrNull(data.fechaFinCurso),
            cantidadEncuentros: this._toNumberOrNull(data.cantidadEncuentros) ?? 1,
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
            ciieId: this._sanitizeObjectId(data.ciieId) || this._sanitizeObjectId(usuario?._id),

            // Meta
            estado:    'pendiente',
            creadoPor: this._sanitizeString(data.creadoPor) || this._sanitizeString(usuario?.email),

            // Calificaciones
            calificaciones: this._normalizeCalificaciones(data.calificaciones) ?? { estado: 'sin_cargar' },

            // Publicación Drupal
            publicacionDrupal: this._normalizePublicacionDrupal(
                data.publicacionDrupal,
                data.cantidadHoras,     // se pasa por separado porque viene en el root del payload
                data.fechaInicioCurso  
            )
        };

        return await cursoLocalRepo.post(documento);
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
        return { cursosLocales, cargo };
    }

    async getCursosPorCiieId(ciieId) {
        const cursos = await cursoLocalRepo.getPorCiieId(ciieId);
        if (!cursos || cursos.length === 0) return [];

        const cursoIds = cursos.map(c => c._id);
        const inscriptos = await inscriptoLocalRepo.getPorListaDeCursos(cursoIds);

        return cursos.map(curso => ({
            ...curso,
            cantidadInscriptos: inscriptos.filter(i =>
                i.cursoId.toString() === curso._id.toString()
            ).length
        }));
    }

    async getPorIdOfertaOficial(ofertaId) {
        return await cursoLocalRepo.getPorIdOfertaOficial(ofertaId);
    }

    async getPorCargoId(cargoId) {
        return await cursoLocalRepo.getPorCargoId(cargoId);
    }

    async getTodos() {
        return await cursoLocalRepo.getTodos();
    }

    async getPendientesVinculacionPorCiie(ciieId) {
        const cursosLocales = await cursoLocalRepo.getPendientesVinculacionPorCiie(ciieId);
        return cursosLocales;
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
            inicioa: this._toDateTimeLocalString(inicioInscripcion),
            fina: this._toDateString(finInscripcion),
            fechaini: this._toDateString(cursoLocal.fechaInicioCurso),
            fechafin: this._toDateString(cursoLocal.fechaFinCurso),
            disponible: this._sanitizeString(cursoLocal.disponible) || 'S',
            cupo: String(cursoLocal.cupo || 0),
            iddispositivo: idDispositivo,
            idalcance: String(this._normalizeAlcance(cursoLocal.alcance)),
            tituloform: this._sanitizeString(cursoLocal.tituloFormulario) || '',
            numero: String(cursoLocal.cohorte || 0),
            nombrecapa: this._sanitizeString(cursoLocal.formadorAbc) || ''
        });

        let response = await cursoExternoRepo.crearOfertaOficial(payload);
        const ofertasResponse = await cursoExternoRepo.getOfertasDelCursoActivo();
        const ofertaCreada = ofertasResponse?.data?.aaData?.[0];
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

    async editarCursoPendiente(data = {}, usuario = {}) {
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

        const mismoCiie = String(cursoLocal.ciieId?._id || cursoLocal.ciieId) === String(usuario?.referenciaId);
        if (!mismoCiie) {
            const err = new Error('No tenes permisos para editar este curso.');
            err.statusCode = 403;
            throw err;
        }

        if (this._sanitizeString(cursoLocal.idOfertaOficial)) {
            const err = new Error('Solo se pueden editar cursos pendientes sin oferta oficial.');
            err.statusCode = 409;
            throw err;
        }

        const update = {
            dispositivo: this._sanitizeString(data.dispositivo),
            formadorAbc: this._sanitizeString(data.formadorAbc),
            tituloFormulario: this._sanitizeString(data.tituloFormulario),
            anio: this._toNumberOrNull(data.anio),
            cohorte: this._toNumberOrNull(data.cohorte),
            fechaInicioInscripcion: this._toDateOrNull(data.fechaInicioInscripcion),
            fechaFinInscripcion: this._toDateOrNull(data.fechaFinInscripcion),
            fechaInicioCurso: this._toDateOrNull(data.fechaInicioCurso),
            fechaFinCurso: this._toDateOrNull(data.fechaFinCurso),
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

    // ─── Helpers privados ────────────────────────────────────────────────────
    _parseFechaAbc(fechaStr) {
        if (!fechaStr || fechaStr === '0' || typeof fechaStr !== 'string') return null;
        const [fecha] = fechaStr.split(' ');
        const [dia, mes, anio] = fecha.split('-');
        return new Date(anio, mes - 1, dia);
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
        const hora = fechaInicioCurso ? fechaInicioCurso.split('T')[1]?.slice(0, 5) : undefined;
        const horas = this._toNumberOrNull(cantidadHoras);
        let diasHorarios;
        if (dia) {
            diasHorarios = dia;
            if (hora)  diasHorarios += `, ${hora} hs.`;
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
}

module.exports = new CursoLocalService();
