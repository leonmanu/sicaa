const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    minVersion: 'TLSv1',
    ciphers: [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'DHE-RSA-AES128-GCM-SHA256',
        'DHE-RSA-AES256-GCM-SHA384',
        'DHE-RSA-AES128-SHA256',
        'DHE-RSA-AES256-SHA256',
        'DHE-RSA-AES128-SHA',
        'DHE-RSA-AES256-SHA',
        'AES128-SHA',
        'AES256-SHA'
    ].join(':')
});

const instance = axios.create({
    httpsAgent,
    withCredentials: true,
    maxRedirects: 5
});

let cookies = '';

instance.interceptors.response.use(response => {
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
        cookies = setCookie.map(c => c.split(';')[0]).join('; ');
    }
    return response;
});

instance.interceptors.request.use(config => {
    if (cookies) {
        config.headers['Cookie'] = cookies;
    }
    return config;
});

module.exports = instance;