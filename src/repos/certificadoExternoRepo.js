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

        const buffer = Buffer.from(response.data);

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