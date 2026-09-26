// Cifra/descifra las contraseñas de sitios externos que se guardan en
// Ciie.wrappingConfigs (portal ABC, DFDP, Drupal). AES-256-GCM con una clave
// simétrica que vive solo en el servidor (CIIE_CREDENTIALS_KEY), nunca en Mongo.
const crypto = require('crypto');

const ALGORITMO = 'aes-256-gcm';
const PREFIJO = 'enc:v1:'; // marca los valores ya cifrados; distingue de datos viejos sin migrar

function _clave() {
    const raw = process.env.CIIE_CREDENTIALS_KEY;
    if (!raw) {
        throw new Error(
            'Falta configurar CIIE_CREDENTIALS_KEY (clave para cifrar credenciales de sitios externos). ' +
            'Generá una con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
        );
    }
    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
        throw new Error('CIIE_CREDENTIALS_KEY debe decodificar a 32 bytes en base64 (una clave AES-256).');
    }
    return key;
}

function estaEncriptado(valor) {
    return typeof valor === 'string' && valor.startsWith(PREFIJO);
}

function encriptar(textoPlano) {
    const key = _clave();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITMO, key, iv);
    const cifrado = Buffer.concat([cipher.update(String(textoPlano), 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return PREFIJO + Buffer.concat([iv, authTag, cifrado]).toString('base64');
}

// Si el valor no está cifrado (dato viejo todavía no migrado), se devuelve tal cual
// en vez de fallar: permite convivir con datos sin migrar hasta correr la migración.
function desencriptar(valor) {
    if (!estaEncriptado(valor)) return valor;
    const key = _clave();
    const datos = Buffer.from(valor.slice(PREFIJO.length), 'base64');
    const iv = datos.subarray(0, 12);
    const authTag = datos.subarray(12, 28);
    const cifrado = datos.subarray(28);
    const decipher = crypto.createDecipheriv(ALGORITMO, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString('utf8');
}

module.exports = { encriptar, desencriptar, estaEncriptado };
