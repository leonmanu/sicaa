const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const cookieJar = new CookieJar();
const client = wrapper(axios.create({ 
    jar: cookieJar, 
    withCredentials: true 
}));

module.exports = client;