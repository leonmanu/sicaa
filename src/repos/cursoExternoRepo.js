// src/repositories/cursoExternoRepo.js
const client = require('../services/httpClient');
const URLS = require('../config/urls');

class CursoExternoRepo {

    // ─── Sesión ───────────────────────────────────────────────────────────────

    async sincronizarFiltros() {
        return await client.get(`${URLS.PROPUESTAS.LISTA}?idciie=65&lim=S&qi=65`, {
            headers: { 'Referer': URLS.PROPUESTAS.REFERER_ORIGEN }
        });
    }

    // Prepara la sesión PHP para dar de alta una oferta de un curso específico.
    // El PHP de ABC guarda idcurso en $_SESSION al visitar ofertas.php,
    // y am.php inicializa el formulario usando ese valor de sesión.
    async prepararSesionParaAlta(idCursoOriginal) {
        await client.get(`${URLS.BASE_URL}/propuestas/ofertas.php`, {
            params: { id: idCursoOriginal, quees: 'M', qi: '65' },
            headers: { 'Referer': `${URLS.BASE_URL}/propuestas/tabla.php?idciie=65&lim=S&qi=65` }
        });
        await client.get(`${URLS.BASE_URL}/propuestas/am.php`, {
            params: { quees: 'A', qi: '65' },
            headers: { 'Referer': `${URLS.BASE_URL}/propuestas/ofertas.php?id=${idCursoOriginal}&quees=M&qi=65` }
        });
    }

    // ─── Consultas ────────────────────────────────────────────────────────────

    async getRawCursos() {
        const urlFiltro = `${URLS.PROPUESTAS.LISTA}?idciie=65&lim=S&qi=65`;
        return await client.get(URLS.PROPUESTAS.DATOS, {
            params: {
                qi: '65',
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
        const url = URLS.PROPUESTAS_TODAS.LISTA + '?idciie=65&lim=S&qi=65';
        return await client.get(url, {
            headers: { 'Referer': URLS.PROPUESTAS_TODAS.REFERER_ORIGEN }
        });
    }

    // ─── Alta oferta oficial ──────────────────────────────────────────────────

    async crearOfertaOficial(payload) {
        return await client.post(URLS.PROPUESTAS.ACTUALIZA, payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': `${URLS.BASE_URL}/propuestas/am.php?quees=A&qi=65`
            }
        });
    }

    async getOfertasDelCursoActivo() {
        return await client.get(`${URLS.BASE_URL}/propuestas/datosofertas.php`, {
            params: { qi: '65', sEcho: 1, iDisplayStart: 0, iDisplayLength: 5 }
        });
    }
}

module.exports = new CursoExternoRepo();
