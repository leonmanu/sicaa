const inscriptoExternoService = require('../services/inscriptoExternoService');

const getCursantes = async (req, res) => {
    try {
        const { idInscripcion } = req.params; 
        const { idcurso } = req.query;

        console.log(`Buscando cursantes para la inscripción ${idInscripcion} del curso base ${idcurso}`);

        // Le pasamos el ID al service
        const cursantes = await inscriptoExternoService.listarCursantes(idInscripcion, idcurso);
        console.log("Ejemplo de cursante encontrado: ", cursantes[0])
        res.render('pages/cursante/cursanteList', { 
            cursantes: cursantes,
            title: "Listado de Cursantes",
            user: req.user
        });

    } catch (error) {
        console.error('Error al obtener cursantes:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

// cursanteController.js
const calificar = async (req, res) => {
    try {
        const { id, nota, idCurso } = req.body; // El EJS manda estos tres
        
        if (!id || !nota || !idCurso) {
            throw new Error("Faltan parámetros: id, nota o idCurso");
        }

        await inscriptoExternoService.cambiarNota(id, nota, idCurso);
        res.json({ success: true });
    } catch (error) {
        // Este mensaje es el que verás en la terminal de VS Code
        console.log("-----------------------------------------");
        console.error("ERROR DETECTADO EN EL SERVIDOR:");
        console.error(error); 
        console.log("-----------------------------------------");
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { 
    getCursantes, 
    calificar
}