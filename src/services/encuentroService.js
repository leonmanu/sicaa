const encuentroRepo = require('../repos/encuentroRepo');
const cursoLocalService = require('./cursoLocalService');


class encuentroService {

    async getPorCursoId(cursoId) {
        try {
            return await encuentroRepo.getPorCursoId(cursoId);
        }   catch (error) {     
            console.error('Error obteniendo encuentros por cursoId:', error.message);
            throw error;
        }
    }

    async getUnoPorNumeroCursoId(cursoId, numero) {
        try {
            return await encuentroRepo.getUnoPorNumeroCursoId(cursoId, numero);
        }   catch (error) {     
            console.error('Error obteniendo encuentro por cursoId y número:', error.message);
            throw error;
        }
    }

    async post(data) {
        console.log('Datos recibidos para nuevo encuentro:', data);
        try {
            const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(data.idOfertaOficial);
            if (!cursoLocal) {
                throw new Error('Curso local no encontrado para el idOfertaOficial: ' + data.idOfertaOficial);
            }

            const resultado = await encuentroRepo.post({
                cursoId: cursoLocal._id,
                fecha: data.fecha,
                modalidad: data.modalidad,
                numero: data.numero
            })

            return resultado;
        }   catch (error) {     
            console.error('Error creando encuentro:', error.message);
            throw error;
        }
    }

    // encuentroService.js (ejemplo de flujo de eliminación)

    async delPorNumeroIdOfertaOficial(numero, cursoId) {
        // 1. Buscamos el encuentro para saber a qué curso pertenece antes de borrarlo
        try {
            const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(cursoId);
            if (!cursoLocal) {
                throw new Error('Curso local no encontrado para el idOfertaOficial: ' + cursoId);
            }
            const encuentro = await this.getUnoPorNumeroCursoId(cursoLocal._id, numero)        
            console.log('Encuentro encontrado para eliminación:', encuentro)
            if (!encuentro) {
                throw new Error('Encuentro no encontrado para cursoId: ' + cursoLocal._id + ' y número: ' + numero);
            }

            const resultado = await encuentroRepo.delPorId(encuentro._id);
            if (resultado.deletedCount === 0) {
                throw new Error('No se pudo eliminar el encuentro con id: ' + encuentro._id);
            }

            return { success: true };
        } catch (error) {
            console.error('Error eliminando encuentro:', error.message);
            throw error
        }
    }

    async putPorNumeroIdOfertaOficial(numero, cursoId, data) {
        try {
            const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(cursoId);
            if (!cursoLocal) {
                throw new Error('Curso local no encontrado para el idOfertaOficial: ' + cursoId);
            }
            const encuentro = await this.getUnoPorNumeroCursoId(cursoLocal._id, numero)        
            console.log('Encuentro encontrado para actualización:', encuentro)
            if (!encuentro) {
                throw new Error('Encuentro no encontrado para cursoId: ' + cursoLocal._id + ' y número: ' + numero);
            }  
            const resultado = await encuentroRepo.putPorId(encuentro._id, data);
            return resultado;
        } catch (error) {
            console.error('Error actualizando encuentro:', error.message);
            throw error;
        }
    }

    async actualizarMultiplesEncuentros(cursoId, fechas, modalidad) {
        try {
            console.log(`Iniciando actualización de ${fechas.length} encuentros para curso ${cursoId}`);
            
            const resultados = [];

            for (let i = 0; i < fechas.length; i++) {
                const numeroEncuentro = i + 1;
                const fechaNueva = fechas[i];

                // 1. Buscamos si ya existe el encuentro para ese curso y ese número
                const encuentroExistente = await encuentroRepo.getUnoPorNumeroCursoId(cursoId, numeroEncuentro);

                if (encuentroExistente) {
                    // 2. Si existe, lo actualizamos por su ID de encuentro
                    console.log(`Actualizando encuentro N°${numeroEncuentro} (ID: ${encuentroExistente._id})`);
                    const actualizado = await encuentroRepo.putPorId(encuentroExistente._id, {
                        fecha: fechaNueva,
                        modalidad: modalidad
                    });
                    resultados.push(actualizado);
                } else {
                    // 3. Si el usuario agregó un encuentro nuevo en la vista, lo creamos
                    console.log(`Creando nuevo encuentro N°${numeroEncuentro}`);
                    const nuevo = await encuentroRepo.post({
                        cursoId: cursoId,
                        numero: numeroEncuentro,
                        fecha: fechaNueva,
                        modalidad: modalidad
                    });
                    resultados.push(nuevo);
                }
            }

            // Opcional: Manejo de encuentros sobrantes
            // Si antes había 5 encuentros y ahora el usuario mandó 3, 
            // podrías agregar lógica aquí para borrar el 4 y 5.

            return resultados;
        } catch (error) {
            console.error('Error en actualizarMultiplesEncuentros:', error.message);
            throw error;
        }
    }

    async actualizarDesdeListaFechas(cursoId, listaFechas, modalidad) {
        try {
            // 1. Traemos lo que hay en DB para este curso
            const encuentrosExistentes = await encuentroRepo.getPorCursoId(cursoId);
            
            // Importante: Ordenarlos por número para que el índice coincida con el Front
            encuentrosExistentes.sort((a, b) => a.numero - b.numero);

            const resultados = [];

            // 2. Iteramos sobre el array de fechas que mandó el Front
            for (let i = 0; i < listaFechas.length; i++) {
                const fechaNueva = listaFechas[i];
                const numeroEncuentro = i + 1; // El número se genera por el orden del array
                
                const encuentroActual = encuentrosExistentes[i];

                if (encuentroActual) {
                    // Si existe el encuentro en esa posición, lo actualizamos
                    console.log(`Actualizando Encuentro N°${numeroEncuentro} con la fecha ${fechaNueva}`);
                    
                    const actualizado = await encuentroRepo.putPorId(encuentroActual._id, {
                        fecha: fechaNueva
                    });
                    resultados.push(actualizado);
                } else {
                    // Si el array del front es más largo que lo que había en DB, creamos uno nuevo
                    console.log(`Creando nuevo Encuentro N°${numeroEncuentro}`);
                    
                    const nuevo = await encuentroRepo.post({
                        cursoId: cursoId,
                        numero: numeroEncuentro,
                        fecha: fechaNueva,
                        modalidad: modalidad
                    });
                    resultados.push(nuevo);
                }
            }

            // 3. Si el usuario eliminó fechas en el Front, borramos los encuentros que sobran
            if (encuentrosExistentes.length > listaFechas.length) {
                const encuentrosParaBorrar = encuentrosExistentes.slice(listaFechas.length);
                for (const enc of encuentrosParaBorrar) {
                    await encuentroRepo.delPorId(enc._id);
                }
            }

            return resultados;
        } catch (error) {
            console.error('Error al sincronizar lista de fechas:', error.message);
            throw error;
        }
    }
}

module.exports = new encuentroService();