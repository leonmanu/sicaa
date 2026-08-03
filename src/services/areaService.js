const areaRepo = require('../repos/areaRepo');

class AreaService {

    async postArea(datosForm) {
        try {
            const datos = {
                nombre: datosForm.nombre?.trim(),
                nombreCorto: datosForm.nombreCorto?.trim(),
                clave: datosForm.clave?.trim().toLowerCase(),
                nivel: datosForm.nivel
            };

            const existente = await areaRepo.getPorClave(datos.clave);
            if (existente) {
                throw new Error(`Ya existe un área con la clave "${datos.clave}" (${existente.nombre}).`);
            }

            return await areaRepo.crear(datos);
        } catch (error) {
            if (error.code === 11000) {
                throw new Error(`Ya existe un área con la clave "${datosForm.clave}".`);
            }
            console.error('Error en AreaService.postArea:', error.message);
            throw error;
        }
    }

    async getTodas() {
        try {
            return await areaRepo.getTodas();
        } catch (error) {
            console.error('Error en AreaService.getTodas:', error.message);
            throw error;
        }
    }
}

module.exports = new AreaService();
