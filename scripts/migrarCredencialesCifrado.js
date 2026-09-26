/**
 * Migración única: cifra las contraseñas de wrappingConfigs que todavía estén en
 * texto plano (datos cargados antes de que existiera credencialCrypto). No pide
 * ninguna contraseña por parámetro: lee la que ya está en Mongo, la cifra ahí mismo
 * y la vuelve a guardar, así nunca pasa por la terminal ni por manos del operador.
 *
 * Es seguro correrlo más de una vez: los valores ya cifrados (prefijo 'enc:v1:')
 * se dejan tal cual.
 *
 * Uso: node scripts/migrarCredencialesCifrado.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Ciie = require('../src/models/Ciie');
const { encriptar, estaEncriptado } = require('../src/utils/credencialCrypto');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const ciies = await Ciie.find({});
        let totalCiies = 0;
        let totalCredenciales = 0;

        for (const ciie of ciies) {
            let tocado = false;
            for (const cred of ciie.wrappingConfigs) {
                if (!estaEncriptado(cred.password)) {
                    cred.password = encriptar(cred.password);
                    tocado = true;
                    totalCredenciales += 1;
                }
            }
            if (tocado) {
                await ciie.save();
                totalCiies += 1;
                console.log(`✅ ${ciie.nombre} (${ciie.clave}): credenciales cifradas.`);
            }
        }

        console.log(`Listo. ${totalCredenciales} credencial(es) cifradas en ${totalCiies} institución(es).`);
    } catch (error) {
        console.error('❌', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
})();
