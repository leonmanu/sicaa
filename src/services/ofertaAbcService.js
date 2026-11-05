// src/services/ofertaAbcService.js
const sesionService = require('./sesionService');
const cursoExternoRepo = require('../repos/cursoExternoRepo');
const cursoLocalRepo = require('../repos/cursoLocalRepo');
const encuentroRepo = require('../repos/encuentroRepo');
const { ejecutarComo } = require('./contextoCiie');

// Lee una oferta tal como quedó guardada en ABC (formulario am.php) para poder
// comparar con lo que se le mandó o con lo que tenemos en Mongo. ABC acepta
// datos incoherentes sin avisar (responde "99" igual), así que la única forma
// de detectar esos errores es releer lo que guardó.

const TZ_ARG = 'America/Argentina/Buenos_Aires';

const CAMPOS = {
    anio:          'Año',
    inicioa:       'Inicio de inscripción',
    fina:          'Fin de inscripción',
    fechaini:      'Inicio de cursada',
    fechafin:      'Fin de cursada',
    disponible:    'Disponible',
    cupo:          'Cupo',
    iddispositivo: 'Dispositivo',
    idalcance:     'Alcance',
    idformato:     'Formato',
    tituloform:    'Título del formulario',
    nombrecapa:    'Formador/a',
    enlace:        'Enlace de inscripción'
};

const DISPOSITIVOS = { 1: 'Taller Fuera de Servicio', 2: 'Curso Distancia', 3: 'Taller en Servicio', 4: 'Ateneo Distancia', 5: 'MADP + Ateneo', 7: 'Extensión CIIE', 8: 'Seminario', 9: 'Seminario Distancia' };
const ALCANCES = { 1: 'Sólo este CIIE', 2: 'Toda la Región' };
const FORMATOS = { 1: 'Sin definir', 2: 'Presencial', 3: 'Sincrónico Virtual', 4: 'Virtual', 5: 'Combinado' };

// ─── Fechas en hora argentina (así las interpreta ABC) ──────────────────────

const _partesArg = (d) => Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ_ARG, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(d).map(p => [p.type, p.value])
);

// 'YYYY-MM-DDTHH:mm' en hora argentina, como lo espera el input inicioa de ABC.
const fechaHoraArg = (valor) => {
    if (!valor) return '';
    const d = new Date(valor);
    if (isNaN(d)) return '';
    const p = _partesArg(d);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};

// 'YYYY-MM-DD' del día que representa una fecha guardada. Las fechas "de solo día"
// que vienen de ABC o de un input date quedan a las 00:00 UTC (su día es el UTC);
// el resto (encuentros con hora, etc.) se lee en hora argentina.
const fechaDiaArg = (valor) => {
    if (!valor) return '';
    const d = new Date(valor);
    if (isNaN(d)) return '';
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0) {
        return d.toISOString().slice(0, 10);
    }
    const p = _partesArg(d);
    return `${p.year}-${p.month}-${p.day}`;
};

// Inversas: de lo que muestra ABC a un Date (hora argentina, sin horario de verano).
const desdeFechaHoraArg = (s) => (s ? new Date(`${String(s).slice(0, 16)}:00-03:00`) : null);
const desdeFechaDiaArg = (s) => (s ? new Date(`${s}T00:00:00-03:00`) : null);

const fechaLegible = (s) => {
    if (!s) return '';
    const [fecha, hora] = String(s).split('T');
    const [a, m, d] = fecha.split('-');
    return `${d}/${m}/${a}${hora ? ' ' + hora : ''}`;
};

// ─── Lectura del formulario de ABC ──────────────────────────────────────────

// El value de un input de ABC puede traer comillas sin escapar (ej. un título con
// "..." adentro), así que se corta en la comilla que cierra antes del siguiente atributo.
const _valorInput = (tag) => {
    const m = tag.match(/\bvalue=(["'])([\s\S]*?)\1(?=\s+[\w-]+(?:=|\s|>|\/)|\s*\/?>)/);
    return m ? m[2] : '';
};

const _valorSelect = (html, campo) => {
    const re = new RegExp(`<select\\b[^>]*\\bid=["']${campo}["'][^>]*>([\\s\\S]*?)</select`, 'i');
    const bloque = String(html).match(re)?.[1] || '';
    const opcion = bloque.match(/<option\b[^>]*\bselected\b[^>]*>/i)?.[0];
    return opcion?.match(/\bvalue=["']?([^"'\s>]+)/)?.[1] || '';
};

function parsearFormulario(html) {
    const texto = String(html || '');
    const inputs = {};
    for (const [tag] of texto.matchAll(/<input\b[^>]*>/gi)) {
        const id = tag.match(/\bid=["']([^"']+)["']/)?.[1];
        if (id) inputs[id] = _valorInput(tag);
    }
    if (!('inicioa' in inputs) || !('fechaini' in inputs)) return null; // no es el formulario de la oferta

    return {
        anio:          _valorSelect(texto, 'anio'),
        inicioa:       (inputs.inicioa || '').replace(' ', 'T').slice(0, 16),
        fina:          (inputs.fina || '').slice(0, 10),
        fechaini:      (inputs.fechaini || '').slice(0, 10),
        fechafin:      (inputs.fechafin || '').slice(0, 10),
        disponible:    (inputs.disponible || '').trim(),
        cupo:          (inputs.cupo || '').trim(),
        iddispositivo: _valorSelect(texto, 'iddispositivo'),
        idalcance:     _valorSelect(texto, 'idalcance'),
        idformato:     _valorSelect(texto, 'idformato'),
        tituloform:    (inputs.tituloform || '').trim(),
        nombrecapa:    (inputs.nombrecapa || '').trim(),
        enlace:        (inputs.enlace || '').trim()
    };
}

async function leerOferta(idOfertaOficial) {
    const intentar = async (forzar) => {
        await sesionService.asegurarSesion(forzar);
        await cursoExternoRepo.sincronizarFiltros();
        return parsearFormulario(await cursoExternoRepo.prepararSesionParaEdicion(idOfertaOficial));
    };
    // Si la sesión se cayó, ABC devuelve el login en vez del formulario: un reintento con login nuevo.
    const oferta = (await intentar(false)) || (await intentar(true));
    if (!oferta) throw new Error(`No se pudo leer la oferta ${idOfertaOficial} en ABC.`);
    return oferta;
}

// ─── Comparaciones ──────────────────────────────────────────────────────────

const _normalizar = (campo, v) => {
    const s = String(v ?? '').trim();
    if (['anio', 'cupo', 'iddispositivo', 'idalcance', 'idformato'].includes(campo)) return s === '' ? '' : String(Number(s));
    if (['tituloform', 'nombrecapa'].includes(campo)) return s.replace(/\s+/g, ' ');
    return s;
};

const legible = (campo, v) => {
    if (v === '' || v == null) return '(vacío)';
    if (['inicioa', 'fina', 'fechaini', 'fechafin'].includes(campo)) return fechaLegible(v);
    if (campo === 'iddispositivo') return DISPOSITIVOS[v] ? `${DISPOSITIVOS[v]} (${v})` : String(v);
    if (campo === 'idalcance') return ALCANCES[v] ? `${ALCANCES[v]} (${v})` : String(v);
    if (campo === 'idformato') return FORMATOS[v] ? `${FORMATOS[v]} (${v})` : String(v);
    return String(v);
};

// Diferencias entre lo que se mandó (`esperado`, mismas claves que CAMPOS) y lo que quedó.
function diferencias(esperado, actual) {
    return Object.keys(CAMPOS)
        .filter(c => esperado[c] !== undefined && _normalizar(c, esperado[c]) !== _normalizar(c, actual[c]))
        .map(c => ({ campo: c, etiqueta: CAMPOS[c], esperado: legible(c, esperado[c]), actual: legible(c, actual[c]) }));
}

// Incoherencias de la oferta consigo misma, que ABC acepta sin quejarse.
function alertasCoherencia(oferta, hoy = new Date()) {
    const alertas = [];
    const { inicioa, fina, fechaini, fechafin } = oferta;
    const inicioDia = (inicioa || '').slice(0, 10);
    if (inicioDia && fina && inicioDia > fina) alertas.push('La inscripción termina antes de empezar.');
    if (fechaini && fechafin && fechaini > fechafin) alertas.push('La cursada termina antes de empezar.');
    if (fina && fechafin && fina > fechafin) alertas.push('La inscripción cierra después del último encuentro.');
    if (fina && fechafin && fina < fechafin && fina < fechaDiaArg(hoy) && fechafin >= fechaDiaArg(hoy)) {
        alertas.push(`La inscripción ya cerró (${fechaLegible(fina)}) pero el curso sigue hasta el ${fechaLegible(fechafin)}.`);
    }
    if (fechafin && inicioDia && inicioDia > fechafin) alertas.push('La inscripción abre después de que terminó el curso.');
    return alertas;
}

// Después de guardar en ABC: relee la oferta y la compara con lo enviado.
// Nunca tira error: si no se puede releer, lo informa en `error`.
async function verificar(idOfertaOficial, esperado) {
    try {
        const actual = await leerOferta(idOfertaOficial);
        const difs = diferencias(esperado, actual);
        const alertas = alertasCoherencia(actual);
        return { ok: difs.length === 0 && alertas.length === 0, diferencias: difs, alertas, actual };
    } catch (e) {
        return { ok: null, error: e.message, diferencias: [], alertas: [] };
    }
}

// Lo que se espera ver en ABC a partir del payload enviado a actualiza.php.
function esperadoDesdePayload(payload, extra = {}) {
    const p = payload instanceof URLSearchParams ? Object.fromEntries(payload) : payload;
    const esperado = {};
    Object.keys(CAMPOS).forEach(c => { if (p[c] !== undefined) esperado[c] = p[c]; });
    if (esperado.inicioa) esperado.inicioa = String(esperado.inicioa).replace(' ', 'T').slice(0, 16);
    delete esperado.enlace;
    return { ...esperado, ...extra };
}

// Para el editor de datos: Mongo vs ABC, campo por campo, para un curso vinculado.
async function compararCursoLocal(cursoLocalId) {
    const curso = await cursoLocalRepo.getPorId(cursoLocalId);
    if (!curso) throw Object.assign(new Error('Curso no encontrado.'), { statusCode: 404 });
    if (!curso.idOfertaOficial) {
        throw Object.assign(new Error('El curso no está vinculado a una oferta de ABC.'), { statusCode: 400 });
    }
    const ciieId = curso.ciieId?._id || curso.ciieId;
    const encuentros = (await encuentroRepo.getPorCursoId(cursoLocalId) || [])
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const actual = await ejecutarComo(ciieId, () => leerOferta(curso.idOfertaOficial));

    const cursoLocalService = require('./cursoLocalService'); // evita el require circular
    const mongo = {
        anio:          curso.anio,
        inicioa:       fechaHoraArg(curso.fechaInicioInscripcion),
        fina:          fechaDiaArg(curso.fechaFinInscripcion),
        fechaini:      fechaDiaArg(encuentros[0]?.fecha),
        fechafin:      fechaDiaArg(encuentros[encuentros.length - 1]?.fecha),
        disponible:    curso.disponible,
        cupo:          curso.cupo,
        iddispositivo: cursoLocalService._mapDispositivoAId(curso.dispositivo),
        idalcance:     cursoLocalService._normalizeAlcance(curso.alcance),
        idformato:     curso.idformato,
        tituloform:    curso.tituloFormulario,
        nombrecapa:    curso.formadorAbc,
        enlace:        curso.enlaceInscripcion
    };
    const origen = {
        anio: 'anio', inicioa: 'fechaInicioInscripcion', fina: 'fechaFinInscripcion',
        fechaini: 'primer encuentro', fechafin: 'último encuentro', disponible: 'disponible',
        cupo: 'cupo', iddispositivo: 'dispositivo', idalcance: 'alcance', idformato: 'idformato',
        tituloform: 'tituloFormulario', nombrecapa: 'formadorAbc', enlace: 'enlaceInscripcion'
    };

    // Cursos publicados antes de este cambio guardaron el inicio de inscripción sin la
    // hora (00:00 UTC): para esos solo se compara el día.
    const fechaInicio = curso.fechaInicioInscripcion && new Date(curso.fechaInicioInscripcion);
    const inicioSinHora = Boolean(fechaInicio && !isNaN(fechaInicio)
        && fechaInicio.getUTCHours() === 0 && fechaInicio.getUTCMinutes() === 0 && fechaInicio.getUTCSeconds() === 0);
    if (inicioSinHora) mongo.inicioa = fechaDiaArg(curso.fechaInicioInscripcion);

    const coincide = (c) => {
        if (c === 'inicioa' && inicioSinHora) return mongo.inicioa === String(actual.inicioa || '').slice(0, 10);
        if (c === 'cupo') {
            // Al publicar se manda a ABC hasta un 15% más que el cupo guardado; menos que eso es un error.
            const m = Number(mongo.cupo), a = Number(actual.cupo);
            return Number.isFinite(m) && Number.isFinite(a) && a >= m && a <= Math.round(m * 1.15) + 1;
        }
        return _normalizar(c, mongo[c]) === _normalizar(c, actual[c]);
    };

    const filas = Object.keys(CAMPOS).map(c => ({
        campo: c,
        etiqueta: CAMPOS[c],
        origenMongo: origen[c],
        mongo: legible(c, mongo[c]) + (c === 'inicioa' && inicioSinHora ? ' (guardado sin hora)' : ''),
        abc: legible(c, actual[c]),
        estado: coincide(c) ? 'igual' : 'distinto'
    }));

    return { idOfertaOficial: curso.idOfertaOficial, filas, alertas: alertasCoherencia(actual) };
}

module.exports = {
    TZ_ARG,
    fechaHoraArg,
    fechaDiaArg,
    desdeFechaHoraArg,
    desdeFechaDiaArg,
    parsearFormulario,
    leerOferta,
    diferencias,
    alertasCoherencia,
    verificar,
    esperadoDesdePayload,
    compararCursoLocal
};
