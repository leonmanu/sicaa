const ciieRepo = require('../repos/ciieRepo');
const contextoCiie = require('./contextoCiie');
const { crearCliente } = require('./httpClient');
const URLS = require('../config/urls');

// Sesión con el portal de inscripción de formación permanente (sitio "ABC"),
// una por institución: cada CIIE entra con su usuario, tiene sus cookies y su `qi`.
class SesionService {
    constructor() {
        this.LOGIN_URL = URLS.LOGIN.LOGIN_CIIE;
        this.sesiones = new Map(); // ciieId -> { client, estaLogueado, config }
    }

    async _cargarConfig(ciieId) {
        const ciie = await ciieRepo.getPorId(ciieId);
        if (!ciie) throw new Error('No existe la institución (CIIE) indicada.');

        const credencial = (ciie.wrappingConfigs || []).find(c => c.sitioNombre === 'ABC');
        if (!credencial?.usuario || !credencial?.password) {
            throw new Error(`${ciie.nombre}: faltan las credenciales del portal ABC.`);
        }
        if (!ciie.qi) {
            throw new Error(`${ciie.nombre}: falta el identificador (qi) de la institución en el sitio oficial.`);
        }

        return {
            nombre: ciie.nombre,
            qi: String(ciie.qi),
            regionAbc: ciie.regionAbc ? String(ciie.regionAbc) : null,
            usuario: credencial.usuario,
            password: credencial.password
        };
    }

    async _sesion(ciieId, recargarConfig = false) {
        let sesion = this.sesiones.get(ciieId);
        if (!sesion) {
            sesion = { client: crearCliente(), estaLogueado: false, config: null };
            this.sesiones.set(ciieId, sesion);
        }
        // Al forzar un nuevo login se relee la configuración, así un cambio de clave se toma solo.
        if (!sesion.config || recargarConfig) {
            sesion.config = await this._cargarConfig(ciieId);
        }
        return sesion;
    }

    // Cliente HTTP y datos oficiales de la institución del request actual.
    async contexto() {
        const ciieId = await contextoCiie.ciieIdActual();
        const { client, config } = await this._sesion(ciieId);
        return { ciieId, client, qi: config.qi, regionAbc: config.regionAbc };
    }

    async asegurarSesion(forzar = false) {
        const ciieId = await contextoCiie.ciieIdActual();
        const sesion = await this._sesion(ciieId, forzar);

        if (sesion.estaLogueado && !forzar) {
            return;
        }

        const { usuario, password, nombre } = sesion.config;
        try {
            if (forzar) console.log(`🔄 Re-autenticando sesión expirada (${nombre})...`);
            else console.log(`🔐 Autenticando en ABC como ${usuario} (${nombre})`);

            const body = new URLSearchParams({ usuario, password }).toString();

            const response = await sesion.client.post(this.LOGIN_URL, body, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                maxRedirects: 5
            });

            // Verificar que el login fue exitoso
            if (response.data.includes('Inicio de Sesión')) {
                throw new Error('Credenciales inválidas');
            }

            sesion.estaLogueado = true;
            console.log(`✅ Sesión establecida correctamente (${nombre}).`);

        } catch (error) {
            sesion.estaLogueado = false;
            throw new Error('Error de autenticación: ' + error.message);
        }
    }

    invalidarSesion() {
        const ciieId = contextoCiie.ciieIdResuelto();
        const sesion = ciieId && this.sesiones.get(ciieId);
        if (sesion) sesion.estaLogueado = false;
        console.log('🔓 Sesión invalidada');
    }
}

module.exports = new SesionService();
