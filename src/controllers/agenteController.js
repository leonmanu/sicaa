
const agenteService = require('../services/agenteService');
const cargoService = require('../services/cargoService');
const ciieService = require('../services/ciieService');
const cursoLocalService = require('../services/cursoLocalService');
const encuentroService = require('../services/encuentroService');
const inscriptoLocalService = require('../services/inscriptoLocalService');

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

// const getCargosPorAgenteEmail = async (req, res) => {
//     try{
//         const email = req.user.email;
//         console.log('Obteniendo cargos para el email:', email);
//         const asignaciones = await agenteService.getCargosPorEmail(email);
//         res.render('pages/usuario/cargo', {
//             asignaciones,
//             user: req.user
//         });
//     }   catch (error) {
//         console.error('Error al obtener los cargos del agente:', error);
//         req.flash('error', 'No se pudo obtener la información de los cargos del agente.');
//         res.redirect('/agente/cargo');
//     }   
// }

// const viewAsistencia = async (req, res) => {
//     try{
//         const { idOfertaOficial } = req.params

//         const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(idOfertaOficial)
//         const inscriptosLocales = await inscriptoLocalService.getPorCursoId(cursoLocal._id)

//         const encuentros = await encuentroService.getPorCursoId(cursoLocal._id)

//         //const inscriptosLocales = await inscriptoLocalService.getPorCursoId(cursoLocal._id)

//         res.render('pages/cursante/asistencia', { 
//             encuentros,
//             inscriptosLocales,          // Para comparar quién ya tiene pareja
//             cursoLocal,                 // Para llenar el <select> del modal
//             title: "Sincronización de Inscripto",
//             user: req.user
//         });

//     } catch (error) {
//         console.error('Error en listar inscriptos:', error.message);
//         req.flash('error', 'Error asignar cargo.');
//         // 5. Manejo de errores (400 para errores de validación/negocio)
//         res.redirect(`/pages/error`);
//     }
// }

const getAgentesPorCiie = async (req, res) => {
    try {
        console.log('Obteniendo agentes para el CIIE con clave:', req.params.ciieClave);
        const ciieClave = await req.params.ciieClave;
        const ciie = await ciieService.getPorClave(ciieClave);
        const agentes = await agenteService.getAgentesPorCiie(ciie._id);
        res.status(200).json(agentes);
    } catch (error) {
        console.error('Error al obtener los agentes por CIIE:', error);
        res.status(500).json({ error: 'No se pudo obtener los agentes.' });
    }
}

const postEncuentro = async (req, res) => {
    try {
        const data = req.body;
        const nuevoEncuentro = await encuentroService.post(data);
        res.status(201).json(nuevoEncuentro);
    } catch (error) {
        console.error('Error al crear el encuentro:', error);
        res.status(500).json({ error: 'No se pudo crear el encuentro.' });
    }   
}

const postAsistenciaCursante = async (req, res) => {
    try {        
        const data = req.body;
        //console.log('Datos recibidos para nueva asistencia:', data);
        const resultado = await agenteService.postAsistenciaCursante(data);
        res.status(201).json(resultado);
    } catch (error) {
        console.error('Error al guardar la asistencia:', error);
        res.status(500).json({ error: 'No se pudo guardar la asistencia.' });
    }
}


module.exports = { 
    //getCargosPorAgenteEmail,
    //getPorCursoClaveCiieClave,
    //viewAsistencia,
    getAgentesPorCiie,
    postEncuentro,
    postAsistenciaCursante
};