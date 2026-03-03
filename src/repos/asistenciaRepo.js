// inscriptoLocalRepo.js
const mongoose = require('mongoose');
const InscriptoLocal = require('../models/InscriptoLocal');

class AsistenciaRepo {
    /**
     * Ahora busca por DNI en lugar de _id
     */
    async postAsistenciaEncuentro(encuentroId, asistencias, cursoId) {
        try {
            // Convertimos el ID a ObjectId de Mongoose para que coincida con el esquema
            const oid = new mongoose.Types.ObjectId(encuentroId);

            const opsLimpieza = asistencias.map(asist => ({
                updateOne: {
                    filter: { dni: asist.dni, cursoId: cursoId },
                    update: { $pull: { asistencia: { encuentroId: oid } } }
                }
            }));

            const opsInsertar = asistencias.map(asist => ({
                updateOne: {
                    filter: { dni: asist.dni, cursoId: cursoId },
                    update: { 
                        $push: { 
                            asistencia: { 
                                encuentroId: oid, 
                                estado: asist.estado,
                                fecha: new Date() 
                            } 
                        } 
                    }
                }
            }));

            await InscriptoLocal.bulkWrite(opsLimpieza);
            return await InscriptoLocal.bulkWrite(opsInsertar);
        } catch (error) {
            console.error('Error en Repo Asistencia:', error.message);
            throw error;
        }
    }

    async postPorIdInscripcionOficial(encuentroId, asistencias) {
        try {
            const oid = new mongoose.Types.ObjectId(encuentroId);

            const opsLimpieza = asistencias.map(asist => ({
                updateOne: {
                    filter: { idInscripcionOficial: asist.idInscripcionOficial },
                    update: { $pull: { asistencia: { encuentroId: oid } } }
                }
            }));

            const opsInsertar = asistencias.map(asist => ({
                updateOne: {
                    filter: { idInscripcionOficial: asist.idInscripcionOficial },
                    update: { 
                        $push: { 
                            asistencia: { 
                                encuentroId: oid, 
                                estado: asist.estado,
                                fecha: new Date() 
                            } 
                        } 
                    }
                }
            }));

            await InscriptoLocal.bulkWrite(opsLimpieza);
            return await InscriptoLocal.bulkWrite(opsInsertar);
        } catch (error) {
            console.error('Error en Repo Asistencia:', error.message);
            throw error;
        }
    }

}

module.exports = new AsistenciaRepo();