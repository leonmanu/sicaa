const plantillaDispositivoService = require('../services/plantillaDispositivoService');

class PlantillaDispositivoController {

    getLista = async (req, res) => {
        try {
            const plantillas = await plantillaDispositivoService.getTodas();
            res.render('pages/publicacion/plantillasDispositivoList', { plantillas, user: req.user });
        } catch (error) {
            console.error('Error en getLista (plantillas):', error.message);
            req.flash('error', 'No se pudieron cargar las plantillas.');
            res.redirect('/publicaciones');
        }
    }

    postCrear = async (req, res) => {
        try {
            await plantillaDispositivoService.crear(req.body);
            req.flash('success', 'Plantilla creada correctamente.');
        } catch (error) {
            console.error('Error en postCrear (plantillas):', error.message);
            req.flash('error', error.message || 'No se pudo crear la plantilla.');
        }
        res.redirect('/plantillas-dispositivo');
    }

    putActualizar = async (req, res) => {
        try {
            await plantillaDispositivoService.actualizar(req.params.id, req.body);
            res.json({ success: true });
        } catch (error) {
            console.error('Error en putActualizar (plantillas):', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    deleteEliminar = async (req, res) => {
        try {
            await plantillaDispositivoService.eliminar(req.params.id);
            res.json({ success: true });
        } catch (error) {
            console.error('Error en deleteEliminar (plantillas):', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new PlantillaDispositivoController();
