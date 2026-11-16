/**
 * Migración única: pasa la conexión con Meta que hoy vive en variables de entorno
 * (FACEBOOK_PAGE_ID, FACEBOOK_PAGE_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID) al
 * CIIE dueño de esas redes (Ciie.redesSociales, con el token cifrado), y le asigna
 * la configuración de publicaciones global que existía antes (la que no tiene ciieId).
 *
 * Correrlo con el .env que apunta a la base y a la CIIE_CREDENTIALS_KEY de producción.
 * Es seguro correrlo más de una vez: si el CIIE ya tiene redes, no las pisa salvo --forzar.
 *
 * Uso: node scripts/migrarRedesSocialesCiie.js --clave=ciie06901 [--forzar]
 *
 * Después de comprobar que se publica bien, se pueden borrar de Render las variables
 * FACEBOOK_PAGE_ID, FACEBOOK_PAGE_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID.
 */
require('dotenv').config();
require('../src/config/dnsNode');
const mongoose = require('mongoose');
const Ciie = require('../src/models/Ciie');
const ConfiguracionPublicaciones = require('../src/models/ConfiguracionPublicaciones');
const metaGraphService = require('../src/services/metaGraphService');
const { encriptar } = require('../src/utils/credencialCrypto');

const args = Object.fromEntries(
    process.argv.slice(2)
        .filter(a => a.startsWith('--'))
        .map(a => a.includes('=') ? [a.slice(2, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a.slice(2), true])
);

(async () => {
    if (!args.clave) {
        console.error('Falta --clave=<clave del CIIE> (ej. --clave=ciie06901).');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    try {
        const ciie = await Ciie.findOne({ clave: args.clave });
        if (!ciie) {
            const claves = await Ciie.find({}, 'clave nombre').lean();
            console.error(`No existe un CIIE con clave "${args.clave}". Disponibles:`);
            claves.forEach(c => console.error(`  ${c.clave}  ${c.nombre}`));
            process.exitCode = 1;
            return;
        }

        // 1. Conexión con Meta
        const pageId = process.env.FACEBOOK_PAGE_ID;
        const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

        if (ciie.redesSociales?.token && !args.forzar) {
            console.log(`ℹ️  ${ciie.nombre} ya tiene redes conectadas; no se pisan (usá --forzar para reemplazarlas).`);
        } else if (!pageId || !token) {
            console.log('ℹ️  No hay FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN en el entorno: se saltea la conexión con Meta.');
        } else {
            let pageNombre = null;
            let igUsuario = null;
            let igDetectado = null;
            try {
                const { paginas } = await metaGraphService.inspeccionarToken(token);
                const pagina = paginas.find(p => p.id === pageId);
                if (pagina) {
                    pageNombre = pagina.nombre;
                    igDetectado = pagina.instagram?.id || null;
                    igUsuario = pagina.instagram?.usuario || null;
                } else {
                    console.warn('⚠️  El token no lista la página configurada; se guarda igual con los IDs del entorno.');
                }
            } catch (error) {
                console.warn('⚠️  No se pudo consultar a Meta para completar nombres:', error.message);
            }

            const instagramId = igId || igDetectado;
            if (igId && igDetectado && igId !== igDetectado) {
                console.warn(`⚠️  INSTAGRAM_BUSINESS_ACCOUNT_ID (${igId}) no coincide con el Instagram vinculado a la página (${igDetectado}). Se usa el del entorno.`);
                igUsuario = null;
            }

            ciie.redesSociales = {
                token: encriptar(token),
                facebookPageId: pageId,
                facebookPageNombre: pageNombre,
                instagramId: instagramId || null,
                instagramUsuario: igUsuario,
                verificadoEn: new Date()
            };
            await ciie.save();
            console.log(`✅ ${ciie.nombre}: redes conectadas (página ${pageNombre || pageId}, Instagram ${igUsuario ? '@' + igUsuario : (instagramId || 'ninguno')}).`);
        }

        // 2. Configuración de textos que era global
        const yaTiene = await ConfiguracionPublicaciones.findOne({ ciieId: ciie._id });
        const global = await ConfiguracionPublicaciones.findOne({ ciieId: { $exists: false } });
        if (yaTiene) {
            console.log(`ℹ️  ${ciie.nombre} ya tiene su configuración de textos.`);
        } else if (global) {
            global.ciieId = ciie._id;
            await global.save();
            console.log(`✅ La configuración de textos que era global quedó asignada a ${ciie.nombre}.`);
        } else {
            console.log('ℹ️  No había configuración global de textos; se creará con valores por defecto al entrar a la pantalla.');
        }
    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
})();
