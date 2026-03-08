// src/repositories/cursoRepository.js
const client = require('../services/httpClient');
const URLS = require('../config/urls');

class cursoBaseExternoRepo {
    async sincronizarFiltros() {
        const params = 'idciie=65&lim=S&qi=65';
        return await client.get(`${URLS.PROPUESTASBASE.LISTA}?${params}`, {
            headers: { 'Referer': URLS.PROPUESTASBASE.REFERER_ORIGEN }
        });
    }

    async getRawCursosTodos() {
        const url =  URLS.PROPUESTASBASE.LISTA + '?idciie=65&lim=S&qi=65';
        return await client.get(url, {
            headers: { 'Referer': URLS.PROPUESTASBASE.REFERER_ORIGEN }
        });
    }

     async getRaw() {
            const urlFiltro = `${URLS.PROPUESTASBASE.LISTA}?idciie=65&lim=S&qi=65`;
            return await client.get(URLS.PROPUESTASBASE.DATOS, {
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
}

module.exports = new cursoBaseExternoRepo();




