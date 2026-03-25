const certificadoExternoRepository = require('../repos/certificadoExternoRepo');

class CertificadoExternoService {
    async obtenerCertificado(idOfertaOficial) {
        try {
            const rawText = await certificadoExternoRepository.getDatosAdministrativosPdf(idOfertaOficial);
            return {
                rawText,
                parsed: this._parseDatosAdministrativos(rawText)
            };
        } catch (error) {
            console.error(`Error al obtener el certificado para la oferta ${idOfertaOficial}:`, error);
            throw new Error('No se pudo obtener el certificado externo');
        }
    }

    _parseDatosAdministrativos(texto = '') {
        const text = this._normalizeText(texto);
        return {
            metadatos: {
                resolucion: this._matchFirst(text, /Resoluci[oó]n\s*(?:N[°º]\s*)?[:]?\s*([0-9]{1,5}\/[0-9]{2})/i),
                proyecto: this._matchFirst(text, /Proyecto\s*(?:N[°º]\s*)?[:]?\s*([0-9]{1,5}\/[0-9]{2}(?:\s*[A-Z]{1,4})?)/i),
                dictamen: this._matchFirst(text, /Dictamen\s*(?:N[°º]\s*)?[:]?\s*([0-9]{1,8})/i),
                puntaje: this._matchFirst(text, /Puntaje\s*[:]?\s*([0-9]+(?:[\.,][0-9]+)?)/i),
                horas: this._matchFirst(text, /Horas\s*[:]?\s*([0-9]{1,4})/i)
                    || this._matchFirst(text, /carga horaria de\s*([0-9]{1,4})\s*hs/i)
            },
            propuesta: this._matchFirst(text, /propuesta formativa:\s*(.+?)\s+Proyecto\s*(?:N[°º])?/i),
            certificados: this._parseCertificados(text),
            acta: this._parseActa(text)
        };
    }

    _parseCertificados(text) {
        const regex = /Se deja constancia que\s+(.+?)\s+DNI:\s*([0-9]{7,9})\s+curs[oó]\s+y\s+aprob[oó]/gi;
        const out = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            out.push({
                nombreCompleto: this._cleanToken(match[1]),
                dni: this._cleanToken(match[2]),
                resultado: 'Aprobado'
            });
        }
        return out;
    }

    _parseActa(text) {
        const indexActa = text.search(/ACTA VOLANTE DE CAPACITANDOS EVALUADOS/i);
        if (indexActa < 0) {
            return {
                encabezado: {},
                filas: []
            };
        }

        const actaText = text.slice(indexActa);
        const encabezado = {
            region: this._matchFirst(actaText, /Regi[oó]n\s*[:]?\s*([0-9]+)/i),
            ciie: this._matchFirst(actaText, /CIIE\s+(.+?)\s+Curso\s*:/i),
            curso: this._matchFirst(actaText, /Curso\s*:\s*'?(.+?)'?\s+Área\s*:/i),
            area: this._matchFirst(actaText, /Área\s*:\s*(.+?)\s+Resoluci[oó]n\s*:/i),
            resolucion: this._matchFirst(actaText, /Resoluci[oó]n\s*:\s*([0-9]{1,5}\/[0-9]{2})/i),
            proyecto: this._matchFirst(actaText, /Proyecto\s*:\s*([0-9]{1,5}\/[0-9]{2}(?:\s*[A-Z]{1,4})?)/i),
            dictamen: this._matchFirst(actaText, /Dictamen\s*:\s*([0-9]{1,8})/i),
            puntaje: this._matchFirst(actaText, /Puntaje\s*:\s*([0-9]+(?:[\.,][0-9]+)?)/i),
            horas: this._matchFirst(actaText, /Horas\s*:\s*([0-9]{1,4})/i),
            formador: this._matchFirst(actaText, /Nombre del\/?la Formador\/?a\s*:\s*(.+?)\s+Fecha de Inicio\s*:/i),
            fechaInicio: this._matchFirst(actaText, /Fecha de Inicio\s*:\s*([0-9]{2}-[0-9]{2}-[0-9]{4})/i),
            fechaFinalizacion: this._matchFirst(actaText, /Fecha de Finalizaci[oó]n\s*:\s*([0-9]{2}-[0-9]{2}-[0-9]{4})/i)
        };

        const filas = [];
        const rowRegex = /\b([0-9]{1,3})\s+(.+?)\s+([0-9]{7,9})\s+(Aprob[oó]|Aprobado|Ausente|Desaprob[oó]|Desaprobado)\b/gi;
        let rowMatch;
        while ((rowMatch = rowRegex.exec(actaText)) !== null) {
            filas.push({
                orden: Number(rowMatch[1]),
                nombreCompleto: this._cleanToken(rowMatch[2]),
                dni: this._cleanToken(rowMatch[3]),
                resultado: this._cleanToken(rowMatch[4])
            });
        }

        return { encabezado, filas };
    }

    _normalizeText(value) {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    _matchFirst(text, regex) {
        const match = text.match(regex);
        return match ? this._cleanToken(match[1]) : undefined;
    }

    _cleanToken(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

}

module.exports = new CertificadoExternoService();