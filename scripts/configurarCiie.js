/**
 * Carga o actualiza los datos con los que una institución (CIIE) habla con los sitios oficiales.
 * Solo se cambia lo que se pasa por argumento; el resto queda como está.
 *
 * Uso:
 *   node scripts/configurarCiie.js --clave=ciie06901 --qi=65 --region=3 \
 *        --abc-usuario=ciie06901 --abc-password=... \
 *        [--drupal-usuario=... --drupal-password=... --drupal-url=https://abc.gob.ar/ciie]
 *
 * Las contraseñas también pueden venir por variable de entorno (ABC_PASSWORD, DRUPAL_PASSWORD)
 * para que no queden en el historial de la terminal.
 *
 *   --qi       id de la institución en el sitio oficial (parámetro qi / idciie)
 *   --region   id de región del nomenclador oficial
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Ciie = require('../src/models/Ciie');
const { encriptar } = require('../src/utils/credencialCrypto');

const args = Object.fromEntries(
    process.argv.slice(2)
        .filter(a => a.startsWith('--') && a.includes('='))
        .map(a => [a.slice(2, a.indexOf('=')), a.slice(a.indexOf('=') + 1)])
);

const upsertCredencial = (ciie, sitioNombre, campos) => {
    let cred = ciie.wrappingConfigs.find(c => c.sitioNombre === sitioNombre);
    if (!cred) {
        ciie.wrappingConfigs.push({ sitioNombre, ...campos });
    } else {
        Object.assign(cred, campos);
    }
};

(async () => {
    if (!args.clave) {
        console.error('Falta --clave=<clave del CIIE>. Ver el encabezado del script.');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    try {
        const ciie = await Ciie.findOne({ clave: args.clave.toLowerCase() });
        if (!ciie) throw new Error(`No existe un CIIE con clave "${args.clave}".`);

        if (args.qi) ciie.qi = args.qi;
        if (args.region) ciie.regionAbc = args.region;

        // Solo se cifra la contraseña nueva que llega por argumento/env: la que ya
        // estaba guardada (actual?.password) se conserva tal cual, ya sea que
        // venga cifrada o, de datos viejos sin migrar, en texto plano.
        const abcPassword = args['abc-password'] || process.env.ABC_PASSWORD;
        if (args['abc-usuario'] || abcPassword) {
            const actual = ciie.wrappingConfigs.find(c => c.sitioNombre === 'ABC');
            upsertCredencial(ciie, 'ABC', {
                usuario: args['abc-usuario'] || actual?.usuario,
                password: abcPassword ? encriptar(abcPassword) : actual?.password
            });
        }

        const drupalPassword = args['drupal-password'] || process.env.DRUPAL_PASSWORD;
        if (args['drupal-usuario'] || drupalPassword || args['drupal-url']) {
            const actual = ciie.wrappingConfigs.find(c => c.sitioNombre === 'DRUPAL');
            upsertCredencial(ciie, 'DRUPAL', {
                usuario: args['drupal-usuario'] || actual?.usuario,
                password: drupalPassword ? encriptar(drupalPassword) : actual?.password,
                baseUrl: args['drupal-url'] || actual?.baseUrl
            });
        }

        await ciie.save();

        console.log(`✅ ${ciie.nombre} (${ciie.clave}) actualizado.`);
        console.log(`   qi: ${ciie.qi || '—'} | regionAbc: ${ciie.regionAbc || '—'}`);
        for (const c of ciie.wrappingConfigs) {
            console.log(`   ${c.sitioNombre}: usuario=${c.usuario}${c.baseUrl ? ` url=${c.baseUrl}` : ''}`);
        }
    } catch (error) {
        console.error('❌', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
})();
