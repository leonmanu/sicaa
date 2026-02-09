// src/repo/inscriptoExternoRepo.js
const client = require('../services/httpClient');
const URLS = require('../config/urls');

class CursoExternoRepo {
    async sincronizarFiltros() {
        const params = 'idciie=65&lim=S&qi=65';
        return await client.get(`${URLS.PROPUESTAS.LISTA}?${params}`, {
            headers: { 'Referer': URLS.PROPUESTAS.REFERER_ORIGEN }
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

    async getDetalleCursante(idInscripcionOficial) {
        const url = `${URLS.CURSANTE.DATOS}id=${idInscripcionOficial}&quees=M&qi=65`;
        
        // Obtenemos el HTML puro de la página
        const html = await client.get(url, {
            headers: { 'Referer': URLS.INSCRIPTOS.LISTA }
        });

        return html; // Devolvemos el string del HTML para procesarlo
    }
}

module.exports = new CursoExternoRepo();