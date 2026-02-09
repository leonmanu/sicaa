const client = require('./httpClient');
const URLS = require('../config/urls');

class SesionService {
    constructor() {
        this.LOGIN_URL = URLS.LOGIN.LOGIN_CIIE;
        this.estaLogueado = false;
        
        // Lo ideal es que estos datos vengan de un archivo .env
        this.credenciales = {
            usuario: 'ciie06901',
            password:'lopezMay3250'
        };
    }

    async asegurarSesion(forzar = false) {
        if (this.estaLogueado && !forzar) {
            return; 
        }

        try {
            if (forzar) console.log('🔄 Re-autenticando sesión expirada...');
            else console.log(`🔐 Autenticando en ABC con usuario: ${this.credenciales.usuario}`);

            const body = `usuario=${this.credenciales.usuario}&password=${this.credenciales.password}`;
            
            const response = await client.post(this.LOGIN_URL, body, {
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

            this.estaLogueado = true;
            console.log('✅ Sesión establecida correctamente.');
            
        } catch (error) {
            this.estaLogueado = false;
            throw new Error('Error de autenticación: ' + error.message);
        }
    }

    invalidarSesion() {
        this.estaLogueado = false;
        console.log('🔓 Sesión invalidada');
    }
}

module.exports = new SesionService();