const plantillaDispositivoRepo = require('../repos/plantillaDispositivoRepo');

class PlantillaDispositivoService {

    async getTodas() {
        return await plantillaDispositivoRepo.getTodas();
    }

    async getPorDispositivo(dispositivo) {
        return await plantillaDispositivoRepo.getPorDispositivo(dispositivo);
    }

    async crear(datos) {
        return await plantillaDispositivoRepo.crear({
            dispositivo: datos.dispositivo,
            nombrePlural: datos.nombrePlural,
            hashtag: datos.hashtag || '',
            queSonBullets: this._textoABullets(datos.queSonBullets),
            requisitosBullets: this._textoABullets(datos.requisitosBullets)
        });
    }

    async actualizar(id, datos) {
        return await plantillaDispositivoRepo.actualizar(id, {
            dispositivo: datos.dispositivo,
            nombrePlural: datos.nombrePlural,
            hashtag: datos.hashtag || '',
            queSonBullets: this._textoABullets(datos.queSonBullets),
            requisitosBullets: this._textoABullets(datos.requisitosBullets)
        });
    }

    async eliminar(id) {
        return await plantillaDispositivoRepo.eliminar(id);
    }

    _textoABullets(texto) {
        if (Array.isArray(texto)) return texto.filter(Boolean);
        return (texto || '').split('\n').map(l => l.trim()).filter(Boolean);
    }
}

module.exports = new PlantillaDispositivoService();
