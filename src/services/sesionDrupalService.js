const ciieRepo = require('../repos/ciieRepo');
const contextoCiie = require('./contextoCiie');
const { crearClienteDrupal } = require('./httpClientDrupal');

const BASE_URL_DEFAULT = 'https://abc.gob.ar/ciie';

// Sesión con el sitio Drupal, una por institución: cada CIIE tiene su usuario y su URL de acceso.
class SesionDrupalService {
    constructor() {
        this.sesiones = new Map(); // ciieId -> { client, estaLogueado, config }
    }

    async _cargarConfig(ciieId) {
        const ciie = await ciieRepo.getPorId(ciieId);
        if (!ciie) throw new Error('No existe la institución (CIIE) indicada.');

        const credencial = (ciie.wrappingConfigs || []).find(c => c.sitioNombre === 'DRUPAL');
        if (!credencial?.usuario || !credencial?.password) {
            throw new Error(`${ciie.nombre}: faltan las credenciales de Drupal.`);
        }

        return {
            nombre: ciie.nombre,
            baseUrl: (credencial.baseUrl || BASE_URL_DEFAULT).replace(/\/$/, ''),
            usuario: credencial.usuario,
            password: credencial.password
        };
    }

    async _sesion(ciieId, recargarConfig = false) {
        let sesion = this.sesiones.get(ciieId);
        if (!sesion) {
            sesion = { client: crearClienteDrupal(), estaLogueado: false, config: null };
            this.sesiones.set(ciieId, sesion);
        }
        if (!sesion.config || recargarConfig) {
            sesion.config = await this._cargarConfig(ciieId);
        }
        return sesion;
    }

    // Cliente HTTP y URL base de Drupal de la institución del request actual.
    async contexto() {
        const ciieId = await contextoCiie.ciieIdActual();
        const { client, config } = await this._sesion(ciieId);
        return { ciieId, client, baseUrl: config.baseUrl };
    }

    async asegurarSesion(forzar = false) {
        const ciieId = await contextoCiie.ciieIdActual();
        const sesion = await this._sesion(ciieId, forzar);
        if (sesion.estaLogueado && !forzar) return;

        const { baseUrl, usuario, password, nombre } = sesion.config;
        const client = sesion.client;

        try {
            if (forzar) console.log(`🔄 Re-autenticando sesión Drupal (${nombre})...`);
            else console.log(`🔐 Autenticando en Drupal como ${usuario} (${nombre})`);

            // 1. GET para obtener form_build_id
            const loginPage = await client.get(`${baseUrl}/user/login`);
            const match = loginPage.data.match(/name="form_build_id" value="([^"]+)"/);
            if (!match) throw new Error('No se encontró form_build_id');

            // 2. POST con credenciales
            const body = new URLSearchParams({
                name:          usuario,
                pass:          password,
                form_build_id: match[1],
                form_id:       'user_login_form',
                op:            'Iniciar sesión'
            });

            const response = await client.post(`${baseUrl}/user/login`, body.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': `${baseUrl}/user/login`,
                    'Origin': new URL(baseUrl).origin,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'es-AR,es;q=0.9'
                },
                maxRedirects: 5
            });

            // Login exitoso si redirigió al perfil ({baseUrl}/user/{uid}) y no volvió al formulario
            const finalUrl = response.request?.res?.responseUrl || '';
            if (!finalUrl.startsWith(`${baseUrl}/user/`) || finalUrl.includes('/user/login')) {
                throw new Error('Credenciales inválidas o login fallido');
            }

            sesion.estaLogueado = true;
            console.log(`✅ Sesión Drupal establecida correctamente (${nombre}).`);

        } catch (error) {
            sesion.estaLogueado = false;
            throw new Error('Error de autenticación Drupal: ' + error.message);
        }
    }

    invalidarSesion() {
        const ciieId = contextoCiie.ciieIdResuelto();
        const sesion = ciieId && this.sesiones.get(ciieId);
        if (sesion) sesion.estaLogueado = false;
        console.log('🔓 Sesión Drupal invalidada');
    }
}

module.exports = new SesionDrupalService();
