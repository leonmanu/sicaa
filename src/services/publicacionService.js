const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const publicacionRepo = require('../repos/publicacionRepo');
const plantillaDispositivoRepo = require('../repos/plantillaDispositivoRepo');
const configuracionPublicacionesRepo = require('../repos/configuracionPublicacionesRepo');
const encuentroRepo = require('../repos/encuentroRepo');
const cursoLocalService = require('./cursoLocalService');
const metaGraphService = require('./metaGraphService');

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'flyers');
const MAX_IMAGENES_POR_PARTE = 10;

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

class PublicacionService {

    _formatearFecha(fecha) {
        if (!fecha) return '';
        const dateStr = typeof fecha === 'string' ? fecha.split('T')[0] : fecha.toISOString().split('T')[0];
        const [yyyy, mm, dd] = dateStr.split('-').map(Number);
        const d = new Date(yyyy, mm - 1, dd);
        return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
    }

    _bulletsATexto(bullets, emoji) {
        return (bullets || []).map(b => `${emoji} ${b}`).join('\n');
    }

    async _armarBloqueQueSonYRequisitos(dispositivoTipo) {
        const [plantilla, configuracion] = await Promise.all([
            dispositivoTipo ? plantillaDispositivoRepo.getPorDispositivo(dispositivoTipo) : null,
            configuracionPublicacionesRepo.getSingleton()
        ]);

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

        return { bloque: lineas.join('\n'), hashtags, plantilla, configuracion };
    }

    _armarEnlaceSeccion({ red, tipoAgrupacion, curso, ciieClave }) {
        const enlaceOficial = curso?.publicacionDrupal?.enlaceInscripcion || curso?.enlaceInscripcion;
        const enlacePropio = ciieClave ? `${(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')}/curso/publico/${ciieClave}` : null;
        const enlace = tipoAgrupacion === 'individual' ? enlaceOficial : enlacePropio;

        if (red === 'instagram') {
            return '🔗 Inscribite desde el enlace en la bio';
        }
        return enlace ? `🔗 Inscribite acá:\n${enlace}` : '';
    }

    async _armarCaption({ cursos, red, tipoAgrupacion, dispositivoTipo, parteActual, totalPartes }) {
        const primerCurso = cursos[0];
        const ciie = primerCurso?.cargoId?.ciieId;
        const { bloque, hashtags, plantilla, configuracion } = await this._armarBloqueQueSonYRequisitos(dispositivoTipo);

        const secciones = [];

        if (tipoAgrupacion === 'individual') {
            const titulo = primerCurso.tituloFormulario || primerCurso.nombrePropuesta || 'Nuevo curso';
            const formador = (primerCurso.formadorAbc || '').split(';').map(n => n.trim()).filter(Boolean).join(', ');
            const fecha = this._formatearFecha(primerCurso.encuentros?.[0]?.fecha);
            const distrito = ciie?.distrito;

            const encabezado = [`📢 ${titulo.toUpperCase()}`];
            if (fecha) encabezado.push(`🗓️ ${fecha}`);
            if (formador) encabezado.push(`👤 Formador/a: ${formador}`);
            if (distrito) encabezado.push(`📍 ${distrito}, Bs. As.`);
            secciones.push(encabezado.join('\n'));
        } else {
            const nombrePlural = plantilla?.nombrePlural || (dispositivoTipo || 'CURSOS').toUpperCase();
            const parteTexto = totalPartes > 1 ? ` (PARTE ${parteActual})` : '';
            const localidad = ciie?.localidad || ciie?.nombre || '';
            secciones.push(`📢 ¡Nuevos ${nombrePlural}${parteTexto} gratuitos para docentes en el CIIE de ${localidad}!`);

            if (tipoAgrupacion === 'itinerario' && primerCurso?.itinerario) {
                secciones.push(`🗓️ ${primerCurso.itinerario}° Itinerario ${primerCurso.anio || ''}`.trim());
            }
        }

        if (bloque) secciones.push(bloque);

        const enlace = this._armarEnlaceSeccion({ red, tipoAgrupacion, curso: primerCurso, ciieClave: ciie?.clave });
        if (enlace) secciones.push(enlace);

        const cierre = red === 'facebook' ? configuracion.cierreFacebook : configuracion.cierreInstagram;
        const cierreYHashtags = [cierre, hashtags].filter(Boolean).join('\n');
        if (cierreYHashtags) secciones.push(cierreYHashtags);

        return secciones.filter(Boolean).join('\n\n');
    }

    async _armarPublicacionParaGuardar({ cursos, tipoAgrupacion, dispositivoTipo, incluirCaratula, grupoId, parteActual, totalPartes, usuario }) {
        const [captionFacebook, captionInstagram] = await Promise.all([
            this._armarCaption({ cursos, red: 'facebook', tipoAgrupacion, dispositivoTipo, parteActual, totalPartes }),
            this._armarCaption({ cursos, red: 'instagram', tipoAgrupacion, dispositivoTipo, parteActual, totalPartes })
        ]);

        return {
            cursoLocalIds: cursos.map(c => c._id),
            tipoAgrupacion,
            dispositivoTipo,
            incluirCaratula,
            grupoId,
            parteActual,
            totalPartes,
            imagenes: [],
            facebook: { seleccionado: true, estado: 'pendiente', caption: captionFacebook },
            instagram: { seleccionado: true, estado: 'pendiente', caption: captionInstagram },
            creadoPor: usuario?.email
        };
    }

    async crearIndividual(cursoLocalId, usuario) {
        const existente = await publicacionRepo.getIndividualPorCursoLocalId(cursoLocalId);
        if (existente) return existente;

        const curso = await cursoLocalService.getPorId(cursoLocalId);
        if (!curso) {
            const err = new Error('Curso no encontrado.');
            err.statusCode = 404;
            throw err;
        }

        const datos = await this._armarPublicacionParaGuardar({
            cursos: [curso],
            tipoAgrupacion: 'individual',
            dispositivoTipo: curso.dispositivo || null,
            incluirCaratula: false,
            grupoId: new mongoose.Types.ObjectId(),
            parteActual: 1,
            totalPartes: 1,
            usuario
        });

        return await publicacionRepo.crear(datos);
    }

    async crearAgrupada({ cursoLocalIds, dispositivoTipo, incluirCaratula, ciieId, tipoAgrupacion }, usuario) {
        if (!cursoLocalIds || cursoLocalIds.length === 0) {
            const err = new Error('No se seleccionó ningún curso.');
            err.statusCode = 400;
            throw err;
        }

        const cursos = await cursoLocalService.getVariosPorIds(cursoLocalIds, ciieId);
        if (cursos.length === 0) {
            const err = new Error('No se encontraron los cursos seleccionados.');
            err.statusCode = 404;
            throw err;
        }

        const maxCursosPorParte = incluirCaratula ? MAX_IMAGENES_POR_PARTE - 1 : MAX_IMAGENES_POR_PARTE;
        const partes = [];
        for (let i = 0; i < cursos.length; i += maxCursosPorParte) {
            partes.push(cursos.slice(i, i + maxCursosPorParte));
        }

        const grupoId = new mongoose.Types.ObjectId();
        const totalPartes = partes.length;

        const publicaciones = [];
        for (let i = 0; i < partes.length; i += 1) {
            const datos = await this._armarPublicacionParaGuardar({
                cursos: partes[i],
                tipoAgrupacion: tipoAgrupacion || 'itinerario',
                dispositivoTipo,
                incluirCaratula,
                grupoId,
                parteActual: i + 1,
                totalPartes,
                usuario
            });
            publicaciones.push(await publicacionRepo.crear(datos));
        }

        return publicaciones;
    }

    async getTodas() {
        return await publicacionRepo.getTodas();
    }

    // Mapa cursoLocalId (string) -> { facebook: estado, instagram: estado }, para
    // pintar el estado de publicación en listados de cursos (ej. /curso/flyers).
    async getEstadosPorCursoLocalIds(cursoLocalIds) {
        const publicaciones = await publicacionRepo.getIndividualesPorCursoLocalIds(cursoLocalIds);
        const mapa = {};
        for (const pub of publicaciones) {
            for (const cursoLocalId of pub.cursoLocalIds) {
                mapa[String(cursoLocalId)] = {
                    facebook: pub.facebook?.estado || 'pendiente',
                    instagram: pub.instagram?.estado || 'pendiente'
                };
            }
        }
        return mapa;
    }

    async getPorId(id) {
        const publicacion = await publicacionRepo.getPorId(id);
        if (!publicacion) {
            const err = new Error('Publicación no encontrada.');
            err.statusCode = 404;
            throw err;
        }

        // El populate de cursoLocalIds no trae los encuentros (viven en otra
        // colección): sin esto, el flyer del preview no puede mostrar fecha/hora.
        const cursos = publicacion.cursoLocalIds || [];
        if (cursos.length > 0) {
            const encuentros = await encuentroRepo.getPorCursoIds(cursos.map(c => c._id));
            cursos.forEach(curso => {
                curso.encuentros = encuentros
                    .filter(e => String(e.cursoId) === String(curso._id))
                    .sort((a, b) => a.numero - b.numero);
            });
        }

        return publicacion;
    }

    async guardarImagenes(id, imagenesBase64) {
        if (!imagenesBase64 || imagenesBase64.length === 0) {
            const err = new Error('Faltan las imágenes a guardar.');
            err.statusCode = 400;
            throw err;
        }
        const publicacion = await this.getPorId(id);

        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        const baseUrl = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');

        const imagenes = imagenesBase64.map((imagenBase64, orden) => {
            const base64Limpio = imagenBase64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Limpio, 'base64');
            const nombreArchivo = `${publicacion._id}-${orden}.png`;
            const rutaArchivo = path.join(UPLOADS_DIR, nombreArchivo);
            fs.writeFileSync(rutaArchivo, buffer);

            return {
                orden,
                url: `${baseUrl}/uploads/flyers/${nombreArchivo}`,
                path: rutaArchivo,
                esCaratula: publicacion.incluirCaratula && orden === 0
            };
        });

        return await publicacionRepo.actualizar(id, { imagenes });
    }

    async publicar(id) {
        const publicacion = await this.getPorId(id);
        if (!publicacion.imagenes || publicacion.imagenes.length === 0) {
            const err = new Error('Todavía no se generaron las imágenes de esta publicación.');
            err.statusCode = 409;
            throw err;
        }
        if (!process.env.PUBLIC_BASE_URL) {
            const err = new Error('Falta configurar PUBLIC_BASE_URL: Instagram/Facebook necesitan una URL pública para descargar las imágenes.');
            err.statusCode = 409;
            throw err;
        }

        const imageUrls = publicacion.imagenes.slice().sort((a, b) => a.orden - b.orden).map(img => img.url);

        const facebookActual = publicacion.facebook.toObject ? publicacion.facebook.toObject() : publicacion.facebook;
        const instagramActual = publicacion.instagram.toObject ? publicacion.instagram.toObject() : publicacion.instagram;

        let facebook = facebookActual;
        let instagram = instagramActual;
        const resultado = { facebook: null, instagram: null };

        if (facebookActual.seleccionado && facebookActual.estado !== 'publicado') {
            try {
                const { postId } = await metaGraphService.publicarEnFacebook(imageUrls, facebookActual.caption);
                facebook = { ...facebookActual, estado: 'publicado', postId, publicadoEn: new Date(), error: null };
                resultado.facebook = { ok: true };
            } catch (error) {
                facebook = { ...facebookActual, estado: 'error', error: error.message };
                resultado.facebook = { ok: false, error: error.message };
            }
        }

        if (instagramActual.seleccionado && instagramActual.estado !== 'publicado') {
            try {
                const { postId } = await metaGraphService.publicarEnInstagram(imageUrls, instagramActual.caption);
                instagram = { ...instagramActual, estado: 'publicado', postId, publicadoEn: new Date(), error: null };
                resultado.instagram = { ok: true };
            } catch (error) {
                instagram = { ...instagramActual, estado: 'error', error: error.message };
                resultado.instagram = { ok: false, error: error.message };
            }
        }

        await publicacionRepo.actualizar(id, { facebook, instagram });
        return resultado;
    }

    async actualizar(id, datos) {
        const publicacion = await this.getPorId(id);
        const cambios = {};

        for (const red of ['facebook', 'instagram']) {
            if (datos[red] && publicacion[red].estado !== 'publicado') {
                const actual = publicacion[red].toObject ? publicacion[red].toObject() : publicacion[red];
                cambios[red] = {
                    ...actual,
                    seleccionado: typeof datos[red].seleccionado === 'boolean' ? datos[red].seleccionado : actual.seleccionado,
                    caption: typeof datos[red].caption === 'string' ? datos[red].caption : actual.caption
                };
            }
        }

        return await publicacionRepo.actualizar(id, cambios);
    }

    async eliminar(id) {
        const publicacion = await this.getPorId(id);
        let avisoInstagram = false;

        if (publicacion.facebook.postId) {
            try {
                await metaGraphService.eliminarDeFacebook(publicacion.facebook.postId);
            } catch (error) {
                console.error('No se pudo borrar el post de Facebook:', error.message);
            }
        }

        if (publicacion.instagram.estado === 'publicado') {
            avisoInstagram = true;
        }

        for (const imagen of publicacion.imagenes || []) {
            if (imagen.path && fs.existsSync(imagen.path)) {
                fs.unlinkSync(imagen.path);
            }
        }

        await publicacionRepo.eliminar(id);
        return { avisoInstagram };
    }
}

module.exports = new PublicacionService();
