const cursoLocalRepo = require('../repos/cursoLocalRepo');
const certificadoExternoRepo = require('../repos/certificadoExternoRepo');
const certificadoExternoService = require('./certificadoExternoService');
const sesionService = require('./sesionService');

class AcreditacionSeminariosService {

    async getSeminarios(ciieId) {
        return await cursoLocalRepo.getSeminariosVinculadosPorCiie(ciieId);
    }

    // Recorre los seminarios del CIIE consultando combinaciones.php uno por uno
    // (solo lectura) y devuelve los que tienen alguna combinación pendiente de
    // certificar. onProgreso(actual, total, curso) se llama en cada paso, para
    // poder emitirlo como evento SSE.
    async generarReporte(ciieId, onProgreso) {
        const seminarios = await this.getSeminarios(ciieId);
        const pendientes = [];

        for (let i = 0; i < seminarios.length; i++) {
            const seminario = seminarios[i];

            try {
                await sesionService.asegurarSesion();
                const html = await certificadoExternoRepo.getCombinaciones(seminario.idOfertaOficial, seminario.idCursoOriginal);
                const estado = certificadoExternoService.parseEstadoCombinaciones(html);

                if (estado.pendientes > 0) {
                    pendientes.push({ curso: seminario, ...estado });
                }

                if (onProgreso) {
                    onProgreso({ actual: i + 1, total: seminarios.length, curso: seminario, ok: true, pendientes: estado.pendientes });
                }
            } catch (error) {
                if (onProgreso) {
                    onProgreso({ actual: i + 1, total: seminarios.length, curso: seminario, ok: false, error: error.message });
                }
            }

            if (i < seminarios.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        }

        return pendientes;
    }

    async certificarUno(idCursoOriginal, aprobados, cantcerti) {
        await sesionService.asegurarSesion();
        return await certificadoExternoRepo.certificar(aprobados, cantcerti, idCursoOriginal);
    }
}

module.exports = new AcreditacionSeminariosService();
