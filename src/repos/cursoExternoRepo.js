// src/repositories/cursoExternoRepo.js
const sesionService = require('../services/sesionService');
const URLS = require('../config/urls');

class CursoExternoRepo {

    // ─── Sesión ───────────────────────────────────────────────────────────────

    async sincronizarFiltros() {
        const { client, qi } = await sesionService.contexto();
        return await client.get(`${URLS.PROPUESTAS.LISTA}?idciie=${qi}&lim=S&qi=${qi}`, {
            headers: { 'Referer': URLS.PROPUESTAS.REFERER_ORIGEN }
        });
    }

    // Prepara la sesión PHP para dar de alta una oferta de un curso específico.
    // El PHP de ABC guarda idcurso en $_SESSION al visitar ofertas.php,
    // y am.php inicializa el formulario usando ese valor de sesión.
    async prepararSesionParaAlta(idCursoOriginal) {
        const { client, qi } = await sesionService.contexto();
        await client.get(`${URLS.BASE_URL}/propuestas/ofertas.php`, {
            params: { id: idCursoOriginal, quees: 'M', qi },
            headers: { 'Referer': `${URLS.BASE_URL}/propuestas/tabla.php?idciie=${qi}&lim=S&qi=${qi}` }
        });
        await client.get(`${URLS.BASE_URL}/propuestas/am.php`, {
            params: { quees: 'A', qi },
            headers: { 'Referer': `${URLS.BASE_URL}/propuestas/ofertas.php?id=${idCursoOriginal}&quees=M&qi=${qi}` }
        });
    }

    // Prepara la sesión PHP para editar una oferta ya publicada.
    // Misma navegación que hace el sitio: desde misofertas.php se entra directo a am.php con el id real.
    // Devuelve el HTML del formulario: trae los valores actuales (inicioa/fina, etc.)
    // tal como los tiene ABC, que no siempre coinciden con lo que guardamos en Mongo.
    async prepararSesionParaEdicion(idOfertaOficial) {
        const { client, qi } = await sesionService.contexto();
        const response = await client.get(`${URLS.BASE_URL}/propuestas/am.php`, {
            params: { id: idOfertaOficial, volver: 'misofertas.php', quees: 'M', qi },
            headers: { 'Referer': `${URLS.BASE_URL}/propuestas/misofertas.php?qi=${qi}` }
        });
        return response?.data;
    }

    // ─── Consultas ────────────────────────────────────────────────────────────

    async getRawCursos() {
        const { client, qi } = await sesionService.contexto();
        const urlFiltro = `${URLS.PROPUESTAS.LISTA}?idciie=${qi}&lim=S&qi=${qi}`;
        return await client.get(URLS.PROPUESTAS.DATOS, {
            params: {
                qi,
                sEcho: 1,
                iDisplayStart: 0,
                iDisplayLength: -1
            },
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': urlFiltro,
                'Accept': 'application/json, text/javascript, */*; q=0.01'
            }
        });
    }

    async getRawCursosTodos() {
        const { client, qi } = await sesionService.contexto();
        const url = URLS.PROPUESTAS_TODAS.LISTA + `?idciie=${qi}&lim=S&qi=${qi}`;
        return await client.get(url, {
            headers: { 'Referer': URLS.PROPUESTAS_TODAS.REFERER_ORIGEN }
        });
    }

    // ─── Alta oferta oficial ──────────────────────────────────────────────────

    async crearOfertaOficial(payload) {
        const { client, qi } = await sesionService.contexto();
        return await client.post(URLS.PROPUESTAS.ACTUALIZA, payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': `${URLS.BASE_URL}/propuestas/am.php?quees=A&qi=${qi}`
            }
        });
    }

    // ─── Edición de oferta oficial ya publicada ──────────────────────────────

    async editarOfertaOficial(payload, idOfertaOficial) {
        const { client, qi } = await sesionService.contexto();
        return await client.post(URLS.PROPUESTAS.ACTUALIZA, payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': `${URLS.BASE_URL}/propuestas/am.php?id=${idOfertaOficial}&volver=misofertas.php&quees=M&qi=${qi}`
            }
        });
    }

    async getOfertasDelCursoActivo() {
        const { client, qi } = await sesionService.contexto();
        return await client.get(`${URLS.BASE_URL}/propuestas/datosofertas.php`, {
            params: { qi, sEcho: 1, iDisplayStart: 0, iDisplayLength: 5 }
        });
    }
}

module.exports = new CursoExternoRepo();
