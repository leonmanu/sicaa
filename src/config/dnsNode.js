// En algunas redes Windows, Node no logra leer los DNS del sistema y cae a
// 127.0.0.1, donde no hay ningún servidor: la conexión mongodb+srv:// a Atlas
// falla con "querySrv ECONNREFUSED" y mongoose termina en "buffering timed out".
// Solo en ese caso se tocan los DNS; si Node tiene DNS reales (Render,
// otras redes), no se toca nada.
//
// Primero se usan los DNS que Windows sí tiene configurados (ej. el router),
// porque hay redes que bloquean los DNS públicos (8.8.8.8 / 1.1.1.1 no
// responden). Los públicos quedan de respaldo.
const dns = require('dns');
const { execFileSync } = require('child_process');

const servidores = dns.getServers();
const soloLoopback = servidores.length > 0 && servidores.every(s => s === '127.0.0.1' || s === '::1');

function dnsDeWindows() {
    if (process.platform !== 'win32') return [];
    try {
        const salida = execFileSync('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-Command',
            '(Get-DnsClientServerAddress -AddressFamily IPv4).ServerAddresses'
        ], { encoding: 'utf8', timeout: 5000, windowsHide: true });
        return [...new Set(salida.split(/\r?\n/).map(s => s.trim()))]
            .filter(s => /^\d{1,3}(\.\d{1,3}){3}$/.test(s) && !s.startsWith('127.'));
    } catch {
        return [];
    }
}

if (soloLoopback) {
    const delSistema = dnsDeWindows();
    const usar = [...delSistema, '8.8.8.8', '1.1.1.1'];
    dns.setServers(usar);
    console.warn(`⚠️  Node no encontró los DNS del sistema (solo 127.0.0.1); usando ${usar.join(', ')}.`);
}
