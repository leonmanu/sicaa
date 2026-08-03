const areaService = require('../services/areaService');

class AreaController {

    getForm = async (req, res) => {
        try {
            const areas = await areaService.getTodas();
            res.render('pages/area/areaForm', {
                areas,
                user: req.user
            });
        } catch (error) {
            console.error('Error en AreaController.getForm:', error.message);
            req.flash('error', 'No se pudieron cargar las áreas.');
            res.redirect('/');
        }
    }

    postArea = async (req, res) => {
        try {
            const nuevaArea = await areaService.postArea(req.body);
            req.flash('success', `Área "${nuevaArea.nombre}" creada correctamente.`);
        } catch (error) {
            console.error('Error en AreaController.postArea:', error.message);
            req.flash('error', error.message || 'No se pudo crear el área.');
        }
        res.redirect(req.get('referer') || '/');
    }
}

module.exports = new AreaController();
