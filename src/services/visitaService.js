// src/services/visitaService.js
const crypto = require('crypto');
const mongoose = require('mongoose');
const VisitaDiaria = require('../models/VisitaDiaria');
const { fechaDiaArg } = require('./ofertaAbcService');

// Contador de visitas de páginas públicas. Registrar no frena la página: se
// dispara sin esperar y, si falla, solo queda en el log.

const SAL = process.env.SESSION_SECRET || 'sal-visitas';

// Buscadores, previsualizadores de enlaces (WhatsApp, Facebook) y herramientas.
const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|axios|node-fetch|headless|lighthouse|monitor|uptime/i;

const ipDe = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();

function registrar(req, ciieId, pagina) {
    const ua = String(req.headers['user-agent'] || '');
    // No cuenta: bots, pedidos sin navegador, ni usuarios logueados (el propio personal).
    if (!ua || BOTS.test(ua) || req.method !== 'GET' || req.user) return;

    const fecha = fechaDiaArg(new Date());
    const huella = crypto.createHash('sha256').update(`${SAL}|${fecha}|${ipDe(req)}|${ua}`).digest('hex').slice(0, 16);

    VisitaDiaria.updateOne(
        { ciieId, pagina, fecha },
        { $inc: { visitas: 1 }, $addToSet: { huellas: huella } },
        { upsert: true }
    ).catch(e => console.error('No se pudo registrar la visita:', e.message));
}

// Resumen de los últimos `dias` días (incluido hoy), con los días sin visitas en cero.
async function resumen(ciieId, pagina, dias = 30) {
    const hoy = new Date();
    const fechas = Array.from({ length: dias }, (_, i) =>
        fechaDiaArg(new Date(hoy.getTime() - (dias - 1 - i) * 86400000)));

    const docs = await VisitaDiaria.aggregate([
        { $match: { ciieId: new mongoose.Types.ObjectId(String(ciieId)), pagina, fecha: { $gte: fechas[0] } } },
        { $project: { _id: 0, fecha: 1, visitas: 1, personas: { $size: { $ifNull: ['$huellas', []] } } } }
    ]);
    const porFecha = new Map(docs.map(d => [d.fecha, d]));
    const serie = fechas.map(fecha => ({
        fecha,
        visitas: porFecha.get(fecha)?.visitas || 0,
        personas: porFecha.get(fecha)?.personas || 0
    }));

    // Las personas se cuentan por día: sumar días puede contar dos veces a quien volvió.
    const sumar = (n) => serie.slice(-n).reduce((t, d) => ({ visitas: t.visitas + d.visitas, personas: t.personas + d.personas }), { visitas: 0, personas: 0 });
    return { serie, hoy: sumar(1), semana: sumar(7), mes: sumar(dias) };
}

module.exports = { registrar, resumen };
