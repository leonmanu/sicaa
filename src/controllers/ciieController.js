const usuarioService = require('../services/usuarioService');
const agenteService = require('../services/agenteService');

const getDashboard = async (req, res) => {
    try {
        // Obtenemos las personas reales de Mongo
        const personasPendientes = await usuarioService.getSolicitudesPorTipo('Persona');
        
        // Renderizamos el dashboard del CIIE
        res.render('pages/ciie/dashboardCiie', {
            personasPendientes, // Array real de solicitudes
            user: req.user
        });
    } catch (error) {
        console.error("Error en dashboardCiie:", error);
        res.render('error', { error });
    }
}

    const getSubDashboard = async (req, res) => {
        try {
            const categorias = [
                {
                    nombre: 'General',
                    icono: 'bi-grid-1x2',
                    color: 'info',
                    acciones: [
                        { label: 'Panel principal', href: '/ciie/dashboard', descripcion: 'Resumen operativo del nodo CIIE.' },
                        { label: 'Accesos por categoria', href: '/ciie/subdashboard', descripcion: 'Vista de accesos directos del sistema.' }
                    ]
                },
                {
                    nombre: 'Agentes',
                    icono: 'bi-person-badge',
                    color: 'primary',
                    acciones: [
                        { label: 'Listado de agentes', href: '/ciie/agentes', descripcion: 'Consulta y gestion de agentes.' },
                        { label: 'Estados pendientes', href: '/ciie/estados-pendientes', descripcion: 'Revision de agentes pendientes.' }
                    ]
                },
                {
                    nombre: 'Cargos',
                    icono: 'bi-briefcase',
                    color: 'warning',
                    acciones: [
                        { label: 'Todos los cargos', href: '/cargo/todos', descripcion: 'Listado completo de cargos.' },
                        { label: 'Cargos ETR', href: '/ciie/cargos/etr', descripcion: 'Gestion de cargos ETR.' },
                        { label: 'Asignar personal', href: '/ciie/cargo/asignar', descripcion: 'Asignacion de personal por cargo.' }
                    ]
                },
                {
                    nombre: 'Cursos',
                    icono: 'bi-journal-bookmark-fill',
                    color: 'success',
                    acciones: [
                        { label: 'Cursos CIIE', href: '/ciie/cursos', descripcion: 'Cursos locales vinculados al nodo.' },
                        { label: 'Cursos locales (vista general)', href: '/curso/ciie', descripcion: 'Listado amplio de cursos locales.' },
                        { label: 'Cursos externos', href: '/ciie/curso/externo', descripcion: 'Consulta de ofertas externas.' },
                        { label: 'Vincular/abrir inscripcion', href: '/ciie/cursos/nuevo', descripcion: 'Vincular oferta oficial o publicar.' },
                        { label: 'Cursos base', href: '/cursoBase', descripcion: 'Administracion de base de cursos.' },
                        { label: 'Catalogo externo', href: '/curso/lista', descripcion: 'Consulta de propuestas externas.' }
                    ]
                },
                {
                    nombre: 'Calificaciones y documentos',
                    icono: 'bi-award',
                    color: 'danger',
                    acciones: [
                        { label: 'Calificaciones', href: '/ciie/calificaciones', descripcion: 'Gestion y envio de notas.' },
                        { label: 'Certificados y actas', href: '/ciie/certificados', descripcion: 'Impresion de documentos.' },
                        { label: 'Planilla aprobados por itinerario', href: '/ciie/certificados/aprobados-itinerario', descripcion: 'Planilla de aprobados por anio e itinerario.' }
                    ]
                }
            ];

            res.render('pages/ciie/subDashboard', {
                categorias,
                user: req.user,
                title: 'SubDashboard CIIE'
            });
        } catch (error) {
            console.error('Error en getSubDashboard:', error);
            req.flash('error', 'No se pudo cargar el subdashboard.');
            res.redirect('/ciie/dashboard');
        }
    }

const getUsuarioPorModelo = async (req, res) => {
    try{
        const agentes = await usuarioService.getPorModelo('Persona');
        res.render('pages/agente/agenteList', {
            agentes,
            user: req.user
        })
    }   catch (error) {
        console.error('Error al listar las instituciones:', error);
        req.flash('error', 'No se pudieron listar las instituciones.');
        res.redirect('/admin/dashboard');
    }
}

const getAgentesPendientes = async (req, res) => {
    try {
        const agentesPendientes = await agenteService.getAgentesPendientes();
        res.render('pages/ciie/agentesPendientes', {
            agentesPendientes,
            user: req.user
        });
    } catch (error) {
        console.error('Error al obtener agentes pendientes:', error);
        req.flash('error', 'No se pudieron obtener los agentes pendientes.');
        res.redirect('/ciie/dashboard');
    }   
}

const putEstadoUsuario = async (req, res) => {
    try {
        const { clave } = req.params; // La clave única viene por URL
        const { estado } = req.body;   // 'aprobado' o 'rechazado'
        console.log('Cambiar estado del usuario con clave:', clave, 'a estado:', estado);
        await usuarioService.putEstadoUsuario(clave, estado);
        
        req.flash('success', `Estado del usuario ${clave} actualizado a ${estado}`);

        res.redirect(req.get('referer') || '/admin/dashboard');
    } catch (error) {
        console.error('Error en adminController:', error);
        req.flash('error', 'No se pudo cambiar el estado.');
        res.redirect('/admin/dashboard');
    }
}

const putAgenteEstado = async (req, res) => {
    try {
        // Mantenemos 'clave' como nombre del parámetro si así lo definís en el router,
        // pero sabemos que para el CIIE esa clave será el DNI del Agente.
        const { dni } = req.params; 
        const { nuevoEstado } = req.body; 
        
        console.log('CIIE cambiando estado de agente:', dni, 'a:', nuevoEstado);

        // Reutilizamos el servicio que ya tenés, que es el que hace la magia en la DB
        await agenteService.putAgenteEstado(dni, nuevoEstado);

        req.flash('success', `El agente con DNI ${dni} ha sido ${nuevoEstado} correctamente.`);

        // El referer es clave aquí para que vuelva a la lista de agentes del CIIE
        res.redirect(req.get('referer') || '/ciie/agentesList');
    } catch (error) {
        console.error('Error en ciieController (cambiarEstadoAgente):', error);
        console.log('Redirigiendo a /ciie/dashboard por error');
        req.flash('error', 'Hubo un problema al procesar la solicitud.');
        res.redirect('/ciie/dashboard');
    }
}


module.exports = {
    getDashboard,
        getSubDashboard,
    getUsuarioPorModelo,
    putAgenteEstado,
    getAgentesPendientes
}