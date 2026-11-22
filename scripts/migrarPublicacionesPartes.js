/**
 * Migración única: pasa las publicaciones al formato con partes de Instagram.
 *
 *   antes: tipoAgrupacion, facebook{caption,estado,...}, instagram{caption,estado,...}, imagenes[], grupoId...
 *   ahora: ciieId, tipo (individual|carrusel), facebook{...}, instagram.partes[{cursoLocalIds, caption, estado, ...}]
 *
 * Los textos existentes se conservan marcados como "editados a mano" (no se
 * regeneran). Es seguro correrlo más de una vez: solo toca documentos sin `tipo`.
 * Correrlo DESPUÉS de desplegar el código nuevo, con el .env de producción.
 *
 * Uso: node scripts/migrarPublicacionesPartes.js [--simular]
 */
require('dotenv').config();
require('../src/config/dnsNode');
const mongoose = require('mongoose');

const simular = process.argv.includes('--simular');
const ESTADOS = ['pendiente', 'publicando', 'publicado', 'error'];
const estado = e => (ESTADOS.includes(e) ? e : 'pendiente');

function envioDesde(viejo, cantidadImagenes) {
    viejo = viejo || {};
    return {
        caption: viejo.caption || '',
        captionEditado: true,
        estado: estado(viejo.estado),
        postId: viejo.postId || null,
        publicadoEn: viejo.publicadoEn || null,
        error: viejo.error || null,
        intentoEn: null,
        cantidadImagenes: viejo.estado === 'publicado' ? cantidadImagenes : 0
    };
}

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const db = mongoose.connection.db;
        const publicaciones = db.collection('publicacions');
        const cursos = db.collection('cursolocals');

        const viejas = await publicaciones.find({ tipo: { $exists: false } }).toArray();
        console.log(`${viejas.length} publicación(es) para migrar${simular ? ' (simulación)' : ''}.`);

        let migradas = 0;
        for (const pub of viejas) {
            const cursoIds = pub.cursoLocalIds || [];
            const primerCurso = cursoIds.length ? await cursos.findOne({ _id: cursoIds[0] }, { projection: { ciieId: 1 } }) : null;
            if (!primerCurso?.ciieId) {
                console.warn(`⚠️  ${pub._id}: no se pudo determinar el CIIE (curso inexistente); se saltea.`);
                continue;
            }

            const cantidadImagenes = (pub.imagenes || []).length;
            const tipo = pub.tipoAgrupacion === 'individual' || cursoIds.length === 1 ? 'individual' : 'carrusel';
            const nuevo = {
                ciieId: primerCurso.ciieId,
                tipo,
                caratula: { titulo: '', meses: '', tituloEditado: false },
                facebook: envioDesde(pub.facebook, cantidadImagenes),
                instagram: {
                    partes: [{
                        _id: new mongoose.Types.ObjectId(),
                        cursoLocalIds: cursoIds,
                        caratula: { titulo: '', meses: '', tituloEditado: false },
                        ...envioDesde(pub.instagram, cantidadImagenes)
                    }]
                }
            };

            if (!simular) {
                await publicaciones.updateOne({ _id: pub._id }, {
                    $set: nuevo,
                    $unset: { tipoAgrupacion: 1, dispositivoTipo: 1, incluirCaratula: 1, grupoId: 1, parteActual: 1, totalPartes: 1, imagenes: 1 }
                });
            }
            migradas += 1;
            console.log(`✅ ${pub._id}: ${tipo}, ${cursoIds.length} propuesta(s), FB ${nuevo.facebook.estado}, IG ${nuevo.instagram.partes[0].estado}`);
        }

        console.log(`Listo. ${migradas} migrada(s)${simular ? ' (simulación: no se escribió nada)' : ''}.`);
    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
})();
