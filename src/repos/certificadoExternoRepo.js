const { PdfReader } = require('pdfreader');
const client = require('../services/httpClient');

class CertificadoExternoRepo {

    async getDatosAdministrativosPdf(idOfertaOficial) {
        const response = await client.post(
            'https://formacionpermanente.abc.gob.ar/inscripcion/propuestas/pdf.php',
            new URLSearchParams({
                idfechaciie: idOfertaOficial,
                ambos: 'Certificados/Actas'
            }),
            { responseType: 'arraybuffer' }
        );

        return this._extraerTextoPdf(response.data);
    }

    // Página previa que calcula, del lado del sitio oficial, qué docentes están
    // en condiciones de certificar el seminario (cruza con experiencias CIIE de
    // otros CIIE que nosotros no vemos). De ahí sacamos el "aprobados" para pdf1.php.
    async getCombinaciones(idOfertaOficial, idCursoOriginal) {
        const url = `https://formacionpermanente.abc.gob.ar/inscripcion/propuestas/combinaciones.php?id=${idOfertaOficial}&volver=misofertas.php&idcurso=${idCursoOriginal}&qi=65`;
        const response = await client.get(url);
        return response.data;
    }

    async getDatosAdministrativosPdfSeminario(idaprobados, idOfertaOficial) {
        const response = await client.post(
            `https://formacionpermanente.abc.gob.ar/inscripcion/propuestas/pdf1.php?idaprobados=${encodeURIComponent(idaprobados)}`,
            new URLSearchParams({
                aprobados: idaprobados,
                idfechaciie: idOfertaOficial,
                ambos: 'Certificados/Actas'
            }),
            { responseType: 'arraybuffer' }
        );

        const datos = await this._extraerTextoPdf(response.data);
        console.log('respuestas: ', datos);
        return datos;
    }

    _extraerTextoPdf(data) {
        const buffer = Buffer.from(data);

        return new Promise((resolve, reject) => {
            const textoCompleto = [];
            new PdfReader().parseBuffer(buffer, (err, item) => {
                if (err) return reject(err);
                if (!item) return resolve(textoCompleto.join(' '));
                if (item.text) textoCompleto.push(item.text);
            });
        });
    }
}

module.exports = new CertificadoExternoRepo();