const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

// Cada institución necesita su propio cliente (y por lo tanto su propio jar de cookies),
// si no compartirían la sesión PHP del sitio oficial.
const crearCliente = () => wrapper(axios.create({
    jar: new CookieJar(),
    withCredentials: true
}));

// Cliente único histórico; solo lo usan los módulos de src/sheets (código heredado).
// Para llamadas al sitio oficial usar sesionService.contexto().
const client = crearCliente();

module.exports = client;
module.exports.crearCliente = crearCliente;
