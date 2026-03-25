const certificadoExternoService = require('../services/certificadoExternoService')

const getCertificadoExterno = async (req, res) => {
    try {
        const { idOfertaOficial } = req.params
        const certificadoData = await certificadoExternoService.obtenerCertificado(idOfertaOficial);
        res.json({ success: true, data: certificadoData });
    } catch (error) {
        console.error('Error en certificadoExternoController:', error);
        res.status(500).json({ success: false, message: 'No se pudo obtener el certificado externo' });
    }
}

module.exports = {
    getCertificadoExterno
}