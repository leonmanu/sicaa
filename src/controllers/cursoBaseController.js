const cursoBaseExternoService = require('../services/cursoBaseExternoService');
const cursoBaseLocalService = require('../services/cursoBaseLocalService');
//const cursoBaseLocalService = require('../services/cusoBaseLocalService')

const get = async (req, res) => {
    try {
        // Ejecutamos las 3 consultas en paralelo
        const cursosBaseLocal = await cursoBaseLocalService.get()
        if (!cursosBaseLocal ) {
            cursosBaseLocal = [];
        }

        //console.log('cursoBaseLocalList del ABC:', cursosBaseExterno[0]);
        // Renderizamos con toda la "foto" completa
        res.render('pages/cursoBase/cursoBaseLocalList', { 
            cursosBaseLocal,          // Para comparar quién ya tiene pareja
            title: "Sincronización de Cursos",
            user: req.user
        });

    } catch (error) {
    console.error('Error al orquestar datos de cursos:', error);
    req.flash('error', 'Error al orquestar datos de cursos: ' + error.message);
    res.status(500).render('pages/error', { 
        error: "No se pudo conectar con el sitio oficial o la base de datos." 
    });
}
}

const getPorCiieId = async (req, res) => {
    try {
        // Ejecutamos las 3 consultas en paralelo
        const cursosBaseLocal = await cursoBaseLocalService.getPorCiieId('697a7b3388d6b63c14ccf889');
        if (!cursosBaseLocal ) {
            cursosBaseLocal = [];
        }

        //console.log('cursoBaseLocalList del ABC:', cursosBaseExterno[0]);
        // Renderizamos con toda la "foto" completa
        res.render('pages/cursoBase/cursoBaseLocalList', { 
            cursosBaseLocal,          // Para comparar quién ya tiene pareja
            title: "Sincronización de Cursos",
            user: req.user
        });

    } catch (error) {
    console.error('Error al orquestar datos de cursos:', error);
    req.flash('error', 'Error al orquestar datos de cursos: ' + error.message);
    res.status(500).render('pages/error', { 
        error: "No se pudo conectar con el sitio oficial o la base de datos." 
    });
}
}

const getExternos = async (req, res) => {
    try{
        const cursosBaseExterno = await cursoBaseExternoService.listar()
        console.log('Cursos obtenidos para sincronizar:', cursosBaseExterno[0]);
        res.json({ nuevos: cursosBaseExterno });
    } catch (error) {
        console.error('Error obteniendo cursos externos:', error.message);
        req.flash('error', 'Error al obtener cursos externos: ' + error.message);
        res.status(500).render('pages/error', { 
            error: "No se pudo conectar con el sitio oficial." 
        });
    }
}

const sincronizar = async (req, res) => {
    try {
        const { insertados, actualizados, desactivados } = await cursoBaseLocalService.sincronizar(req.user.referenciaId);
        const partes = [];
        if (insertados > 0) partes.push(`${insertados} nuevos`);
        if (actualizados > 0) partes.push(`${actualizados} actualizados`);
        if (desactivados > 0) partes.push(`${desactivados} desactivados`);

        if (partes.length > 0) {
            req.flash('success', `Sincronización completa: ${partes.join(', ')}.`);
        } else {
            req.flash('info', 'No hay novedades.');
        }

        res.json({ 
            success: true,
            insertados,
            actualizados,
            desactivados
        });
    } catch (error) {
        console.error('Error al sincronizar cursos base:', error);
        res.status(500).render('pages/error', { 
            error: "No se pudo sincronizar con el sitio oficial." 
        });
    }
}

module.exports = { 
    get,
    getPorCiieId,
    getExternos,
    sincronizar
}




