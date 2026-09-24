// src/repositories/cursoRepository.js
const sesionService = require('../services/sesionService');
const URLS = require('../config/urls');

class cursoBaseExternoRepo {
    async sincronizarFiltros() {
        const { client, qi } = await sesionService.contexto();
        const params = `idciie=${qi}&lim=S&qi=${qi}`;
        return await client.get(`${URLS.PROPUESTASBASE.LISTA}?${params}`, {
            headers: { 'Referer': URLS.PROPUESTASBASE.REFERER_ORIGEN }
        });
    }

    async getRawCursosTodos() {
        const { client, qi } = await sesionService.contexto();
        const url =  URLS.PROPUESTASBASE.LISTA + `?idciie=${qi}&lim=S&qi=${qi}`;
        return await client.get(url, {
            headers: { 'Referer': URLS.PROPUESTASBASE.REFERER_ORIGEN }
        });
    }

     async getRaw() {
            const { client, qi } = await sesionService.contexto();
            const urlFiltro = `${URLS.PROPUESTASBASE.LISTA}?idciie=${qi}&lim=S&qi=${qi}`;
            return await client.get(URLS.PROPUESTASBASE.DATOS, {
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

module.exports = new cursoBaseExternoRepo();
