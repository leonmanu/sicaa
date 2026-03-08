const cursoBaseLocalRepo = require("../repos/cursoBaseLocalRepo");
const ciieService = require("./ciieService");
const cursoBaseExternoService = require("./cursoBaseExternoService");

class CursoBaseLocalService {

    async get() {
        try {
            return await cursoBaseLocalRepo.get()
        } catch (error) {
            console.error('Error obteniendo cursos locales:', error.message);
            throw error;
        }
    }

    async getPorCiieId(ciieId) {
        try {
            return await cursoBaseLocalRepo.getPorCiieId(ciieId);
        } catch (error) {
            console.error('Error obteniendo cursos locales:', error.message);
            throw error;
        }
    }

    async post(data) {
        try {
            const resultado = await cursoBaseLocalRepo.insertMany(data)
            return resultado
        }
        catch (error) {
            console.error('Error guardando cursos locales: ', error.message)
            throw error;
        }
    }

   async sincronizar(ciieId) {

        const externos = await cursoBaseExternoService.listar();
        const locales = await cursoBaseLocalRepo.getPorCiieId(ciieId);
        
        const idsExternos = externos.map(c => c[0]);
        const idsLocales = locales.map(c => c.idCursoOriginal);
        
        const nuevos = externos.filter(c => !idsLocales.includes(c[0]));
        //console.log('NUEVOS::: ', nuevos)
        const desaparecidos = locales.filter(c => !idsExternos.includes(c.idCursoOriginal));

        const resultado = await cursoBaseLocalRepo.sincronizar(nuevos, ciieId);
        
        // Soft delete de los que ya no están en ABC
        if (desaparecidos.length > 0) {
            const idsDesaparecidos = desaparecidos.map(c => c.idCursoOriginal);
            await cursoBaseLocalRepo.desactivar(idsDesaparecidos, ciieId);
        }

        console.log('EXTERNOS:', externos.length);
        console.log('LOCALES:', locales.length);
        console.log('IDS LOCALES:', idsLocales);

        return {
            insertados: nuevos.length,
            actualizados: resultado.modifiedCount,
            desactivados: desaparecidos.length
        };
    }
    
}

module.exports = new CursoBaseLocalService();