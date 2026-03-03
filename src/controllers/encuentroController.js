const encuentroService = require("../services/encuentroService");

const post = async (req, res) => {
    try {
        const data = req.body;
        const nuevoEncuentro = await encuentroService.post(data);
        res.status(201).json(nuevoEncuentro);
    } catch (error) {
        console.error('Error al crear el encuentro:', error);
        res.status(500).json({ error: 'No se pudo crear el encuentro.' });
    }   
}

const delPorNumeroIdOfertaOficial = async (req, res) => {
    try {
        console.log('Recibida solicitud para eliminar encuentro con params:', req.body);
        const { idOfertaOficial, numero } = req.params;
        await encuentroService.delPorNumeroIdOfertaOficial(numero, idOfertaOficial);
        res.json({ success: true });
    } catch (error) {
        console.error('Error eliminando encuentro:', error);
        res.status(500).json({ success: false, message: 'Error eliminando encuentro' });
    }
}

const putPorNumeroIdOfertaOficial = async (req, res) => {
    try {
        console.log('Recibida solicitud para actualizar encuentro con params:', req.body);  
        const { idOfertaOficial, numero } = req.params;
        const data = req.body;
        const resultado = await encuentroService.putPorNumeroIdOfertaOficial(numero, idOfertaOficial, data);
        res.json({ success: true, resultado });
    } catch (error) {
        console.error('Error actualizando encuentro:', error);
        res.status(500).json({ success: false, message: 'Error actualizando encuentro' });
    }
}

module.exports = {
    post,
    delPorNumeroIdOfertaOficial,
    putPorNumeroIdOfertaOficial
}