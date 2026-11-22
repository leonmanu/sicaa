const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Publicacion = require('../models/Publicacion');
const publicacionRepo = require('../repos/publicacionRepo');
const plantillaDispositivoRepo = require('../repos/plantillaDispositivoRepo');
const configuracionPublicacionesRepo = require('../repos/configuracionPublicacionesRepo');
const ciieRepo = require('../repos/ciieRepo');
const cursoLocalService = require('./cursoLocalService');
const metaGraphService = require('./metaGraphService');
const redesSocialesService = require('./redesSocialesService');

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'flyers');

// Instagram acepta hasta 10 imágenes por post: la carátula + 9 flyers.
const MAX_FLYERS_POR_PARTE_IG = 9;
// Si quedó "publicando" (p. ej. se cayó el servidor a mitad), se puede reintentar pasado este tiempo.
const MINUTOS_BLOQUEO_PUBLICANDO = 10;

const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const CATEGORIAS = [
    { clave: 'taller', regex: /taller/i, plural: 'TALLERES', singular: 'Taller' },
    { clave: 'seminario', regex: /seminario/i, plural: 'SEMINARIOS', singular: 'Seminario' },
    { clave: 'extension', regex: /extensi/i, plural: 'EXPERIENCIAS DE EXTENSIÓN', singular: 'Experiencia' }
];
const CATEGORIA_OTRA = { clave: 'otra', plural: 'PROPUESTAS', singular: 'Propuesta' };

function error(mensaje, statusCode) {
    const err = new Error(mensaje);
    err.statusCode = statusCode;
    return err;
}

// Las fechas se guardan en UTC; Argentina es UTC-3 todo el año (sin horario de verano).
function fechaArgentina(fecha) {
    const d = new Date(fecha);
    return new Date(d.getTime() - 3 * 60 * 60 * 1000);
}

class PublicacionService {

    // ─── Datos derivados de las propuestas ───────────────────────────────

    categoria(dispositivo) {
        return CATEGORIAS.find(c => c.regex.test(dispositivo || '')) || CATEGORIA_OTRA;
    }

    _fechaInicio(curso) {
        const fechas = (curso.encuentros || []).map(e => new Date(e.fecha)).filter(d => !isNaN(d));
        if (fechas.length === 0) return null;
        return new Date(Math.min(...fechas));
    }

    _ordenarPorFecha(cursos) {
        return cursos.slice().sort((a, b) => {
            const fa = this._fechaInicio(a);
            const fb = this._fechaInicio(b);
            if (!fa && !fb) return 0;
            if (!fa) return 1;
            if (!fb) return -1;
            return fa - fb;
        });
    }

    _fechaLarga(fecha) {
        if (!fecha) return '';
        const d = fechaArgentina(fecha);
        return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
    }

    _fechaCorta(fecha) {
        if (!fecha) return 'fecha a confirmar';
        const d = fechaArgentina(fecha);
        return `${DIAS_CORTOS[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
    }

    // "MARZO", "JUNIO / JULIO", "MARZO / ABRIL / MAYO", "MARZO A JULIO"
    mesesDe(cursos) {
        const vistos = new Map();
        for (const curso of cursos) {
            const inicio = this._fechaInicio(curso);
            if (!inicio) continue;
            const d = fechaArgentina(inicio);
            const clave = d.getUTCFullYear() * 12 + d.getUTCMonth();
            vistos.set(clave, MESES[d.getUTCMonth()].toUpperCase());
        }
        const meses = [...vistos.entries()].sort((a, b) => a[0] - b[0]).map(([, nombre]) => nombre);
        if (meses.length === 0) return '';
        if (meses.length <= 3) return meses.join(' / ');
        return `${meses[0]} A ${meses[meses.length - 1]}`;
    }

    tituloDe(cursos) {
        const claves = new Set(cursos.map(c => this.categoria(c.dispositivo).clave));
        if (claves.size !== 1) return CATEGORIA_OTRA.plural;
        return this.categoria(cursos[0].dispositivo).plural;
    }

    // Reparto para Instagram (máx. 9 flyers por post):
    //  - hasta 9: una sola parte;
    //  - si no: primero por tipo (talleres / seminarios / experiencias), y cada
    //    tipo en partes parejas por fecha (20 → 7 + 7 + 6, no 9 + 9 + 2).
    repartirParaInstagram(cursosOrdenados) {
        if (cursosOrdenados.length <= MAX_FLYERS_POR_PARTE_IG) return [cursosOrdenados];

        const grupos = new Map();
        for (const curso of cursosOrdenados) {
            const clave = this.categoria(curso.dispositivo).clave;
            if (!grupos.has(clave)) grupos.set(clave, []);
            grupos.get(clave).push(curso);
        }

        const partes = [];
        for (const grupo of grupos.values()) {
            const cantidadPartes = Math.ceil(grupo.length / MAX_FLYERS_POR_PARTE_IG);
            const base = Math.floor(grupo.length / cantidadPartes);
            let resto = grupo.length % cantidadPartes;
            let inicio = 0;
            for (let i = 0; i < cantidadPartes; i += 1) {
                const tamanio = base + (resto > 0 ? 1 : 0);
                if (resto > 0) resto -= 1;
                partes.push(grupo.slice(inicio, inicio + tamanio));
                inicio += tamanio;
            }
        }
        return partes;
    }

    // ─── Textos ──────────────────────────────────────────────────────────

    _bulletsATexto(bullets, emoji) {
        return (bullets || []).map(b => `${emoji} ${b}`).join('\n');
    }

    // "¿Qué son?" solo si todas las propuestas son del mismo tipo (p. ej. talleres
    // en servicio y fuera de servicio cuentan como talleres).
    async _armarBloqueQueSonYRequisitos(cursos, configuracion) {
        const categorias = new Set(cursos.map(c => this.categoria(c.dispositivo).clave));
        const mismoTipo = categorias.size === 1 && !categorias.has(CATEGORIA_OTRA.clave);
        const dispositivos = [...new Set(cursos.map(c => c.dispositivo).filter(Boolean))];
        const dispositivo = dispositivos.length === 1 ? dispositivos[0] : (mismoTipo ? cursos[0].dispositivo : null);
        const plantilla = dispositivo ? await plantillaDispositivoRepo.getPorDispositivo(dispositivo) : null;

        const queSonBullets = plantilla?.queSonBullets?.length ? plantilla.queSonBullets : [];
        const requisitosBullets = plantilla?.requisitosBullets?.length
            ? plantilla.requisitosBullets
            : configuracion.requisitosDefaultBullets;

        const lineas = [];
        if (queSonBullets.length) {
            lineas.push('✳️ ¿Qué son?');
            lineas.push(this._bulletsATexto(queSonBullets, '🔹'));
        }
        if (requisitosBullets.length) {
            lineas.push('📚 Requisitos para inscribirse:');
            lineas.push(this._bulletsATexto(requisitosBullets, '✅'));
        }

        const hashtags = [plantilla?.hashtag, ...(configuracion.hashtagsFijos || [])].filter(Boolean).join(' ');
        return { bloque: lineas.join('\n'), hashtags };
    }

    _enlacePaginaPublica(ciie) {
        const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
        return ciie?.clave && base ? `${base}/curso/publico/${ciie.clave}` : null;
    }

    async _armarCaption({ cursos, red, tipo, ciie, configuracion }) {
        const { bloque, hashtags } = await this._armarBloqueQueSonYRequisitos(cursos, configuracion);
        const secciones = [];

        if (tipo === 'individual') {
            const curso = cursos[0];
            const titulo = curso.tituloFormulario || curso.nombrePropuesta || 'Nueva propuesta';
            const formador = (curso.formadorAbc || '').split(';').map(n => n.trim()).filter(Boolean).join(', ');
            const fecha = this._fechaLarga(this._fechaInicio(curso));

            const encabezado = [`📢 ${titulo.toUpperCase()}`];
            if (fecha) encabezado.push(`🗓️ ${fecha}`);
            if (formador) encabezado.push(`👤 Formador/a: ${formador}`);
            if (ciie?.distrito) encabezado.push(`📍 ${ciie.distrito}, Bs. As.`);
            secciones.push(encabezado.join('\n'));
        } else {
            const titulo = this.tituloDe(cursos);
            const meses = this.mesesDe(cursos);
            const lugar = ciie?.localidad || ciie?.nombre || '';
            const encabezado = [`📢 ¡Inscripción abierta! ${titulo} en el CIIE de ${lugar}`];
            encabezado.push('Formación gratuita, de calidad y con puntaje docente.');
            if (meses) encabezado.push(`🗓️ ${meses.charAt(0) + meses.slice(1).toLowerCase()}`);
            secciones.push(encabezado.join('\n'));

            const mezcla = titulo === CATEGORIA_OTRA.plural;
            secciones.push(cursos.map(curso => {
                const nombre = (curso.tituloFormulario || curso.nombrePropuesta || '').toUpperCase();
                const tipoCorto = mezcla ? ` (${this.categoria(curso.dispositivo).singular})` : '';
                return `🔸 ${nombre}${tipoCorto} — ${this._fechaCorta(this._fechaInicio(curso))}`;
            }).join('\n'));
        }

        if (bloque) secciones.push(bloque);

        if (red === 'instagram') {
            secciones.push('🔗 Inscribite desde el enlace en la bio');
        } else {
            const enlace = tipo === 'individual'
                ? (cursos[0].publicacionDrupal?.enlaceInscripcion || cursos[0].enlaceInscripcion)
                : this._enlacePaginaPublica(ciie);
            if (enlace) secciones.push(`🔗 Inscribite acá:\n${enlace}`);
        }

        const cierre = red === 'facebook' ? configuracion.cierreFacebook : configuracion.cierreInstagram;
        const cierreYHashtags = [cierre, hashtags].filter(Boolean).join('\n');
        if (cierreYHashtags) secciones.push(cierreYHashtags);

        return secciones.filter(Boolean).join('\n\n');
    }

    // Actualiza con los datos de HOY lo que el usuario no tocó a mano y todavía
    // no salió: textos no editados y carátulas (meses siempre; título si no se editó).
    async _refrescar(publicacion, cursosPorId, ciie) {
        const configuracion = await configuracionPublicacionesRepo.getPorCiie(ciie._id);
        const cursosDe = ids => ids.map(id => cursosPorId.get(String(id))).filter(Boolean);
        const editable = envio => envio.estado !== 'publicado' && envio.estado !== 'publicando';
        let cambio = false;

        const todos = cursosDe(publicacion.cursoLocalIds);
        const refrescarCaratula = (caratula, cursos) => {
            if (publicacion.tipo !== 'carrusel') return;
            const meses = this.mesesDe(cursos);
            if (caratula.meses !== meses) { caratula.meses = meses; cambio = true; }
            if (!caratula.tituloEditado) {
                const titulo = this.tituloDe(cursos);
                if (caratula.titulo !== titulo) { caratula.titulo = titulo; cambio = true; }
            }
        };

        if (editable(publicacion.facebook)) refrescarCaratula(publicacion.caratula, todos);
        if (editable(publicacion.facebook) && !publicacion.facebook.captionEditado) {
            const caption = await this._armarCaption({ cursos: todos, red: 'facebook', tipo: publicacion.tipo, ciie, configuracion });
            if (caption !== publicacion.facebook.caption) { publicacion.facebook.caption = caption; cambio = true; }
        }

        for (const parte of publicacion.instagram.partes) {
            if (!editable(parte)) continue;
            const cursos = cursosDe(parte.cursoLocalIds);
            refrescarCaratula(parte.caratula, cursos);
            if (!parte.captionEditado) {
                const caption = await this._armarCaption({ cursos, red: 'instagram', tipo: publicacion.tipo, ciie, configuracion });
                if (caption !== parte.caption) { parte.caption = caption; cambio = true; }
            }
        }

        if (cambio) await publicacion.save();
        return publicacion;
    }

    // ─── Alta ────────────────────────────────────────────────────────────

    async _cargarCursos(cursoLocalIds, ciieId) {
        const cursos = await cursoLocalService.getVariosPorIds(cursoLocalIds, ciieId);
        if (cursos.length !== cursoLocalIds.length) {
            throw error('Alguna de las propuestas elegidas no existe o no es de tu CIIE.', 404);
        }
        const sinVincular = cursos.filter(c => !c.idOfertaOficial);
        if (sinVincular.length) {
            const nombres = sinVincular.map(c => c.tituloFormulario || c.nombrePropuesta).join(', ');
            throw error(`Solo se pueden publicar propuestas ya vinculadas con el sitio oficial. Sin vincular: ${nombres}.`, 400);
        }
        // Solo taller, seminario y extensión tienen diseño de flyer (ver getFlyerCurso).
        const sinFlyer = cursos.filter(c => this.categoria(c.dispositivo).clave === CATEGORIA_OTRA.clave);
        if (sinFlyer.length) {
            const detalle = sinFlyer.map(c => `${c.tituloFormulario || c.nombrePropuesta} (${c.dispositivo || 'sin dispositivo'})`).join(', ');
            throw error(`Estas propuestas todavía no tienen diseño de flyer, sacalas de la selección: ${detalle}.`, 400);
        }
        return cursos;
    }

    async crear(cursoLocalIds, usuario) {
        const ids = [...new Set((cursoLocalIds || []).map(String))];
        if (ids.length === 0) throw error('No se eligió ninguna propuesta.', 400);
        const ciieId = usuario?.referenciaId;
        const tipo = ids.length === 1 ? 'individual' : 'carrusel';

        // Una individual que nunca llegó a salir se reutiliza (evita borradores
        // repetidos cada vez que se aprieta "Publicar" sobre la misma propuesta).
        if (tipo === 'individual') {
            const borrador = await publicacionRepo.getBorradorIndividual(ids[0], ciieId);
            if (borrador) return borrador;
        }

        const cursos = this._ordenarPorFecha(await this._cargarCursos(ids, ciieId));
        const partes = tipo === 'individual' ? [cursos] : this.repartirParaInstagram(cursos);

        const publicacion = new Publicacion({
            ciieId,
            tipo,
            cursoLocalIds: cursos.map(c => c._id),
            facebook: {},
            instagram: { partes: partes.map(parte => ({ cursoLocalIds: parte.map(c => c._id) })) },
            creadoPor: usuario?.email
        });

        const ciie = await ciieRepo.getPorId(ciieId);
        await this._refrescar(publicacion, new Map(cursos.map(c => [String(c._id), c])), ciie);
        return await publicacion.save();
    }

    async duplicar(id, usuario) {
        const original = await this._getPropia(id, usuario?.referenciaId);
        // Siempre una nueva (aunque sea individual): es un refuerzo.
        const ids = original.cursoLocalIds.map(String);
        if (ids.length === 1) {
            const cursos = await this._cargarCursos(ids, usuario.referenciaId);
            const publicacion = new Publicacion({
                ciieId: usuario.referenciaId,
                tipo: 'individual',
                cursoLocalIds: ids,
                facebook: {},
                instagram: { partes: [{ cursoLocalIds: ids }] },
                creadoPor: usuario?.email
            });
            const ciie = await ciieRepo.getPorId(usuario.referenciaId);
            await this._refrescar(publicacion, new Map(cursos.map(c => [String(c._id), c])), ciie);
            return await publicacion.save();
        }
        return await this.crear(ids, usuario);
    }

    // ─── Lectura ─────────────────────────────────────────────────────────

    async _getPropia(id, ciieId) {
        const publicacion = await publicacionRepo.getPorId(id);
        // Se responde "no encontrada" también si es de otro CIIE, para no
        // confirmarle a otra institución que el id existe.
        if (!publicacion || String(publicacion.ciieId) !== String(ciieId)) {
            throw error('Publicación no encontrada.', 404);
        }
        return publicacion;
    }

    // Todo lo que necesita la pantalla de la publicación, con los textos al día.
    async getParaPantalla(id, ciieId) {
        const publicacion = await this._getPropia(id, ciieId);
        const [cursos, ciie] = await Promise.all([
            cursoLocalService.getVariosPorIds(publicacion.cursoLocalIds.map(String), ciieId),
            ciieRepo.getPorId(ciieId)
        ]);
        const cursosPorId = new Map(cursos.map(c => [String(c._id), c]));
        await this._refrescar(publicacion, cursosPorId, ciie);

        const todos = publicacion.cursoLocalIds.map(cid => cursosPorId.get(String(cid))).filter(Boolean);
        const presenciales = todos.every(c => /presencial/i.test(c.publicacionDrupal?.formatoDictado || 'Presencial'));

        return {
            publicacion,
            cursosPorId,
            ciie,
            caratulaFija: {
                ciieCorto: (ciie?.nombre || '').replace(/^ciie\s*/i, '').toUpperCase(),
                lugar: [ciie?.localidad, ciie?.distrito].filter(Boolean).join(', ').toUpperCase(),
                modalidad: presenciales ? 'FORMACIÓN PRESENCIAL' : 'FORMACIÓN DOCENTE'
            }
        };
    }

    async getTodas(ciieId) {
        return await publicacionRepo.getTodas(ciieId);
    }

    // cursoLocalId -> { veces, ultima } contando solo lo que efectivamente salió
    // (en Facebook o en alguna parte de Instagram). Para el aviso en /curso/flyers.
    async getHistorialPorCursoLocalIds(cursoLocalIds) {
        const publicaciones = await publicacionRepo.getConCursos(cursoLocalIds);
        const historial = {};
        const sumar = (cursoId, publicacionId, fecha) => {
            const clave = String(cursoId);
            if (!historial[clave]) historial[clave] = { publicaciones: new Set(), ultima: null };
            historial[clave].publicaciones.add(String(publicacionId));
            if (fecha && (!historial[clave].ultima || fecha > historial[clave].ultima)) historial[clave].ultima = fecha;
        };

        for (const pub of publicaciones) {
            if (pub.facebook?.estado === 'publicado') {
                pub.cursoLocalIds.forEach(cid => sumar(cid, pub._id, pub.facebook.publicadoEn));
            }
            for (const parte of pub.instagram?.partes || []) {
                if (parte.estado === 'publicado') {
                    parte.cursoLocalIds.forEach(cid => sumar(cid, pub._id, parte.publicadoEn));
                }
            }
        }

        const resultado = {};
        for (const [clave, datos] of Object.entries(historial)) {
            resultado[clave] = { veces: datos.publicaciones.size, ultima: datos.ultima };
        }
        return resultado;
    }

    // ─── Edición de textos ───────────────────────────────────────────────

    // datos: { facebook: { caption?, regenerar? }, caratula: { titulo? },
    //          partes: [{ caption?, regenerar?, tituloCaratula? }] }
    async actualizar(id, datos, ciieId) {
        const publicacion = await this._getPropia(id, ciieId);
        const avisos = {};

        const fb = datos.facebook || {};
        if (fb.regenerar) {
            publicacion.facebook.captionEditado = false;
        } else if (typeof fb.caption === 'string' && fb.caption !== publicacion.facebook.caption) {
            if (publicacion.facebook.estado === 'publicado') {
                // En Facebook el cambio se manda al post real.
                try {
                    const conexion = await redesSocialesService.getConexion(ciieId);
                    await metaGraphService.editarCaptionFacebook(conexion, publicacion.facebook.postId, fb.caption, publicacion.facebook.cantidadImagenes === 1);
                    publicacion.facebook.caption = fb.caption;
                    avisos.facebookEditado = true;
                } catch (err) {
                    avisos.facebookError = err.message;
                }
            } else {
                publicacion.facebook.caption = fb.caption;
                publicacion.facebook.captionEditado = true;
            }
        }

        if (datos.caratula && typeof datos.caratula.titulo === 'string') {
            const titulo = datos.caratula.titulo.trim();
            if (titulo && titulo !== publicacion.caratula.titulo) {
                publicacion.caratula.titulo = titulo;
                publicacion.caratula.tituloEditado = true;
            }
        }

        (datos.partes || []).forEach((cambios, i) => {
            const parte = publicacion.instagram.partes[i];
            if (!parte || !cambios) return;
            if (cambios.regenerar) {
                parte.captionEditado = false;
            } else if (typeof cambios.caption === 'string' && cambios.caption !== parte.caption) {
                parte.caption = cambios.caption;
                // La API de Instagram no permite editar un post ya publicado.
                if (parte.estado === 'publicado') avisos.instagramSoloLocal = true;
                else parte.captionEditado = true;
            }
            if (typeof cambios.tituloCaratula === 'string') {
                const titulo = cambios.tituloCaratula.trim();
                if (titulo && titulo !== parte.caratula.titulo) {
                    parte.caratula.titulo = titulo;
                    parte.caratula.tituloEditado = true;
                }
            }
        });

        await publicacion.save();
        return { avisos };
    }

    // ─── Imágenes y publicación ──────────────────────────────────────────

    // destino: 'facebook' o 'ig-<n>' (n = índice de la parte de Instagram)
    _resolverDestino(publicacion, destino) {
        if (destino === 'facebook') return { envio: publicacion.facebook, red: 'facebook' };
        const match = /^ig-(\d+)$/.exec(destino || '');
        const parte = match ? publicacion.instagram.partes[Number(match[1])] : null;
        if (!parte) throw error('Destino de publicación inválido.', 400);
        return { envio: parte, red: 'instagram', parte };
    }

    _nombreArchivo(publicacionId, destino, orden) {
        return `${publicacionId}-${destino}-${orden}.jpg`;
    }

    async subirImagen(id, { destino, orden, imagenBase64 }, ciieId) {
        const publicacion = await this._getPropia(id, ciieId);
        this._resolverDestino(publicacion, destino);
        const numero = Number(orden);
        if (!Number.isInteger(numero) || numero < 0 || numero > 200) throw error('Orden de imagen inválido.', 400);
        if (typeof imagenBase64 !== 'string' || !/^data:image\/(jpeg|png);base64,/.test(imagenBase64)) {
            throw error('Imagen inválida.', 400);
        }

        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        const buffer = Buffer.from(imagenBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        fs.writeFileSync(path.join(UPLOADS_DIR, this._nombreArchivo(publicacion._id, destino, numero)), buffer);
    }

    // Meta no recibe el archivo: lo descarga de PUBLIC_BASE_URL. Si la app corre
    // en otra máquina que la de esa URL (p. ej. local con PUBLIC_BASE_URL de
    // Render), la imagen queda en este disco y Meta recibe un 404 en HTML, que
    // reporta como "Missing or invalid image file". Se detecta antes de llamar a Meta.
    async _verificarImagenAccesible(url) {
        let respuesta;
        try {
            respuesta = await axios.head(url, { timeout: 15000, validateStatus: () => true });
        } catch (err) {
            respuesta = null;
        }
        const tipo = respuesta?.headers?.['content-type'] || '';
        if (!respuesta || respuesta.status !== 200 || !tipo.startsWith('image/')) {
            throw error(
                `Meta no va a poder descargar la imagen desde ${url} (${respuesta ? 'HTTP ' + respuesta.status : 'sin respuesta'}). ` +
                'La imagen se guardó en esta máquina, pero PUBLIC_BASE_URL apunta a otra. ' +
                'Publicá desde la app desplegada (o hacé que PUBLIC_BASE_URL apunte a esta).',
                409
            );
        }
    }

    // Marca el envío como "publicando" de forma atómica: si dos pedidos llegan a
    // la vez (doble clic, reintento), solo uno publica.
    async _tomarEnvio(publicacion, destino) {
        const limite = new Date(Date.now() - MINUTOS_BLOQUEO_PUBLICANDO * 60 * 1000);
        const libre = { $or: [{ estado: { $in: ['pendiente', 'error'] } }, { estado: 'publicando', intentoEn: { $lt: limite } }] };
        const ahora = new Date();

        if (destino === 'facebook') {
            const filtro = { _id: publicacion._id, $or: libre.$or.map(c => Object.fromEntries(Object.entries(c).map(([k, v]) => [`facebook.${k}`, v]))) };
            return await Publicacion.findOneAndUpdate(filtro, { $set: { 'facebook.estado': 'publicando', 'facebook.intentoEn': ahora } }, { new: true });
        }

        const parte = this._resolverDestino(publicacion, destino).parte;
        return await Publicacion.findOneAndUpdate(
            { _id: publicacion._id, 'instagram.partes': { $elemMatch: { _id: parte._id, ...libre } } },
            { $set: { 'instagram.partes.$.estado': 'publicando', 'instagram.partes.$.intentoEn': ahora } },
            { new: true }
        );
    }

    async publicar(id, { destino, cantidad }, ciieId) {
        const publicacion = await this._getPropia(id, ciieId);
        const { envio, red } = this._resolverDestino(publicacion, destino);
        const conexion = await redesSocialesService.getConexion(ciieId);

        if (envio.estado === 'publicado') throw error('Esto ya está publicado. Para reforzar, creá una nueva publicación.', 409);
        if (!process.env.PUBLIC_BASE_URL) {
            throw error('Falta configurar PUBLIC_BASE_URL: Instagram/Facebook necesitan una URL pública para descargar las imágenes.', 409);
        }

        const total = Number(cantidad);
        const maximo = red === 'instagram' ? 10 : 200;
        if (!Number.isInteger(total) || total < 1 || total > maximo) throw error('Cantidad de imágenes inválida.', 400);

        const base = process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
        const imageUrls = [];
        for (let orden = 0; orden < total; orden += 1) {
            const nombre = this._nombreArchivo(publicacion._id, destino, orden);
            if (!fs.existsSync(path.join(UPLOADS_DIR, nombre))) throw error('Faltan imágenes por subir. Probá publicar de nuevo.', 409);
            imageUrls.push(`${base}/uploads/flyers/${nombre}`);
        }
        await this._verificarImagenAccesible(imageUrls[0]);

        const tomada = await this._tomarEnvio(publicacion, destino);
        if (!tomada) throw error('Esta publicación ya se está enviando. Esperá unos segundos y recargá la página.', 409);

        const { envio: envioTomado } = this._resolverDestino(tomada, destino);
        try {
            const { postId } = red === 'facebook'
                ? await metaGraphService.publicarEnFacebook(conexion, imageUrls, envioTomado.caption)
                : await metaGraphService.publicarEnInstagram(conexion, imageUrls, envioTomado.caption);
            Object.assign(envioTomado, { estado: 'publicado', postId, publicadoEn: new Date(), error: null, cantidadImagenes: total });
            await tomada.save();
            return { ok: true };
        } catch (err) {
            Object.assign(envioTomado, { estado: 'error', error: err.message, cantidadImagenes: total });
            await tomada.save();
            return { ok: false, error: err.message };
        }
    }

    // ─── Baja ────────────────────────────────────────────────────────────

    async eliminar(id, ciieId) {
        const publicacion = await this._getPropia(id, ciieId);

        if (publicacion.facebook.postId) {
            try {
                const conexion = await redesSocialesService.getConexion(ciieId);
                await metaGraphService.eliminarDeFacebook(conexion, publicacion.facebook.postId);
            } catch (err) {
                console.error('No se pudo borrar el post de Facebook:', err.message);
            }
        }

        const avisoInstagram = publicacion.instagram.partes.some(p => p.estado === 'publicado');

        if (fs.existsSync(UPLOADS_DIR)) {
            const prefijo = `${publicacion._id}-`;
            for (const archivo of fs.readdirSync(UPLOADS_DIR)) {
                if (archivo.startsWith(prefijo)) fs.unlinkSync(path.join(UPLOADS_DIR, archivo));
            }
        }

        await publicacionRepo.eliminar(id);
        return { avisoInstagram };
    }
}

module.exports = new PublicacionService();
