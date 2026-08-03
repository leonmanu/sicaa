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

    vistaCargosEtr = async (req, res) => {
        try {
            // Usamos el ID de Laferrere que ya tenemos
            const cargos = await cargoService.getConRolAreaCiie(req.user.referenciaId)
            console.log("Cargo[0]: ", cargos[0])
            res.render('pages/cargo/cargoListTodos', { 
                cargos,
                user: req.user // Para saber si es CIIE o Agente
            });
        } catch (error) {
            res.status(500).send("Error al cargar la planta");
        }           
    }

    getPorCiieId = async (req, res) => {
        try {
            const { cargoClave, ciieClave } = req.params;
            const ciie = await ciieService.getPorClave(ciieClave)
            const cargo = await cargoService.getPorCargoClaveCiieId(cargoClave, ciie._id)
            const cursosLocales = await cursoLocalService.getPorCargoId(cargo._id)
    
    
            // Verificación de seguridad básica
            // if (!cargo) {
            //     req.flash('error', 'El cargo solicitado no existe.');
            //     return res.redirect('/usuario/mis-cargos');
            // }
    
            res.render('pages/curso/cursoLocalList', {
                cargo,         // Objeto único
                cursosLocales, // Array para el forEach
                user: req.user,
                esVistaInstitucional: false
            });
    
        } catch (error) {
            console.error('Error al obtener datos para la vista:', error);
            req.flash('error', 'Hubo un problema al cargar la información.');
            res.redirect('/pages/error');
        }
    }

    getCargos = async (req, res) => {
        try {
            const cargos = await cargoService.getCargosPorUsuarioTipo(req.user)
            res.render('pages/usuario/cargo', {
                cargos,
                user: req.user
            })
        } catch (error) {
            req.flash('error', error.message)
            res.redirect('/');
        }
    }

    getFormAltaCargo = async (req, res) => {
        try {
            const { ciie, roles, areas, cargos } = await cargoService.getDatosParaAlta(req.user.referenciaId);
            res.render('pages/cargo/cargoForm', {
                ciie,
                roles,
                areas,
                cargos,
                user: req.user
            });
        } catch (error) {
            console.error('Error en getFormAltaCargo:', error.message);
            req.flash('error', 'No se pudo cargar el formulario de alta de cargos.');
            res.redirect('/ciie/dashboard');
        }
    }

    postCargo = async (req, res) => {
        try {
            const nuevoCargo = await cargoService.postCargo(req.body, req.user.referenciaId);
            req.flash('success', `Cargo "${nuevoCargo.clave}" creado correctamente.`);
        } catch (error) {
            console.error('Error en postCargo:', error.message);
            req.flash('error', error.message || 'No se pudo crear el cargo.');
        }
        res.redirect('/ciie/cargos/nuevo');
    }

}

module.exports = new CargoController();
