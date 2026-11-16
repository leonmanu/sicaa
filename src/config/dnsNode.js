// En algunas redes Windows, Node no logra leer los DNS del sistema y cae a
// 127.0.0.1, donde no hay ningún servidor: la conexión mongodb+srv:// a Atlas
// falla con "querySrv ECONNREFUSED" y mongoose termina en "buffering timed out".
// Solo en ese caso se usan DNS públicos; si Node tiene DNS reales (Render,
// otras redes), no se toca nada.
const dns = require('dns');

const servidores = dns.getServers();
const soloLoopback = servidores.length > 0 && servidores.every(s => s === '127.0.0.1' || s === '::1');

if (soloLoopback) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.warn('⚠️  Node no encontró los DNS del sistema (solo 127.0.0.1); usando 8.8.8.8 y 1.1.1.1.');
}
