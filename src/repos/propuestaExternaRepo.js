// src/repositories/cursoRepository.js
const sesionService = require('../services/sesionService');
const URLS = require('../config/urls');

class PropuestaExternaRepo {
    async sincronizarFiltros() {
        const { client, qi } = await sesionService.contexto();
        const params = `idciie=${qi}&lim=S&qi=${qi}`;
        return await client.get(`${URLS.PROPUESTAS.LISTA}?${params}`, {
            headers: { 'Referer': URLS.PROPUESTAS.REFERER_ORIGEN }
        });
    }

    async getRawCursosTodos() {
        const { client, qi } = await sesionService.contexto();
        const url =  URLS.PROPUESTAS_TODAS.LISTA + `?idciie=${qi}&lim=S&qi=${qi}`;
        return await client.get(url, {
            headers: { 'Referer': URLS.PROPUESTAS_TODAS.REFERER_ORIGEN }
        });
    }

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
}

module.exports = new PropuestaExternaRepo();
