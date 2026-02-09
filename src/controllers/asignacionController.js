const asignacionService = require('../services/asignacionService');

const crearAsignacion = async (req, res) => {
    try {
        // 1. Identificamos si el que opera es un agente o un administrativo del CIIE
        const esCiie = req.user.tipoModel === 'Ciie';

        // 2. Preparamos los datos para el Service
        // Esperamos que req.body traiga: claveCargo, dniAgente, situacionRevista
        const datosAsignacion = {
            cargoClave: req.body.cargoClave, 
            dniAgente: esCiie ? req.body.dni : req.user.dni, // Si es agente, toma su propio DNI
            situacionRevista: req.body.situacionRevista || 'Provisional'
        };

        console.log('Datos para crear asignación:', datosAsignacion);
        // 3. Llamamos al servicio para procesar la lógica de negocio
        const nuevaAsignacion = await asignacionService.asignarCargo(datosAsignacion, esCiie, req.user.email);

        // 4. Si todo salió bien, respondemos éxito
        // Si venís de un formulario tradicional, podrías usar res.redirect('/ciie/gestion-planta');
        req.flash('success', `Cargo ${datosAsignacion.cargoClave} asignado a ${datosAsignacion.dniAgente}.`);
        res.redirect(`/ciie/cargo/asignar#${req.body.cargoClave}`);

    } catch (error) {
        console.error('Error en crearAsignacion Controller:', error.message);
        req.flash('error', 'Error asignar cargo.');
        // 5. Manejo de errores (400 para errores de validación/negocio)
        res.redirect(`/ciie/cargo/asignar#${req.body.cargoClave}`);
    }
};

module.exports = {
    crearAsignacion
};