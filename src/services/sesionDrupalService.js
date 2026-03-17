const client = require('./httpClientDrupal');

class SesionDrupalService {
    constructor() {
        this.BASE_URL = 'https://abc.gob.ar/ciie';
        this.estaLogueado = false;
        this.credenciales = {
            usuario: process.env.USERNAME_DRUPAL || 'mleon',
            password: process.env.PASSWORD_DRUPAL || 'tuPassword'
        };
    }

    async asegurarSesion(forzar = false) {
        if (this.estaLogueado && !forzar) return;

        try {
            if (forzar) console.log('🔄 Re-autenticando sesión Drupal...');
            else console.log(`🔐 Autenticando en Drupal con usuario: ${this.credenciales.usuario}`);

            // 1. GET para obtener form_build_id
            const loginPage = await client.get(`${this.BASE_URL}/user/login`);
            console.log('Status GET login:', loginPage.status);
            console.log('form_build_id encontrado:', loginPage.data.match(/name="form_build_id" value="([^"]+)"/)?.[1]);
            
            const match = loginPage.data.match(/name="form_build_id" value="([^"]+)"/);
            if (!match) throw new Error('No se encontró form_build_id');

            // 2. POST con credenciales
            const body = new URLSearchParams({
                name:          this.credenciales.usuario,
                pass:          this.credenciales.password,
                form_build_id: match[1],
                form_id:       'user_login_form',
                op:            'Iniciar sesión'
            });

            const response = await client.post(`${this.BASE_URL}/user/login`, body.toString(), {
                headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `${this.BASE_URL}/user/login`,
        'Origin': 'https://abc.gob.ar',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9'
    },
                maxRedirects: 5
            });

            // Login exitoso si redirigió a /ciie/user/{uid}
            const finalUrl = response.request?.res?.responseUrl || '';
            if (!finalUrl.includes('/ciie/user/')) {
                throw new Error('Credenciales inválidas o login fallido');
            }

            this.estaLogueado = true;
            console.log('✅ Sesión Drupal establecida correctamente.');

        } catch (error) {
            this.estaLogueado = false;
            throw new Error('Error de autenticación Drupal: ' + error.message);
        }
    }

    invalidarSesion() {
        this.estaLogueado = false;
        console.log('🔓 Sesión Drupal invalidada');
    }
}

module.exports = new SesionDrupalService();