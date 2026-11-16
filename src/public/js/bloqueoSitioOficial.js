// Bloqueo de pantalla mientras SICAA espera al sitio oficial (ABC).
//
// Se carga en todas las páginas (partials/scripts.ejs) y actúa solo: intercepta los pedidos
// fetch, jQuery.ajax y EventSource cuyo destino está en RUTAS_ABC, y mientras esperan
//   - tapa la pantalla con un cartel que no se puede cerrar, y
//   - pide confirmación si se intenta recargar, cerrar la pestaña o volver atrás
//     (el navegador muestra su propio aviso: no se puede impedir del todo, pero sí avisar).
// Los enlaces y formularios que abren una página que consulta ABC muestran el cartel
// mientras carga la página siguiente.
//
// Si se agrega una ruta nueva que hable con ABC, sumarla a RUTAS_ABC o a PAGINAS_ABC.
(function () {
    if (window.SitioOficial) return;

    // [método, patrón de la ruta, mensaje]
    const RUTAS_ABC = [
        ['POST', /^\/ciie\/cursos\/nuevo\/vincular$/, 'Vinculando el curso con el sitio oficial...'],
        ['POST', /^\/ciie\/cursos\/nuevo\/(editar|publicar)$/, 'Guardando el curso en el sitio oficial...'],
        ['POST', /^\/curso\/alta$/, 'Guardando el curso en el sitio oficial...'],
        ['PUT', /^\/curso\/[^/]+$/, 'Guardando los cambios del curso (si está vinculado, también en el sitio oficial)...'],
        ['POST', /^\/curso\/[^/]+\/aprobar-cambios$/, 'Aplicando los cambios en el sitio oficial...'],
        ['GET', /^\/curso\/[^/]+\/abc$/, 'Consultando la oferta en el sitio oficial...'],
        ['GET', /^\/editor\/[^/]+\/[^/]+\/comparar$/, 'Comparando con el sitio oficial...'],
        ['POST', /^\/ciie\/calificaciones\/(enviar-lote|[^/]+\/enviar|[^/]+\/enviar-directo)$/, 'Enviando calificaciones al sitio oficial...'],
        ['POST', /^\/(agente\/)?cursante\/calificar$/, 'Enviando la nota al sitio oficial...'],
        ['GET', /^\/agente\/inscriptosExternos\/curso\/[^/]+\/consultar$/, 'Consultando los inscriptos en el sitio oficial...'],
        ['POST', /^\/agente\/inscriptos\/guardar$/, 'Trayendo los datos de cada inscripto desde el sitio oficial. Puede tardar varios minutos...'],
        ['POST', /^\/inscripto\/curso\/[^/]+\/alta-manual$/, 'Inscribiendo en el sitio oficial...'],
        ['POST', /^\/cursoBase\/sincronizar$/, 'Sincronizando cursos base con el sitio oficial...'],
        ['POST', /^\/ciie\/acreditacion-seminarios\/certificar$/, 'Certificando en el sitio oficial...'],
        ['GET', /^\/ciie\/acreditacion-seminarios\/stream$/, 'Consultando seminarios en el sitio oficial...'],
        ['GET', /^\/ciie\/itinerario\/sincronizar-stream$/, 'Sincronizando inscriptos con el sitio oficial...']
    ];

    // Páginas que, al abrirse, consultan ABC antes de mostrarse.
    const PAGINAS_ABC = [
        /^\/ciie\/cursos\/nuevo$/,
        /^\/ciie\/curso\/externo$/,
        /^\/ciie\/calificaciones\/documentos$/,
        /^\/ciie\/calificaciones\/[^/]+\/documentos$/,
        /^\/certificado\/externo\/[^/]+$/,
        /^\/cursoBase\/getNuevosaBC$/,
        /^\/(curso|propuesta)\/lista$/,
        /^\/(agente\/)?(cursante\/)?inscriptos\/[^/]+$/
    ];

    const rutaDe = (url) => {
        try {
            const u = new URL(url, location.href);
            return u.origin === location.origin ? u.pathname : null;
        } catch (e) {
            return null;
        }
    };

    const mensajeDe = (metodo, url) => {
        const ruta = rutaDe(url);
        if (!ruta) return null;
        const m = String(metodo || 'GET').toUpperCase();
        const regla = RUTAS_ABC.find(([met, patron]) => met === m && patron.test(ruta));
        return regla ? regla[2] : null;
    };

    const esPaginaAbc = (url) => {
        const ruta = rutaDe(url);
        return Boolean(ruta && PAGINAS_ABC.some(p => p.test(ruta)));
    };

    // ── Cartel ───────────────────────────────────────────────────────────────
    // z-index 1058: por encima de los modales de Bootstrap (1055) y por debajo de
    // SweetAlert (1060), así los avisos de progreso o resultado de cada página se ven encima.
    const estilo = document.createElement('style');
    estilo.textContent = `
        #bloqueo-sitio-oficial { position: fixed; inset: 0; z-index: 1058; display: none;
            align-items: center; justify-content: center; padding: 16px;
            background: rgba(15, 23, 42, .55); cursor: wait; }
        #bloqueo-sitio-oficial.activo { display: flex; }
        #bloqueo-sitio-oficial .caja { background: #fff; color: #212529; border-radius: .75rem;
            max-width: 420px; width: 100%; padding: 1.5rem; text-align: center;
            box-shadow: 0 .5rem 2rem rgba(0,0,0,.3); }
        #bloqueo-sitio-oficial .mensaje { margin: 1rem 0 .5rem; font-weight: 600; }
        #bloqueo-sitio-oficial .aviso { color: #6c757d; font-size: .875rem; }`;

    let overlay = null;
    const asegurarOverlay = () => {
        if (overlay) return overlay;
        document.head.appendChild(estilo);
        overlay = document.createElement('div');
        overlay.id = 'bloqueo-sitio-oficial';
        overlay.setAttribute('role', 'alertdialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-live', 'assertive');
        overlay.innerHTML = `
            <div class="caja">
                <div class="spinner-border text-primary" role="status"></div>
                <div class="mensaje"></div>
                <div class="aviso">No cierres, recargues ni vuelvas atrás hasta que termine.</div>
            </div>`;
        // El cartel se traga clics y teclas para que no se pueda tocar nada de abajo.
        ['click', 'mousedown', 'keydown', 'touchstart'].forEach(ev =>
            overlay.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); }, true));
        document.body.appendChild(overlay);
        return overlay;
    };

    // ── Estado: puede haber más de un pedido esperando a la vez ─────────────
    const activos = [];        // mensajes de los pedidos en curso
    let navegando = false;     // la página se está yendo a propósito (enlace o formulario)

    const alSalir = (e) => {
        if (!activos.length) return;
        e.preventDefault();
        e.returnValue = ''; // el navegador muestra su propio texto
        return '';
    };

    const pintar = () => {
        const visible = activos.length > 0 || navegando;
        if (!visible) {
            if (overlay) overlay.classList.remove('activo');
            return;
        }
        const el = asegurarOverlay();
        el.querySelector('.mensaje').textContent = activos[activos.length - 1] || 'Consultando el sitio oficial...';
        el.querySelector('.aviso').style.display = activos.length ? '' : 'none';
        el.classList.add('activo');
        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur(); // que Enter no vuelva a disparar el botón
        }
    };

    // Bloquea hasta que se llame a la función que devuelve (se puede llamar más de una vez).
    const bloquear = (mensaje) => {
        const item = mensaje || 'Comunicándose con el sitio oficial...';
        activos.push(item);
        if (activos.length === 1) window.addEventListener('beforeunload', alSalir);
        pintar();
        let liberado = false;
        return () => {
            if (liberado) return;
            liberado = true;
            const i = activos.indexOf(item);
            if (i >= 0) activos.splice(i, 1);
            if (!activos.length) window.removeEventListener('beforeunload', alSalir);
            pintar();
        };
    };

    window.SitioOficial = { bloquear, mensajeDe };

    // ── fetch ────────────────────────────────────────────────────────────────
    if (window.fetch) {
        const fetchOriginal = window.fetch.bind(window);
        window.fetch = function (input, init) {
            const url = typeof input === 'string' ? input : (input && input.url);
            const metodo = (init && init.method) || (input && typeof input === 'object' && input.method) || 'GET';
            const mensaje = mensajeDe(metodo, url);
            if (!mensaje) return fetchOriginal(input, init);

            const liberar = bloquear(mensaje);
            return fetchOriginal(input, init).then(response => {
                const tipo = response.headers.get('Content-Type') || '';
                const esStream = /x-ndjson|event-stream/.test(tipo) && response.body;
                if (!esStream) {
                    liberar();
                    return response;
                }
                // Respuesta que va llegando de a partes (avance en vivo): se mantiene el bloqueo
                // hasta que el servidor termina de mandar, no solo hasta que empieza.
                const reader = response.body.getReader();
                const cuerpo = new ReadableStream({
                    async pull(controller) {
                        try {
                            const { value, done } = await reader.read();
                            if (done) { liberar(); controller.close(); return; }
                            controller.enqueue(value);
                        } catch (error) {
                            liberar();
                            controller.error(error);
                        }
                    },
                    cancel(motivo) { liberar(); return reader.cancel(motivo); }
                });
                return new Response(cuerpo, { status: response.status, statusText: response.statusText, headers: response.headers });
            }, error => {
                liberar();
                throw error;
            });
        };
    }

    // ── jQuery.ajax ($.get, $.post, $.ajax) ─────────────────────────────────
    // El prefiltro corre antes de que se registren los callbacks success/error de la página,
    // así el bloqueo se libera antes de que la página muestre el resultado o recargue.
    if (window.jQuery) {
        window.jQuery.ajaxPrefilter((opciones, originales, jqXHR) => {
            const mensaje = mensajeDe(opciones.type || opciones.method, opciones.url);
            if (!mensaje) return;
            const liberar = bloquear(mensaje);
            jqXHR.always(liberar);
        });
    }

    // ── EventSource (avance en vivo de sincronizaciones) ────────────────────
    if (window.EventSource) {
        const EventSourceOriginal = window.EventSource;
        window.EventSource = function (url, config) {
            const es = new EventSourceOriginal(url, config);
            const mensaje = mensajeDe('GET', url);
            if (mensaje) {
                const liberar = bloquear(mensaje);
                const cerrar = es.close.bind(es);
                es.close = () => { liberar(); cerrar(); };
            }
            return es;
        };
        window.EventSource.prototype = EventSourceOriginal.prototype;
        ['CONNECTING', 'OPEN', 'CLOSED'].forEach(k => { window.EventSource[k] = EventSourceOriginal[k]; });
    }

    // ── Enlaces y formularios que abren páginas que consultan ABC ───────────
    const mostrarNavegacion = () => {
        navegando = true;
        pintar();
    };

    document.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest && e.target.closest('a[href]');
        if (!a || a.hasAttribute('download')) return;
        if (a.target && a.target !== '_self') return; // se abre en otra pestaña
        if (esPaginaAbc(a.href)) mostrarNavegacion();
    });

    document.addEventListener('submit', (e) => {
        if (e.defaultPrevented) return;
        const form = e.target;
        if (form.target && form.target !== '_self') return;
        const metodo = (form.getAttribute('method') || 'GET').toUpperCase();
        const accion = form.getAttribute('action') || location.href;
        const mensaje = mensajeDe(metodo, accion);
        if (mensaje) {
            bloquear(mensaje); // no se libera: la página se va; lo limpia pageshow si se vuelve
            window.removeEventListener('beforeunload', alSalir); // es la navegación buscada
        } else if (metodo === 'GET' && esPaginaAbc(accion)) {
            mostrarNavegacion();
        }
    });

    // Mientras el cartel está puesto, el teclado no puede activar nada de la página de abajo
    // (Tab, Enter, Espacio). Sí funciona dentro de los avisos de SweetAlert, que van encima.
    document.addEventListener('keydown', (e) => {
        if (!overlay || !overlay.classList.contains('activo')) return;
        if (e.target.closest && e.target.closest('.swal2-container')) return;
        if (['Tab', 'Enter', ' ', 'Spacebar'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    // Si se vuelve con "Atrás" y el navegador restaura la página desde su caché,
    // el cartel quedaría puesto: se limpia.
    window.addEventListener('pageshow', (e) => {
        if (!e.persisted) return;
        navegando = false;
        activos.length = 0;
        window.removeEventListener('beforeunload', alSalir);
        pintar();
    });
})();
