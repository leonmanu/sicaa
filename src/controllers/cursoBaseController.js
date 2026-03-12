const ciieService = require('../services/ciieService');
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

const getPorCiie = async (req, res) => {
    try {
        // Ejecutamos las 3 consultas en paralelo
        const ciieId = req.user.referenciaId
        const cursosBaseLocal = await cursoBaseLocalService.getPorCiieId(ciieId);
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

const getPorCiieClave = async (req, res) => {
    try {
        const ciieClave = req.params.ciieClave;
        const ciie = await ciieService.getPorClave(ciieClave);
        if (!ciie) {
            req.flash('error', 'CIIE no encontrado para la clave: ' + ciieClave);  
        }
         
        const ciieId = ciie.referenciaId
        const cursosBaseLocal = await cursoBaseLocalService.getPorCiieId(ciieId);
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

const getPorCiieClavejson = async (req, res) => {
    try {
        const { ciieClave } = req.params;
        const ciie = await ciieService.getPorClave(ciieClave);
        if (!ciie) return res.status(404).json({ error: 'CIIE no encontrado' });

        const cursosBaseLocal = await cursoBaseLocalService.getPorCiieId(ciie._id);
        console.log('Cursos base locales encontrados para CIIE id', ciie._id, ':', cursosBaseLocal);
        res.json(cursosBaseLocal || []);

    } catch (error) {
        console.error('Error al obtener cursos base:', error);
        res.status(500).json({ error: 'No se pudieron obtener los cursos base.' });
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
    getPorCiie,
    getPorCiieClave,
    getPorCiieClavejson,
    getExternos,
    sincronizar
}




