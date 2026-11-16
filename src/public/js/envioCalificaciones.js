// Envía las notas de un curso a ABC y va informando el avance.
// El servidor responde una línea JSON por evento (ver responderEnvioConProgreso en cursoLocalController).
// onProgreso({ actual, total }) se llama con cada nota enviada.
// Devuelve { enviados, area } o lanza un Error; si el corte fue a mitad de camino,
// el error trae .enviados y .total.
async function enviarCalificacionesConProgreso(url, body, onProgreso) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    });

    const tipo = response.headers.get('Content-Type') || '';
    if (!tipo.includes('application/x-ndjson') || !response.body) {
        // Respuesta inesperada (por ejemplo, la sesión de SICAA venció y vino el login).
        throw new Error(`El servidor respondió algo inesperado (HTTP ${response.status}). Recargá la página e intentá de nuevo.`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let ultimo = { actual: 0, total: null };
    let final = null;

    const procesarLinea = (linea) => {
        if (!linea.trim()) return;
        const msg = JSON.parse(linea);
        if (msg.tipo === 'progreso') {
            ultimo = { actual: msg.actual, total: msg.total };
            onProgreso(ultimo);
        } else {
            final = msg;
        }
    };

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let corte;
            while ((corte = buffer.indexOf('\n')) >= 0) {
                procesarLinea(buffer.slice(0, corte));
                buffer = buffer.slice(corte + 1);
            }
        }
        procesarLinea(buffer);
    } catch (error) {
        final = null; // se cortó la conexión mientras se leía
    }

    if (!final) {
        const err = new Error(ultimo.total
            ? `Se cortó la conexión después de enviar ${ultimo.actual} de ${ultimo.total} notas.`
            : 'Se cortó la conexión antes de empezar a enviar.');
        err.enviados = ultimo.actual;
        err.total = ultimo.total;
        throw err;
    }
    if (final.tipo === 'error') {
        const err = new Error(final.error || 'No se pudieron enviar las calificaciones.');
        err.enviados = final.enviados;
        err.total = final.total;
        throw err;
    }
    return final.resultado;
}

// HTML del avance para mostrar dentro de un SweetAlert.
function htmlAvanceCalificaciones({ encabezado = '', actual = 0, total = null }) {
    const porcentaje = total ? Math.round((actual / total) * 100) : 0;
    const texto = total == null
        ? 'Preparando...'
        : `Nota <b>${actual}</b> de <b>${total}</b>`;
    return `
        ${encabezado ? `<div class="mb-2">${encabezado}</div>` : ''}
        <div class="mb-2">${texto}</div>
        <div class="progress" style="height: 1.25rem;">
            <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                 style="width: ${porcentaje}%;" aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100">
                ${porcentaje}%
            </div>
        </div>
        <small class="text-muted d-block mt-2">No cierres ni recargues la página hasta que termine.</small>`;
}
