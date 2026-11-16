const publicacionService = require('../services/publicacionService');
const configuracionPublicacionesService = require('../services/configuracionPublicacionesService');
const plantillaDispositivoService = require('../services/plantillaDispositivoService');
const redesSocialesService = require('../services/redesSocialesService');

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
            const publicaciones = await publicacionService.getTodas(req.user.referenciaId);
            res.render('pages/publicacion/publicacionesList', { publicaciones, user: req.user });
        } catch (error) {
            console.error('Error en getLista (publicaciones):', error.message);
            req.flash('error', 'No se pudieron cargar las publicaciones.');
            res.redirect('/');
        }
    }

    getPreview = async (req, res) => {
        try {
            const publicacion = await publicacionService.getPorId(req.params.id, req.user.referenciaId);
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
            // Antes de guardar imágenes: si el CIIE no conectó sus redes, cortar acá.
            await redesSocialesService.getConexion(req.user.referenciaId);
            await publicacionService.guardarImagenes(req.params.id, imagenesBase64, req.user.referenciaId);
            const resultado = await publicacionService.publicar(req.params.id, req.user.referenciaId);
            res.json({ success: true, resultado });
        } catch (error) {
            console.error('Error en postImagenYPublicar (publicaciones):', error.message);
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    }

    putActualizar = async (req, res) => {
        try {
            const { publicacion, avisos } = await publicacionService.actualizar(req.params.id, req.body, req.user.referenciaId);
            res.json({ success: true, publicacion, avisos });
        } catch (error) {
            console.error('Error en putActualizar (publicaciones):', error.message);
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    }

    deleteEliminar = async (req, res) => {
        try {
            const resultado = await publicacionService.eliminar(req.params.id, req.user.referenciaId);
            res.json({ success: true, ...resultado });
        } catch (error) {
            console.error('Error en deleteEliminar (publicaciones):', error.message);
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    }

    // Pantalla "Redes sociales del CIIE": conexión con Meta + textos fijos.
    getConfiguracion = async (req, res) => {
        try {
            const ciieId = req.user.referenciaId;
            const [configuracion, redes] = await Promise.all([
                configuracionPublicacionesService.get(ciieId),
                redesSocialesService.getEstado(ciieId)
            ]);
            res.render('pages/publicacion/configuracionForm', { configuracion, redes, user: req.user });
        } catch (error) {
            console.error('Error en getConfiguracion (publicaciones):', error.message);
            req.flash('error', 'No se pudo cargar la configuración.');
            res.redirect('/publicaciones');
        }
    }

    postConfiguracion = async (req, res) => {
        try {
            await configuracionPublicacionesService.actualizar(req.user.referenciaId, req.body);
            req.flash('success', 'Textos guardados correctamente.');
        } catch (error) {
            console.error('Error en postConfiguracion (publicaciones):', error.message);
            req.flash('error', 'No se pudieron guardar los textos.');
        }
        res.redirect('/publicaciones/configuracion');
    }

    postVerificarMeta = async (req, res) => {
        try {
            const resultado = await redesSocialesService.verificar(req.user.referenciaId, req.body.token);
            res.json({ success: true, ...resultado });
        } catch (error) {
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    }

    postConexionMeta = async (req, res) => {
        try {
            const redes = await redesSocialesService.guardarConexion(req.user.referenciaId, req.body);
            res.json({ success: true, redes });
        } catch (error) {
            console.error('Error en postConexionMeta (publicaciones):', error.message);
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    }

    postDesconectarMeta = async (req, res) => {
        try {
            await redesSocialesService.desconectar(req.user.referenciaId);
            res.json({ success: true });
        } catch (error) {
            console.error('Error en postDesconectarMeta (publicaciones):', error.message);
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new PublicacionController();
