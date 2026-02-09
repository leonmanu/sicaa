// inscriptoLocalService
const cheerio = require('cheerio');
const cursoLocalService = require('../services/cursoLocalService')
const inscriptoLocalRepo = require('../repos/inscriptoLocalRepo');
const inscriptoExternoService = require('../services/inscriptoExternoService')
const Delay = require('../utils/dalay')
const CuilHelper = require('../utils/cuilHelper');

class InscriptoLocalService {

    
   async _obtenerDetallesFormulario(idInscripcionOficial, idOfertaOficial) {
    try {
        console.log(`\n🔍 Buscando detalles:`);
        console.log(`   - ID Inscripción: ${idInscripcionOficial}`);
        console.log(`   - ID Curso: ${idOfertaOficial}`);
        
        const response = await inscriptoExternoService.getDetalleCursantePorIdInscripcion(
            idInscripcionOficial,
            idOfertaOficial
        );
        
        const $ = cheerio.load(response.data);

        // Extraer TODOS los inputs, selects y textareas
        const todosDatos = {};
        
        console.log('\n=== TODOS LOS CAMPOS ENCONTRADOS ===');
        
        // Inputs
        $('input').each((i, el) => {
            const name = $(el).attr('name');
            const value = $(el).val();
            const type = $(el).attr('type');
            
            if (name) {
                todosDatos[name] = value?.trim() || '';
                console.log(`📝 input[${type}] "${name}": "${value}"`);
            }
        });
        
        // Selects (combos)
        $('select').each((i, el) => {
            const name = $(el).attr('name');
            const value = $(el).find('option:selected').val();
            const text = $(el).find('option:selected').text();
            
            if (name) {
                todosDatos[name] = value?.trim() || '';
                console.log(`📋 select "${name}": "${value}" (${text})`);
            }
        });
        
        // Textareas
        $('textarea').each((i, el) => {
            const name = $(el).attr('name');
            const value = $(el).text();
            
            if (name) {
                todosDatos[name] = value?.trim() || '';
                console.log(`📄 textarea "${name}": "${value}"`);
            }
        });
        
        // console.log('\n=== RESUMEN ===');
        // console.log(JSON.stringify(todosDatos, null, 2));
        
        return todosDatos;
        
    } catch (error) {
        console.error(`Error buscando detalle para ${idInscripcionOficial}:`, error.message);
        return {};
    }
}

    async vincularColeccion(dataArray, idOfertaOficial, usuarioEmail) {
        try {
            console.log(`DEBUG - Procesando ${dataArray.length} inscriptos para el curso ${idOfertaOficial}`);
            
            const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(idOfertaOficial);
            
            // Filtrar existentes
            const existentes = await inscriptoLocalRepo.getPorCursoId(cursoLocal._id);
            const idsExistentes = existentes.map(e => String(e.idInscripcionOficial));
            const dataParaProcesar = dataArray.filter(raw => !idsExistentes.includes(String(raw[0])));
            
            if (dataParaProcesar.length === 0) {
                return { message: "No hay nuevas inscripciones para vincular", count: 0 };
            }

            console.log(`📥 Sincronizando detalles de ${dataParaProcesar.length} nuevos inscriptos...`);
            console.log(`⚠️  Esto tomará aprox. ${Math.ceil(dataParaProcesar.length * 2.5 / 60)} minutos`);

            const nuevosInscriptos = [];
            
            for (let i = 0; i < dataParaProcesar.length; i++) {
                const raw = dataParaProcesar[i];
                const idInscripcion = String(raw[0]);
                
                console.log(`[${i + 1}/${dataParaProcesar.length}] Procesando ${raw[1]}...`);
                
                // PASAR EL ID DEL CURSO TAMBIÉN
                const detallesExtra = await this._obtenerDetallesFormulario(
                    idInscripcion,
                    idOfertaOficial
                );

                // Parsear fecha de nacimiento
                let fechaNacimiento = null;
                if (detallesExtra.fechanac) {
                    fechaNacimiento = new Date(detallesExtra.fechanac);
                }

                // Extraer DNI del CUIL
                const cuil = detallesExtra.cuil || '';
                const dni = CuilHelper.extraerDNI(cuil);

                nuevosInscriptos.push({
                    // IDs y referencias
                    idInscripcionOficial: idInscripcion,
                    cursoId: cursoLocal._id,
                    idOfertaOficial: cursoLocal.idOfertaOficial,
                    
                    // Datos identificatorios
                    cuil: cuil,
                    dni: dni, // ← DNI extraído automáticamente
                    apellido: detallesExtra.apelnom || raw[1],
                    nombres: detallesExtra.nombres || '',
                    fechaNacimiento: fechaNacimiento,
                    
                    // Datos de contacto
                    domicilio: detallesExtra.domicilio || '',
                    telefono: detallesExtra.telefono || '',
                    email: detallesExtra.email || raw[3],
                    emailAlternativo: detallesExtra.emailalt || '',
                    
                    // Datos de ubicación
                    localidad: raw[2] || '',
                    codigoCiudad: detallesExtra.cbx_ciudad || '',
                    
                    // Datos académicos
                    anioEgreso: detallesExtra.anioegre || '',
                    
                    // Metadatos del ABC
                    iddocenteOficial: detallesExtra.iddocente || '',
                    idCursoOficial: detallesExtra.idcurso || '',
                    anioInscripcion: detallesExtra.anio || '',
                    cohorte: detallesExtra.cohorte || '',
                    
                    // Gestión del CIIE
                    creadoPor: usuarioEmail,
                    calificacion: 'Sin Calificar',
                    encuentros: [], // Inicialmente vacío, se llena después
                    totalEncuentros: 0,
                    asistenciasPresentes: 0,
                    porcentajeAsistencia: 0
                });

                // Pausa entre peticiones
                if (i < dataParaProcesar.length - 1) {
                    await Delay.random(1500, 3500);
                }
            }

            const resultado = await inscriptoLocalRepo.saveMany(nuevosInscriptos);
            
            console.log(`✅ ${nuevosInscriptos.length} inscriptos sincronizados correctamente`);
            
            return {
                message: "Vinculación y sincronización exitosa",
                count: nuevosInscriptos.length,
                data: resultado
            };
            
        } catch (error) {
            console.error('Error en vincularColeccion:', error);
            throw error;
        }
    }

    async getIdInscripcionPorCursoId(ofertaId) {
            try {
                return await inscriptoLocalRepo.getIdInscripcionPorCursoId(ofertaId)
            } catch (error) {
                console.error('Error obteniendo cursos por clave de cargo y CIIE:', error.message)
                throw error;
            }
        }

    async getPorIdOfertaOficial(ofertaId) {
            try {
                return await inscriptoLocalRepo.getPorIdOfertaOficial(ofertaId)
            } catch (error) {
                console.error('Error obteniendo cursos por clave de cargo y CIIE:', error.message)
                throw error;
            }
        }
    
    async getPorCursoId(cursoId) {
            try {
                return await inscriptoLocalRepo.getPorCursoId(cursoId)
            } catch (error) {
                console.error('Error obteniendo cursos por clave de cargo y CIIE:', error.message)
                throw error;
            }
        }
}

module.exports = new InscriptoLocalService();