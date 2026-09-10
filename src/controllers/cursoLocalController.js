const cargoService = require('../services/cargoService');
const ciieService = require('../services/ciieService');
const cursoLocalService = require('../services/cursoLocalService');
const inscriptoExternoService = require('../services/inscriptoExternoService');
const inscriptoLocalService = require('../services/inscriptoLocalService');
const acreditacionSeminariosService = require('../services/acreditacionSeminariosService');
const publicacionService = require('../services/publicacionService');

const vincularCurso = async (req, res) => {
    try {
        const resultado = await cursoLocalService.vincularCurso(req.body, req.user);
        //console.log('Curso vinculado localmente con éxito:', req.body);
        req.flash('success', 'Curso vinculado localmente con éxito.');
        return res.status(200).json({ 
            success: true, 
            message: 'Curso vinculado correctamente' 
        });
    } catch (error) {
        console.error('Error al vincular el curso:', error.message);
        req.flash('error', 'Error al vincular el curso: ' + error.message);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}

// const getCursosLocales = async (req, res) => {
//     try {
//         const cursos = await cursoLocalService.getCursosLocales();  
//         res.render('pages/curso/cursoLocalList', { 
//             cursos, 
//             title: "Cursos Locales Vinculados" 
//         });
//     } catch (error) {
//         console.error('Error al obtener cursos locales:', error.message);
//         res.status(500).send("Error en el servidor: " + error.message);
//     }
// }

const getCursosLocales = async (req, res) => {
    try {
        const cursos = await cursoLocalService.getCursosLocales();
        res.render('pages/curso/cursoLocalList', {
            cursos,
            esVistaInstitucional: false,
            title: "Cursos Locales Vinculados"
        });
    } catch (error) {
        console.error('Error al obtener cursos locales:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const post = async (req, res) => {
    try {
        const cursoCreado = await cursoLocalService.post(req.body, req.user);
        req.flash('success', 'Curso creado correctamente.');
        return res.status(201).json({
            success: true,
            message: 'Curso creado correctamente',
            curso: cursoCreado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo crear el curso.';
        console.error('Error en post:', message);
        req.flash('error', message);
        return res.status(status).json({
            success: false,
            error: message
        });
    }
}

const putCurso = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const cursoActualizado = await cursoLocalService.editarCursoPorId(cursoId, req.body, req.user);
        const mensaje = cursoActualizado?.pendienteDeAprobacion
            ? 'Los cambios se enviaron a tu CIIE para su aprobación.'
            : cursoActualizado?.errorAbc
                ? `Los cambios se guardaron, pero no se pudieron reflejar en el sitio oficial: ${cursoActualizado.errorAbc}`
                : 'Curso actualizado correctamente.';
        req.flash(cursoActualizado?.errorAbc ? 'error' : 'success', mensaje);
        return res.status(200).json({
            success: true,
            message: mensaje,
            avisoAbc: Boolean(cursoActualizado?.errorAbc),
            curso: cursoActualizado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo actualizar el curso.';
        console.error('Error en putCurso:', message);
        req.flash('error', message);
        return res.status(status).json({
            success: false,
            error: message
        });
    }
}

const postAprobarCambiosPendientes = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const curso = await cursoLocalService.aprobarCambiosPendientes(cursoId, req.user);
        return res.status(200).json({
            success: true,
            message: 'Cambios aprobados y publicados en el sitio oficial.',
            curso
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudieron aprobar los cambios.';
        console.error('Error en postAprobarCambiosPendientes:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

const postRechazarCambiosPendientes = async (req, res) => {
    try {
        const cursoId = req.params.id;
        const curso = await cursoLocalService.rechazarCambiosPendientes(cursoId, req.user);
        return res.status(200).json({
            success: true,
            message: 'Cambios propuestos rechazados.',
            curso
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudieron rechazar los cambios.';
        console.error('Error en postRechazarCambiosPendientes:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

const getVincularConSitioOficial = async (req, res) => {
    try {
        console.log('CIIE:', req.user.referenciaId);
        const ciieClave = await req.user.referenciaId;
        const selectedCursoLocalId = String(req.query.cursoLocalId || '').trim() || null;
        const [cursosPendientes, ofertasOficiales] = await Promise.all([
            cursoLocalService.getPendientesVinculacionPorCiie(ciieClave),
            cursoLocalService.getOfertasOficialesDisponibles()
        ]);
        console.log
        res.render('pages/ciie/cursoVincularOficial', {
            cursosPendientes,
            ofertasOficiales,
            selectedCursoLocalId,
            user: req.user,
            title: 'Vincular Cursos con Sitio Oficial'
        });
    } catch (error) {
        console.error('Error al cargar vista de vinculacion oficial:', error.message);
        req.flash('error', 'No se pudo cargar la vista de vinculacion.');
        res.redirect('/ciie/dashboard');
    }
}

const getCalificacionesPendientes = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const cursosPendientes = await cursoLocalService.getPendientesCalificacionesPorCiie(ciieId);

        res.render('pages/ciie/calificacionesList', {
            cursosPendientes,
            user: req.user,
            title: 'Envío de Calificaciones'
        });
    } catch (error) {
        console.error('Error al cargar vista de calificaciones pendientes:', error);
        req.flash('error', 'No se pudo cargar la vista de calificaciones.');
        res.redirect('/ciie/dashboard');
    }
}

const getCalificaciones = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const cursosPendientes = await cursoLocalService.getCalificacionesPorCiie(ciieId);

        res.render('pages/ciie/calificacionesList', {
            cursosPendientes,
            user: req.user,
            title: 'Envío de Calificaciones'
        });
    } catch (error) {
        console.error('Error al cargar vista de calificaciones pendientes:', error);
        req.flash('error', 'No se pudo cargar la vista de calificaciones.');
        res.redirect('/ciie/dashboard');
    }
}

const getPlanillaAprobadosItinerario = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const itinerarios = await cursoLocalService.getItinerariosDisponiblesPorCiie(ciieId);

        const anioQuery = Number(req.query.anio);
        const itinerarioQuery = Number(req.query.itinerario);
        const tieneSeleccionQuery = Number.isFinite(anioQuery) && Number.isFinite(itinerarioQuery);

        let seleccion = null;
        if (tieneSeleccionQuery) {
            const existe = itinerarios.some(i => i.anio === anioQuery && i.itinerario === itinerarioQuery);
            if (existe) {
                seleccion = { anio: anioQuery, itinerario: itinerarioQuery };
            }
        }

        if (!seleccion && itinerarios.length > 0) {
            seleccion = {
                anio: itinerarios[0].anio,
                itinerario: itinerarios[0].itinerario
            };
        }

        let planilla = {
            cursos: [],
            aprobados: [],
            resumen: {
                cantidadCursos: 0,
                cantidadAprobados: 0
            }
        };

        if (seleccion) {
            planilla = await cursoLocalService.getPlanillaAprobadosPorItinerario(
                ciieId,
                seleccion.anio,
                seleccion.itinerario
            );
        }

        return res.render('pages/ciie/aprobadosItinerario', {
            itinerarios,
            seleccion,
            planilla,
            user: req.user,
            title: 'Planilla de aprobados por itinerario'
        });
    } catch (error) {
        const message = error.message || 'No se pudo cargar la planilla de aprobados.';
        console.error('Error en getPlanillaAprobadosItinerario:', error);
        req.flash('error', message);
        return res.redirect('/ciie/certificados');
    }
}

const getComunicadoItinerario = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const itinerarios = await cursoLocalService.getItinerariosParaComunicado(ciieId);

        const anioQuery = Number(req.query.anio);
        const itinerarioQuery = Number(req.query.itinerario);
        const tieneSeleccionQuery = Number.isFinite(anioQuery) && Number.isFinite(itinerarioQuery);

        let seleccion = null;
        if (tieneSeleccionQuery) {
            const existe = itinerarios.some(i => i.anio === anioQuery && i.itinerario === itinerarioQuery);
            if (existe) {
                seleccion = { anio: anioQuery, itinerario: itinerarioQuery };
            }
        }

        if (!seleccion && itinerarios.length > 0) {
            // Por defecto: el año más reciente y, dentro de ese año, el itinerario más alto.
            const ultimo = itinerarios.reduce((mejor, actual) => {
                if (!mejor) return actual;
                if (actual.anio !== mejor.anio) return actual.anio > mejor.anio ? actual : mejor;
                return actual.itinerario > mejor.itinerario ? actual : mejor;
            }, null);
            seleccion = { anio: ultimo.anio, itinerario: ultimo.itinerario };
        }

        let comunicado = { ciie: null, cursos: [] };
        if (seleccion) {
            comunicado = await cursoLocalService.getCursosParaComunicado(
                ciieId,
                seleccion.anio,
                seleccion.itinerario
            );
        }

        const dispositivos = [...new Set(comunicado.cursos.map(c => c.dispositivo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

        return res.render('pages/ciie/comunicado', {
            itinerarios,
            seleccion,
            comunicado,
            dispositivos,
            user: req.user,
            title: 'Comunicado de itinerario'
        });
    } catch (error) {
        const message = error.message || 'No se pudo generar el comunicado.';
        console.error('Error en getComunicadoItinerario:', error);
        req.flash('error', message);
        return res.redirect('/ciie/dashboard');
    }
}

// Resuelve la selección de año/itinerario a partir del query, o el más alto por defecto.
const _resolverSeleccionItinerario = (itinerarios, query) => {
    const anioQuery = Number(query.anio);
    const itinerarioQuery = Number(query.itinerario);
    if (Number.isFinite(anioQuery) && Number.isFinite(itinerarioQuery)) {
        const existe = itinerarios.some(i => i.anio === anioQuery && i.itinerario === itinerarioQuery);
        if (existe) return { anio: anioQuery, itinerario: itinerarioQuery };
    }
    if (itinerarios.length > 0) {
        const ultimo = itinerarios.reduce((mejor, actual) => {
            if (!mejor) return actual;
            if (actual.anio !== mejor.anio) return actual.anio > mejor.anio ? actual : mejor;
            return actual.itinerario > mejor.itinerario ? actual : mejor;
        }, null);
        return { anio: ultimo.anio, itinerario: ultimo.itinerario };
    }
    return null;
}

const getRegistroCursantesMasivo = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const itinerarios = await cursoLocalService.getItinerariosParaComunicado(ciieId);
        const seleccion = _resolverSeleccionItinerario(itinerarios, req.query);

        const cursos = seleccion
            ? await cursoLocalService.getCursosConInscriptosParaImpresion(ciieId, seleccion.anio, seleccion.itinerario)
            : [];

        return res.render('pages/ciie/registroCursantesMasivo', {
            itinerarios,
            seleccion,
            cursos,
            user: req.user,
            title: 'Registro de cursantes por itinerario'
        });
    } catch (error) {
        const message = error.message || 'No se pudo generar el registro.';
        console.error('Error en getRegistroCursantesMasivo:', error);
        req.flash('error', message);
        return res.redirect('/ciie/dashboard');
    }
}

const getListaAsistenciaMasiva = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const itinerarios = await cursoLocalService.getItinerariosParaComunicado(ciieId);
        const seleccion = _resolverSeleccionItinerario(itinerarios, req.query);

        const cursos = seleccion
            ? await cursoLocalService.getCursosConInscriptosParaImpresion(ciieId, seleccion.anio, seleccion.itinerario)
            : [];

        return res.render('pages/ciie/listaAsistenciaMasiva', {
            itinerarios,
            seleccion,
            cursos,
            user: req.user,
            title: 'Listas para firmar por itinerario'
        });
    } catch (error) {
        const message = error.message || 'No se pudo generar las listas para firmar.';
        console.error('Error en getListaAsistenciaMasiva:', error);
        req.flash('error', message);
        return res.redirect('/ciie/dashboard');
    }
}

// ─── Sincronización masiva de inscriptos con el sitio oficial, por itinerario ──
const getSincronizarItinerario = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const itinerarios = await cursoLocalService.getItinerariosParaComunicado(ciieId);
        const seleccion = _resolverSeleccionItinerario(itinerarios, req.query);

        const cursos = seleccion
            ? await cursoLocalService.getCursosDisponiblesParaSincronizar(ciieId, seleccion.anio, seleccion.itinerario)
            : [];

        const dispositivos = [...new Set(cursos.map(c => c.dispositivo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

        return res.render('pages/ciie/sincronizarItinerario', {
            itinerarios,
            seleccion,
            cursos,
            dispositivos,
            user: req.user,
            title: 'Sincronizar itinerario con el sitio oficial'
        });
    } catch (error) {
        const message = error.message || 'No se pudo cargar la vista de sincronización.';
        console.error('Error en getSincronizarItinerario:', error);
        req.flash('error', message);
        return res.redirect('/ciie/dashboard');
    }
}

// Server-Sent Events: sincroniza curso por curso, con una pausa entre cada
// uno para no saturar el sitio oficial, y va emitiendo el progreso.
const getSincronizarItinerarioStream = async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    const enviar = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const ids = String(req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
    const usuarioEmail = req.user?.email;

    if (ids.length === 0) {
        enviar({ tipo: 'fin', ok: 0, errores: 0, nuevosTotal: 0 });
        return res.end();
    }

    enviar({ tipo: 'inicio', total: ids.length });

    let ok = 0, errores = 0, nuevosTotal = 0;

    for (let i = 0; i < ids.length; i++) {
        const idOfertaOficial = ids[i];
        try {
            const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(idOfertaOficial);
            if (!cursoLocal) throw new Error('Curso no encontrado en la base local.');

            const inscriptosRaw = await inscriptoExternoService.listarCursantes(
                cursoLocal.idOfertaOficial,
                cursoLocal.idCursoOriginal
            );
            const inscripcionesLocalesIds = await inscriptoLocalService.getIdInscripcionPorCursoId(cursoLocal._id);
            const nuevos = inscriptosRaw.filter(ins => !inscripcionesLocalesIds.includes(String(ins[0])));

            let vinculados = 0;
            if (nuevos.length > 0) {
                const resultado = await inscriptoLocalService.vincularColeccion(nuevos, idOfertaOficial, usuarioEmail);
                vinculados = resultado.count ?? 0;
            }

            nuevosTotal += vinculados;
            ok++;
            enviar({
                tipo: 'progreso',
                actual: i + 1,
                total: ids.length,
                idOfertaOficial,
                nombrePropuesta: cursoLocal.nombrePropuesta,
                totalEnAbc: inscriptosRaw.length,
                nuevos: vinculados,
                ok: true
            });
        } catch (error) {
            errores++;
            enviar({
                tipo: 'progreso',
                actual: i + 1,
                total: ids.length,
                idOfertaOficial,
                ok: false,
                error: error.message || 'Error desconocido'
            });
        }

        // Pausa entre cursos para no saturar al sitio oficial con pedidos seguidos.
        if (i < ids.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1200));
        }
    }

    enviar({ tipo: 'fin', ok, errores, nuevosTotal });
    res.end();
}

// ─── Acreditación de seminarios combinados (formacionpermanente.abc.gob.ar) ───
const getAcreditacionSeminarios = async (req, res) => {
    try {
        return res.render('pages/ciie/acreditacionSeminarios', {
            user: req.user,
            title: 'Acreditación de seminarios'
        });
    } catch (error) {
        const message = error.message || 'No se pudo cargar la vista de acreditación de seminarios.';
        console.error('Error en getAcreditacionSeminarios:', error);
        req.flash('error', message);
        return res.redirect('/ciie/dashboard');
    }
}

// Server-Sent Events: recorre los seminarios vinculados del CIIE, uno por vez
// (solo lectura contra el sitio oficial), y va emitiendo el progreso.
const getAcreditacionSeminariosStream = async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    const enviar = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const ciieId = req.user.referenciaId;
    const seminarios = await acreditacionSeminariosService.getSeminarios(ciieId);
    enviar({ tipo: 'inicio', total: seminarios.length });

    const pendientes = await acreditacionSeminariosService.generarReporte(ciieId, (progreso) => {
        enviar({
            tipo: 'progreso',
            actual: progreso.actual,
            total: progreso.total,
            idOfertaOficial: progreso.curso.idOfertaOficial,
            nombrePropuesta: progreso.curso.nombrePropuesta,
            ok: progreso.ok,
            pendientes: progreso.pendientes,
            error: progreso.error
        });
    });

    enviar({
        tipo: 'fin',
        pendientes: pendientes.map(p => ({
            idOfertaOficial: p.curso.idOfertaOficial,
            idCursoOriginal: p.curso.idCursoOriginal,
            nombrePropuesta: p.curso.nombrePropuesta,
            anio: p.curso.anio,
            itinerario: p.curso.itinerario,
            aprobados: p.aprobados,
            cantcerti: p.cantcerti,
            pendientesCantidad: p.pendientes,
            certificados: p.certificados,
            aprobadosTotales: p.aprobadosTotales
        }))
    });
    res.end();
}

const postCertificarSeminario = async (req, res) => {
    try {
        const { idCursoOriginal, aprobados, cantcerti } = req.body;
        if (!idCursoOriginal || !aprobados) {
            return res.status(400).json({ success: false, error: 'Faltan datos para certificar.' });
        }
        const resultado = await acreditacionSeminariosService.certificarUno(idCursoOriginal, aprobados, cantcerti);
        return res.json({ success: true, resultado });
    } catch (error) {
        console.error('Error en postCertificarSeminario:', error);
        return res.status(500).json({ success: false, error: error.message || 'No se pudo certificar.' });
    }
}

const getTrayectoriaCursantes = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const filtros = {
            dni: req.query.dni,
            apellido: req.query.apellido,
            nombres: req.query.nombres
        };

        const resultado = await cursoLocalService.buscarTrayectoriaCursantes(ciieId, filtros);

        return res.render('pages/ciie/trayectoriaCursantes', {
            personas: resultado.personas,
            busqueda: resultado.busqueda,
            user: req.user,
            title: 'Trayectoria de cursantes'
        });
    } catch (error) {
        const message = error.message || 'No se pudo cargar la trayectoria de cursantes.';
        console.error('Error en getTrayectoriaCursantes:', error);
        req.flash('error', message);
        return res.redirect('/ciie/certificados');
    }
}

const getCalificacionesCursoDetail = async (req, res) => {
    try {
        const { idOfertaOficial } = req.params;
        const { curso, inscriptosLocales } = await cursoLocalService.getDetalleCalificacionesCurso(idOfertaOficial, req.user);

        res.render('pages/ciie/calificacionesCursoDetail', {
            curso,
            inscriptosLocales,
            user: req.user,
            title: 'Detalle de Calificaciones'
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo cargar el detalle de calificaciones.';
        console.error('Error en getCalificacionesCursoDetail:', message);
        req.flash('error', message);
        if (status === 403 || status === 404 || status === 409) {
            return res.redirect('/ciie/calificaciones');
        }
        return res.redirect('/ciie/dashboard');
    }
}

const postEnviarCalificacionesLote = async (req, res) => {
    try {
        const { cursoIds } = req.body;
        const resultado = await cursoLocalService.enviarCalificacionesPendientesEnLote(cursoIds, req.user);
        return res.status(200).json({
            success: true,
            message: 'Proceso de envío ejecutado.',
            resultado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo enviar el lote de calificaciones.';
        console.error('Error en postEnviarCalificacionesLote:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

const postGuardarYEnviarCalificacionesCurso = async (req, res) => {
    try {
        const { idOfertaOficial } = req.params;
        const { calificaciones } = req.body;

        const resultado = await cursoLocalService.actualizarCalificacionesYEnviarCurso(idOfertaOficial, calificaciones, req.user);
        return res.status(200).json({
            success: true,
            message: 'Calificaciones enviadas y curso actualizado.',
            resultado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo guardar y enviar las calificaciones.';
        console.error('Error en postGuardarYEnviarCalificacionesCurso:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

const postEnviarCalificacionesCurso = async (req, res) => {
    try {
        const { idOfertaOficial } = req.params;
        const resultado = await cursoLocalService.enviarCalificacionesCursoPorOferta(idOfertaOficial, req.user);
        return res.status(200).json({
            success: true,
            message: 'Curso enviado correctamente.',
            resultado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo enviar el curso.';
        console.error('Error en postEnviarCalificacionesCurso:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

const getCalificacionesDocumentosCurso = async (req, res) => {
    try {
        const { idOfertaOficial } = req.params;
        const tipo = String(req.query.tipo || 'ambos').toLowerCase();
        const documentoCurso = await cursoLocalService.getDocumentosCurso(idOfertaOficial, req.user);
        const cursosDocumentos = [documentoCurso];

        const vista = tipo === 'certificados'
            ? 'pages/ciie/calificacionesDocumentosCertificados'
            : tipo === 'acta'
                ? 'pages/ciie/calificacionesDocumentosActa'
                : 'pages/ciie/calificacionesDocumentosAmbos';

        return res.render(vista, {
            cursosDocumentos,
            user: req.user,
            title: 'Documentos del curso'
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudieron obtener los documentos.';
        console.error('Error en getCalificacionesDocumentosCurso:', message);
        req.flash('error', message);
        if (status === 400 || status === 403 || status === 404 || status === 409) {
            return res.redirect('/ciie/certificados');
        }
        return res.redirect('/ciie/dashboard');
    }
}

const getCalificacionesDocumentosLote = async (req, res) => {
    try {
        const tipo = String(req.query.tipo || 'ambos').toLowerCase();
        const rawIds = String(req.query.cursoIds || '');
        const idOfertas = rawIds.split(',').map(id => id.trim()).filter(Boolean);
        const cursosDocumentos = await cursoLocalService.getDocumentosCursosLote(idOfertas, req.user);
        // DEBUG CORRECTO:
        

        const vista = tipo === 'certificados'
            ? 'pages/ciie/calificacionesDocumentosCertificados'
            : tipo === 'acta'
                ? 'pages/ciie/calificacionesDocumentosActa'
                : 'pages/ciie/calificacionesDocumentosAmbos';

        return res.render(vista, {
            cursosDocumentos,
            user: req.user,
            title: 'Documentos por lote'
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudieron obtener los documentos del lote.';
        console.error('Error en getCalificacionesDocumentosLote:', error);
        req.flash('error', message);
        if (status === 400 || status === 403 || status === 404 || status === 409) {
            return res.redirect('/ciie/certificados');
        }
        return res.redirect('/ciie/dashboard');
    }
}

const postMarcarImpresionDocumentos = async (req, res) => {
    try {
        const { idOfertaOficial } = req.params;
        const { tipo } = req.body || {};
        const curso = await cursoLocalService.marcarImpresionDocumentos(idOfertaOficial, tipo, req.user);

        return res.status(200).json({
            success: true,
            message: 'Estado de impresión actualizado.',
            curso
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo actualizar el estado de impresión.';
        console.error('Error en postMarcarImpresionDocumentos:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

const postVincularConSitioOficial = async (req, res) => {
    try {
        const curso = await cursoLocalService.vincularCursoConSitioOficial(req.body, req.user);
        return res.status(200).json({
            success: true,
            message: 'Curso vinculado con el sitio oficial.',
            curso
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo vincular el curso.';
        console.error('Error en postVincularConSitioOficial:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

const postEditarCursoPendiente = async (req, res) => {
    try {
        const curso = await cursoLocalService.editarCursoPendiente(req.body, req.user);
        return res.status(200).json({
            success: true,
            message: 'Curso pendiente actualizado correctamente.',
            curso
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo editar el curso pendiente.';
        console.error('Error en postEditarCursoPendiente:', message);
        return res.status(status).json({ success: false, error: message });
    }
}

    const postCrearYVincularConSitioOficial = async (req, res) => {
        try {
            console.log('Datos recibidos para crear y vincular curso:', req.body);
            const resultado = await cursoLocalService.crearYVincularCursoEnSitioOficial(req.body, req.user);
            
            return res.status(200).json({
                success: true,
                message: 'Curso creado en ABC y vinculado correctamente.',
                ...resultado
            });
        } catch (error) {
            const status = error.statusCode || 500;
            const message = error.message || 'No se pudo crear y vincular el curso.';
            console.error('Error en postCrearYVincularConSitioOficial:', message);
            return res.status(status).json({ success: false, error: message });
        }
    }

const getPorCiie = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const ciie = await ciieService.getPorId(ciieId);
        const cursosLocales = await cursoLocalService.getCursosPorCiieId(ciieId);
        //console.log('Cursos locales obtenidos para CIIE Clave', req.user)
        res.render('pages/curso/cursoLocalList', { 
            cursosLocales,
            cargo: [],
            user: req.user,
            ciieClave: ciie.clave,
            esVistaInstitucional: true,
            title: "Cursos Locales Vinculados" 
        });
    } catch (error) {
        console.error('Error al obtener cursos locales:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const getPorCiiePublico = async (req, res) => {
    try {
        const ciieClave = req.params.ciieClave;
        const ciie = await ciieService.getPorClave(ciieClave);
        if (!ciie) {
            return res.status(404).send('CIIE no encontrado.');
        }
        const cursosLocales = await cursoLocalService.getCursosPorCiieId(ciie._id);
        res.render('pages/curso/cursoLocalListPublico', {
            cursosLocales,
            ciieClave: ciie.clave,
            ciieNombre: ciie.nombre || ciieClave,
            title: `Oferta de Cursos - ${ciie.nombre || ciieClave}`
        });
    } catch (error) {
        console.error('Error al obtener cursos locales públicos:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const getPorCiieDrupal = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        const ciie = await ciieService.getPorId(ciieId);
        const cursosLocales = await cursoLocalService.getCursosPorCiieIdDrupal(ciieId);
        //console.log('Cursos locales obtenidos para CIIE Clave', req.user)
        res.render('pages/curso/cursoLocalListDrupal', { 
            cursosLocales,
            cargo: [],
            user: req.user,
            ciieClave: ciie.clave,
            esVistaInstitucional: true,
            title: "Cursos Locales Vinculados" 
        });
    } catch (error) {
        console.error('Error al obtener cursos locales:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const getCursosPorCiieId = async (req, res) => {
    try {
        const ciieId = req.user.referenciaId;
        console.log('Obteniendo cursos locales para CIIE ID:', ciieId);
        const cursosLocales = await cursoLocalService.getCursosPorCiieId(ciieId);
        console.log('Cursos locales obtenidos para CIIE ID', ciieId, cursosLocales);
        
        res.render('pages/curso/cursoListTodos', { //vista pendiente
            cursosLocales, 
            user: req.user,
            title: `Cursos Locales Vinculados al ID Oficial ${ciieId}` 
        });
    } catch (error) {
        console.error('Error al obtener cursos por ID oficial:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const getCursosPorCargoClaveCiieClave = async (req, res) => {
    
    try {
        //const ciieId = req.user.referenciaId;
        const {cargoClave, ciieClave} = req.params
        const {cursosLocales, cargo} = await cursoLocalService.getPorCursoClaveCiieClave(cargoClave, ciieClave);
        
        res.render('pages/curso/cursoLocalList', {
            ciieClave,     // Para mostrar en el título o breadcrumb
            cargo,         // Objeto único
            cursosLocales, // Array para el forEach
            user: req.user,
            esVistaInstitucional: false
        });
        
    } catch (error) {
        console.error('Error al obtener cursos por ID oficial:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const viewFormAltaPorCargoClaveCiieClave = async (req, res) => {
    try {
        //const ciieId = req.user.referenciaId;
        const {cargoClave, ciieClave} = req.params
        const {cursosLocales, cargo} = await cursoLocalService.getPorCursoClaveCiieClave(cargoClave, ciieClave);
        
        res.render('pages/curso/cursoLocalForm', {
            cargo,         // Objeto único
            cursosLocales, // Array para el forEach
            user: req.user
        });
    } catch (error) {
        console.error('Error al obtener cursos por ID oficial:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
}

const getFlyerCurso = async (req, res) => {
    try {
        const curso = await cursoLocalService.getPorIdOfertaOficial(req.params.ofertaId);
        console.log('Curso obtenido para flyer:', curso);
        if (!curso) {
            req.flash('error', 'Curso no encontrado.');
            return res.redirect('back');
        }

        const vistas = {
            'Extensión CIIE':           'pages/flyer/flyerExtension',
            'Taller en Servicio':       'pages/flyer/flyerTaller',
            'Taller Fuera de Servicio': 'pages/flyer/flyerTaller',
            'Seminario':                'pages/flyer/flyerSeminario',
            'MADP + Ateneo':            'pages/flyer/flyerMadp',
            'Ateneo Distancia':         'pages/flyer/flyerMadp',
            'Curso Distancia':          'pages/flyer/flyerOtros',
            'Seminario Distancia':      'pages/flyer/flyerSeminario',
        };

        const vista = vistas[curso.dispositivo] || 'pages/flyer/flyerOtros';

        res.render(vista, { curso, user: req.user, bare: req.query.bare === 'true' });

    } catch (error) {
        console.error('Error al generar flyer:', error);
        res.status(500).send('Error al generar el flyer.');
    }
};

const getFlyersList = async (req, res) => {
    try {
        const ciieId = req.user?.referenciaId;
        const itinerariosDisponibles = await cursoLocalService.getItinerariosParaFlyers(ciieId);

        // Si no viene un año/itinerario válido por query, usar el más alto disponible
        let seleccion = null;
        const anioQuery = Number(req.query.anio);
        const itinerarioQuery = Number(req.query.itinerario);
        if (Number.isFinite(anioQuery) && Number.isFinite(itinerarioQuery)) {
            const existe = itinerariosDisponibles.some(i => i.anio === anioQuery && i.itinerario === itinerarioQuery);
            if (existe) seleccion = { anio: anioQuery, itinerario: itinerarioQuery };
        }
        if (!seleccion && itinerariosDisponibles.length > 0) {
            const ultimo = itinerariosDisponibles.reduce((mejor, actual) => {
                if (!mejor) return actual;
                if (actual.anio !== mejor.anio) return actual.anio > mejor.anio ? actual : mejor;
                return actual.itinerario > mejor.itinerario ? actual : mejor;
            }, null);
            seleccion = { anio: ultimo.anio, itinerario: ultimo.itinerario };
        }

        const cursosDelItinerario = seleccion
            ? await cursoLocalService.getCursosDelItinerarioParaFlyers(ciieId, seleccion.anio, seleccion.itinerario)
            : [];

        // El desplegable de áreas siempre muestra TODAS las áreas del itinerario,
        // sin importar qué otro filtro (estado/nivel/dispositivo/área) esté aplicado.
        const areasDisponibles = [...new Set(cursosDelItinerario.map(c => c.cargoId?.areaId?.nombre).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'es'));
        const nivelesDisponibles = [...new Set(cursosDelItinerario.map(c => c.cargoId?.areaId?.nivel).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'es'));
        const estadosDisponibles = ['pendiente', 'vinculado', 'modificacion_pendiente', 'eliminacion_pendiente', 'dormido'];
        const dispositivosDisponibles = [...new Set(cursosDelItinerario.map(c => c.dispositivo).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'es'));

        const filtros = {
            areaNombre: req.query.area || '',
            estado: req.query.estado || '',
            nivel: req.query.nivel || '',
            dispositivo: req.query.dispositivo || ''
        };

        const cursos = cursosDelItinerario.filter(curso =>
            (!filtros.areaNombre || curso.cargoId?.areaId?.nombre === filtros.areaNombre) &&
            (!filtros.estado || curso.estado === filtros.estado) &&
            (!filtros.nivel || curso.cargoId?.areaId?.nivel === filtros.nivel) &&
            (!filtros.dispositivo || curso.dispositivo === filtros.dispositivo)
        );

        // Fecha de inscripción más vieja entre TODOS los cursos del itinerario
        // (sin importar los filtros de estado/nivel/dispositivo/área), para la portada.
        const fechaInscripcionMasVieja = cursosDelItinerario.reduce((min, curso) => {
            if (!curso.fechaInicioInscripcion) return min;
            const fecha = new Date(curso.fechaInicioInscripcion);
            if (isNaN(fecha.getTime())) return min;
            return (!min || fecha < min) ? fecha : min;
        }, null);

        // Estado de publicación en redes (Facebook/Instagram) por curso, para pintar los íconos.
        const estadosPublicacion = cursos.length > 0
            ? await publicacionService.getEstadosPorCursoLocalIds(cursos.map(c => c._id))
            : {};

        res.render('pages/flyer/flyersList', {
            cursos,
            estadosPublicacion,
            filtros,
            seleccion,
            itinerariosDisponibles,
            areasDisponibles,
            nivelesDisponibles,
            estadosDisponibles,
            dispositivosDisponibles,
            fechaInscripcionMasVieja,
            user: req.user,
            title: 'Flyers de Cursos'
        });

    } catch (error) {
        console.error('Error al obtener lista de flyers:', error);
        res.status(500).send('Error al cargar la lista de flyers.');
    }
};

const deleteCurso = async (req, res) => {
    try {
        const cursoLocalId = req.params.id;
        const resultado = await cursoLocalService.deleteCurso(cursoLocalId, req.user);
        
        return res.status(200).json({
            success: true,
            message: resultado.message || 'Curso eliminado correctamente.',
            resultado
        });
    } catch (error) {
        const status = error.statusCode || 500;
        const message = error.message || 'No se pudo eliminar el curso.';
        console.error('Error en deleteCurso:', message);
        return res.status(status).json({
            success: false,
            error: message
        });
    }
};

const getCursoById = async (req, res) => {
    try {
        const cursoLocalId = req.params.id;
        const curso = await cursoLocalService.getCursoById(cursoLocalId);
        //console.log('Curso obtenido por ID:', curso);
        if (!curso) {
            return res.status(404).json({
                success: false,
                error: 'Curso no encontrado'
            });
        }
        
        return res.status(200).json(curso);
    } catch (error) {
        console.error('Error en getCursoById:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message || 'No se pudo obtener el curso.'
        });
    }
};

const getCursoByIdEdit = async (req, res) => {
    try {
        const cursoLocalId = req.params.id;
        const curso = await cursoLocalService.getCursoByIdEdit(cursoLocalId);
        if (!curso) {
            return res.status(404).json({
                success: false,
                error: 'Curso no encontrado'
            });
        }
        
        return res.status(200).json(curso);
    } catch (error) {
        console.error('Error en getCursoById:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message || 'No se pudo obtener el curso.'
        });
    }
};


const getMisCursos = async (req, res) => {
    try {
        // Solo para usuarios de tipo 'agente' (docentes)
        if (req.user.tipoModel !== 'Persona') {
            return res.status(403).render('pages/error', { 
                message: 'Acceso denegado. Esta vista es solo para docentes.' 
            });
        }

        const usuarioId = req.user._id;
        const cursosPersonales = await cursoLocalService.getCursosPorDocente(usuarioId);
        
        res.render('pages/curso/misCursosDocente', {
            cursosPersonales,
            user: req.user,
            title: 'Mis Cursos'
        });
    } catch (error) {
        console.error('Error al obtener mis cursos:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
};

const getEstadisticasCursos = async (req, res) => {
    try {
        const esCiie = req.user.tipo === 'institucion';
        const params = {
            anio: req.query.anio,
            itinerario: req.query.itinerario
        };
        if (esCiie) {
            params.ciieId = req.user.referenciaId;
        } else {
            params.usuarioId = req.user._id;
        }

        const { itinerarios, seleccion, cursos } = await cursoLocalService.getEstadisticasCursos(params);

        const areas = [...new Set(cursos.map(c => c.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
        const dispositivos = [...new Set(cursos.map(c => c.dispositivo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));

        res.render('pages/curso/estadisticasCursos', {
            itinerarios,
            seleccion,
            cursos,
            areas,
            dispositivos,
            esCiie,
            user: req.user,
            title: 'Estadísticas de cursos'
        });
    } catch (error) {
        console.error('Error en getEstadisticasCursos:', error.message);
        res.status(500).send("Error en el servidor: " + error.message);
    }
};

module.exports = {
    vincularCurso,
    getCursosLocales,
    getCursosPorCiieId,
    getCursosPorCargoClaveCiieClave,
    post,
    getPorCiie,
    viewFormAltaPorCargoClaveCiieClave,
    getVincularConSitioOficial,
    getCalificaciones,
    getPlanillaAprobadosItinerario,
    getComunicadoItinerario,
    getTrayectoriaCursantes,
    getCalificacionesPendientes,
    getCalificacionesCursoDetail,
    getCalificacionesDocumentosCurso,
    getCalificacionesDocumentosLote,
    postVincularConSitioOficial,
    postEditarCursoPendiente,
    postCrearYVincularConSitioOficial,
    postEnviarCalificacionesLote,
    postGuardarYEnviarCalificacionesCurso,
    postEnviarCalificacionesCurso,
    postMarcarImpresionDocumentos,
    getFlyerCurso,
    getFlyersList,
    deleteCurso,
    getCursoById,
    putCurso,
    postAprobarCambiosPendientes,
    postRechazarCambiosPendientes,
    getMisCursos,
    getPorCiieDrupal,
    getCursoByIdEdit,
    getPorCiiePublico,
    getEstadisticasCursos,
    getRegistroCursantesMasivo,
    getListaAsistenciaMasiva,
    getSincronizarItinerario,
    getSincronizarItinerarioStream,
    getAcreditacionSeminarios,
    getAcreditacionSeminariosStream,
    postCertificarSeminario
}