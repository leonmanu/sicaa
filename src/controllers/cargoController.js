const cargoService = require('../services/cargoService');

class CargoController {
    vistaAsignacionCiie = async (req, res) => {
        try {
            // Usamos el ID de Laferrere que ya tenemos
            const { pofConEstado, agentes } = await cargoService.obtenerPanelAsignacion(req.user.referenciaId);
            res.render('pages/cargo/asignacion', { 
                cargos: pofConEstado, 
                agentes,
                user: req.user // Para saber si es CIIE o Agente
            });
        } catch (error) {
            res.status(500).send("Error al cargar la planta");
        }           
}
}

module.exports = new CargoController();
