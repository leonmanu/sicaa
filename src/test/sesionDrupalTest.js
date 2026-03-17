const express = require('express');
const router = express.Router();
const clientDrupal = require('../services/httpClientDrupal');
const sesionDrupalService = require('../services/sesionDrupalService');

router.get('/drupal', async (req, res) => {
    try {
        await sesionDrupalService.asegurarSesion();
        const response = await clientDrupal.get('https://abc.gob.ar/ciie/user/829');
        res.json({
            ok: true,
            url: response.request?.res?.responseUrl,
            logueado: response.data.includes('mleon')
        });
    } catch (error) {
        res.json({ ok: false, error: error.message });
    }
});

module.exports = router;