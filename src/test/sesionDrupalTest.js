const express = require('express');
const router = express.Router();
const sesionDrupalService = require('../services/sesionDrupalService');
const { esAdmin } = require('../middleware/auth');
const ciieRepo = require('../repos/ciieRepo');
const { ejecutarComo } = require('../services/contextoCiie');

// Prueba el login de Drupal de una institución: /test/drupal?ciie=ciie06901
router.get('/drupal', esAdmin, async (req, res) => {
    try {
        const ciie = await ciieRepo.getPorClave(String(req.query.ciie || '').toLowerCase());
        if (!ciie) return res.json({ ok: false, error: 'Indicá ?ciie=<clave> de una institución existente.' });

        await ejecutarComo(ciie._id, async () => {
            await sesionDrupalService.asegurarSesion();
            const { client, baseUrl } = await sesionDrupalService.contexto();
            const response = await client.get(`${baseUrl}/user`);
            res.json({
                ok: true,
                url: response.request?.res?.responseUrl,
                logueado: !String(response.request?.res?.responseUrl || '').includes('/user/login')
            });
        });
    } catch (error) {
        res.json({ ok: false, error: error.message });
    }
});

module.exports = router;
