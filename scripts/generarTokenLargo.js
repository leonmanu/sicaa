/**
 * Uso: node scripts/generarTokenLargo.js <APP_ID> <APP_SECRET> <TOKEN_DE_USUARIO_CORTO>
 *
 * El TOKEN_DE_USUARIO_CORTO se obtiene en https://developers.facebook.com/tools/explorer:
 * elegí tu App, arriba a la derecha seleccioná "User Token" (NO "Page Token"),
 * pedí los permisos pages_show_list, pages_read_engagement, pages_manage_posts,
 * instagram_basic, instagram_content_publish, business_management, y generá el token.
 *
 * APP_ID y APP_SECRET están en developers.facebook.com > tu App > Configuración > Básica.
 *
 * El script imprime el Page Access Token de larga duración (no vence mientras no
 * revoques el permiso ni cambies tu contraseña) para pegar en FACEBOOK_PAGE_ACCESS_TOKEN.
 */
const axios = require('axios');

const [, , appId, appSecret, shortUserToken] = process.argv;

if (!appId || !appSecret || !shortUserToken) {
    console.error('Uso: node scripts/generarTokenLargo.js <APP_ID> <APP_SECRET> <TOKEN_DE_USUARIO_CORTO>');
    process.exit(1);
}

const version = process.env.META_GRAPH_API_VERSION || 'v21.0';

(async () => {
    try {
        const { data: exchange } = await axios.get(`https://graph.facebook.com/${version}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: appId,
                client_secret: appSecret,
                fb_exchange_token: shortUserToken
            }
        });

        const longUserToken = exchange.access_token;
        console.log('✅ Token de usuario de larga duración obtenido.');

        const { data: cuentas } = await axios.get(`https://graph.facebook.com/${version}/me/accounts`, {
            params: { access_token: longUserToken }
        });

        if (!cuentas.data || cuentas.data.length === 0) {
            console.error('No se encontró ninguna Página asociada a este usuario. ¿Le diste permiso al App sobre la Página?');
            return;
        }

        console.log('\nPáginas encontradas:\n');
        cuentas.data.forEach(pagina => {
            console.log(`- ${pagina.name} (ID: ${pagina.id})`);
            console.log(`  Page Access Token: ${pagina.access_token}\n`);
        });

        console.log('Copiá el "Page Access Token" de la Página que corresponda a FACEBOOK_PAGE_ACCESS_TOKEN en tu .env');
    } catch (error) {
        console.error('Error:', error.response?.data?.error?.message || error.message);
    }
})();
