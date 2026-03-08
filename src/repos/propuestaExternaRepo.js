// src/repositories/cursoRepository.js
const client = require('../services/httpClient');
const URLS = require('../config/urls');

class PropuestaExternaRepo {
    async sincronizarFiltros() {
        const params = 'idciie=65&lim=S&qi=65';
        return await client.get(`${URLS.PROPUESTAS.LISTA}?${params}`, {
            headers: { 'Referer': URLS.PROPUESTAS.REFERER_ORIGEN }
        });
    }

    async getRawCursosTodos() {
        const url =  URLS.PROPUESTAS_TODAS.LISTA + '?idciie=65&lim=S&qi=65';
        return await client.get(url, {
            headers: { 'Referer': URLS.PROPUESTAS_TODAS.REFERER_ORIGEN }
        });
    }

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
}

module.exports = new PropuestaExternaRepo();




