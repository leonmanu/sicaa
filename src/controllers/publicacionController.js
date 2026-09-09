const publicacionService = require('../services/publicacionService');
const configuracionPublicacionesService = require('../services/configuracionPublicacionesService');
const plantillaDispositivoService = require('../services/plantillaDispositivoService');
const metaGraphService = require('../services/metaGraphService');

class PublicacionController {

    postCrear = async (req, res) => {
        try {
            const { cursoLocalId } = req.body;
            if (!cursoLocalId) {
                return res.status(400).json({ success: false, error: 'Falta el curso a publicar.' });
            }
            const publicacion = await publicacionService.crearIndividual(cursoLocalId, req.user);
            res.json({ success: true, publicacion });
        } catch (error) {
            console.error('Error en postCrear (publicaciones):', error.message);
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    }

    postCrearAgrupada = async (req, res) => {
        try {
            const { cursoLocalIds, dispositivoTipo, incluirCaratula, tipoAgrupacion } = req.body;
            if (!Array.isArray(cursoLocalIds) || cursoLocalIds.length === 0) {
                return res.status(400).json({ success: false, error: 'No se seleccionó ningún curso.' });
            }
            const publicaciones = await publicacionService.crearAgrupada({
                cursoLocalIds,
                dispositivoTipo,
                incluirCaratula: !!incluirCaratula,
                tipoAgrupacion,
                ciieId: req.user.referenciaId
            }, req.user);
            res.json({ success: true, publicaciones });
        } catch (error) {
            console.error('Error en postCrearAgrupada (publicaciones):', error.message);
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    }

    getLista = async (req, res) => {
        try {
            const publicaciones = await publicacionService.getTodas();
            res.render('pages/publicacion/publicacionesList', { publicaciones, user: req.user });
        } catch (error) {
            console.error('Error en getLista (publicaciones):', error.message);
            req.flash('error', 'No se pudieron cargar las publicaciones.');
            res.redirect('/');
        }
    }

    getPreview = async (req, res) => {
        try {
            const publicacion = await publicacionService.getPorId(req.params.id);
            const plantilla = publicacion.dispositivoTipo
                ? await plantillaDispositivoService.getPorDispositivo(publicacion.dispositivoTipo)
                : null;
            res.render('pages/publicacion/publicacionPreview', {
                publicacion,
                cursos: publicacion.cursoLocalIds,
                plantilla,
                user: req.user
            });
        } catch (error) {
            console.error('Error en getPreview (publicaciones):', error.message);
            req.flash('error', error.message || 'No se pudo cargar la publicación.');
            res.redirect('/publicaciones');
        }
    }

    postImagenYPublicar = async (req, res) => {
        try {
            const { imagenesBase64 } = req.body;
            await publicacionService.guardarImagenes(req.params.id, imagenesBase64);
            const resultado = await publicacionService.publicar(req.params.id);
            res.json({ success: true, resultado });
        } catch (error) {
            console.error('Error en postImagenYPublicar (publicaciones):', error.message);
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    }

    putActualizar = async (req, res) => {
        try {
            const { publicacion, avisos } = await publicacionService.actualizar(req.params.id, req.body);
            res.json({ success: true, publicacion, avisos });
        } catch (error) {
            console.error('Error en putActualizar (publicaciones):', error.message);
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    }

    deleteEliminar = async (req, res) => {
        try {
            const resultado = await publicacionService.eliminar(req.params.id);
            res.json({ success: true, ...resultado });
        } catch (error) {
            console.error('Error en deleteEliminar (publicaciones):', error.message);
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    }

    // Diagnóstico temporal de solo lectura: confirma, desde ESTE proceso
    // (el que realmente tiene cargadas las env vars en uso), qué permisos
    // tiene el token de Meta configurado. No modifica ni publica nada.
    getDiagnosticoMeta = async (req, res) => {
        try {
            const resultado = await metaGraphService.diagnosticar();
            res.json({ success: true, ...resultado });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    getConfiguracion = async (req, res) => {
        try {
            const configuracion = await configuracionPublicacionesService.get();
            res.render('pages/publicacion/configuracionForm', { configuracion, user: req.user });
        } catch (error) {
            console.error('Error en getConfiguracion (publicaciones):', error.message);
            req.flash('error', 'No se pudo cargar la configuración.');
            res.redirect('/publicaciones');
        }
    }

    postConfiguracion = async (req, res) => {
        try {
            await configuracionPublicacionesService.actualizar(req.body);
            req.flash('success', 'Configuración guardada correctamente.');
        } catch (error) {
            console.error('Error en postConfiguracion (publicaciones):', error.message);
            req.flash('error', 'No se pudo guardar la configuración.');
        }
        res.redirect('/publicaciones/configuracion');
    }
}

module.exports = new PublicacionController();
