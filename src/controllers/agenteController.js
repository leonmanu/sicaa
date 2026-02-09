
const agenteService = require('../services/agenteService');
const cargoService = require('../services/cargoService');
const ciieService = require('../services/ciieService');
const cursoLocalService = require('../services/cursoLocalService');

// const getPorDni = async (req, res) => {
//     try{
//         const dni = req.params.dni;
//         const agente = await agenteService.getPorDni(dni);
//         res.render('pages/agente/agenteDetalle', {
//             agente,
//             user: req.user
//         });
//     }   catch (error) {
//         console.error('Error al obtener el agente por DNI:', error);
//         req.flash('error', 'No se pudo obtener la información del agente.');
//         res.redirect('/agente/dashboard');
//     }   
// }

const getCargosPorAgenteEmail = async (req, res) => {
    try{
        const email = req.user.email;
        console.log('Obteniendo cargos para el email:', email);
        const asignaciones = await agenteService.getCargosPorEmail(email);
        res.render('pages/usuario/cargo', {
            asignaciones,
            user: req.user
        });
    }   catch (error) {
        console.error('Error al obtener los cargos del agente:', error);
        req.flash('error', 'No se pudo obtener la información de los cargos del agente.');
        res.redirect('/agente/cargo1');
    }   
}


const getPorCursoClaveCiieClave = async (req, res) => {
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
            user: req.user
        });

    } catch (error) {
        console.error('Error al obtener datos para la vista:', error);
        req.flash('error', 'Hubo un problema al cargar la información.');
        res.redirect('/pages/error');
    }
}

module.exports = { 
    getCargosPorAgenteEmail,
    getPorCursoClaveCiieClave
};