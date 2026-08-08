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
            console.log(`⚠️ Esto tomará aprox. ${Math.ceil(dataParaProcesar.length * 2.5 / 60)} minutos`);

            const nuevosInscriptos = [];
            
            for (let i = 0; i < dataParaProcesar.length; i++) {
                const raw = dataParaProcesar[i];
                const idInscripcion = String(raw[0]);
                
                console.log(`[${i + 1}/${dataParaProcesar.length}] Procesando ${raw[1]}...`);
                
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

                // --- NORMALIZACIÓN DE DATOS (Mayúsculas con tildes) ---
                // Usamos .toUpperCase() que mantiene Á, É, Í, Ó, Ú y Ñ correctamente.
                const apellidoNormalizado = (detallesExtra.apelnom || raw[1] || '').trim().toUpperCase();
                const nombresNormalizados = (detallesExtra.nombres || '').trim().toUpperCase();

                nuevosInscriptos.push({
                    // IDs y referencias
                    idInscripcionOficial: idInscripcion,
                    cursoId: cursoLocal._id,
                    idOfertaOficial: cursoLocal.idOfertaOficial,
                    
                    // Datos identificatorios normalizados
                    cuil: cuil,
                    dni: dni, 
                    apellido: apellidoNormalizado,
                    nombres: nombresNormalizados,
                    fechaNacimiento: fechaNacimiento,
                    
                    // Datos de contacto (normalizamos email a minúscula por estándar)
                    domicilio: (detallesExtra.domicilio || '').trim().toUpperCase(),
                    telefono: detallesExtra.telefono || '',
                    email: (detallesExtra.email || raw[3] || '').trim().toLowerCase(),
                    emailAlternativo: (detallesExtra.emailalt || '').trim().toLowerCase(),
                    
                    // Datos de ubicación
                    localidad: (raw[2] || '').trim().toUpperCase(),
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
                    encuentros: [], 
                    totalEncuentros: 0,
                    asistenciasPresentes: 0,
                    porcentajeAsistencia: 0
                });

                // Pausa entre peticiones para no saturar el servidor oficial
                if (i < dataParaProcesar.length - 1) {
                    await Delay.random(1500, 3500);
                }
            }

            const resultado = await inscriptoLocalRepo.saveMany(nuevosInscriptos);
            
            console.log(`✅ ${nuevosInscriptos.length} inscriptos sincronizados y normalizados correctamente`);
            
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
            const inscriptosLocales = await inscriptoLocalRepo.getPorCursoId(cursoId);

            // Configuramos el comparador para español
            // 'es' indica español, sensitivity: 'base' compararía a=á, 
            // pero por defecto (sin sensitivity base) diferencia acentos correctamente según la RAE.
            const collator = new Intl.Collator('es', { 
                numeric: true, 
                sensitivity: 'accent' 
            });

            inscriptosLocales.sort((a, b) => {
                // 1. Comparar por Apellido
                let comparacion = collator.compare(a.apellido || '', b.apellido || '');
                
                // 2. Si los apellidos son iguales, comparar por Nombres
                if (comparacion === 0) {
                    comparacion = collator.compare(a.nombres || '', b.nombres || '');
                }

                // 3. Si nombres y apellidos son iguales, comparar por DNI
                if (comparacion === 0) {
                    comparacion = collator.compare(a.dni || '', b.dni || '');
                }

                return comparacion;
            });

            return inscriptosLocales;

        } catch (error) {
            console.error('Error obteniendo inscriptos ordenados:', error.message);
            throw error;
        }
    }

    async buscarCursantePorValor(valor, cursoId) {
        try {
            const limpio = (valor || '').replace(/\D/g, '');
            if (!limpio) return { datos: null, yaInscriptoEnCurso: false };

            const encontrado = await inscriptoLocalRepo.buscarUltimoPorDniOCuil(limpio);

            let yaInscriptoEnCurso = false;
            if (cursoId) {
                const dniAConsultar = encontrado?.dni || limpio;
                const existente = await inscriptoLocalRepo.existeEnCurso(cursoId, dniAConsultar);
                yaInscriptoEnCurso = !!existente;
            }

            return {
                datos: encontrado ? {
                    dni: encontrado.dni || '',
                    cuil: encontrado.cuil || '',
                    apellido: encontrado.apellido || '',
                    nombres: encontrado.nombres || '',
                    fechaNacimiento: encontrado.fechaNacimiento
                        ? new Date(encontrado.fechaNacimiento).toISOString().slice(0, 10)
                        : '',
                    domicilio: encontrado.domicilio || '',
                    telefono: encontrado.telefono || '',
                    email: encontrado.email || '',
                    emailAlternativo: encontrado.emailAlternativo || '',
                    localidad: encontrado.localidad || '',
                    anioEgreso: encontrado.anioEgreso || ''
                } : null,
                yaInscriptoEnCurso
            };
        } catch (error) {
            console.error('Error en InscriptoLocalService.buscarCursantePorValor:', error.message);
            throw error;
        }
    }

    // CIIE 201 (Laferrere) en el nomenclador de ABC: región 3, id de CIIE 65.
    static REGION_ABC_DEFAULT = '3';
    static IDCIIE_ABC_DEFAULT = '65';

    async altaManual(datosForm, idOfertaOficial, usuarioEmail) {
        try {
            const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(idOfertaOficial);
            if (!cursoLocal) throw new Error('No se encontró el curso.');

            const dni = (datosForm.dni || '').replace(/\D/g, '');
            if (!dni) throw new Error('El DNI es obligatorio.');
            const apellido = (datosForm.apellido || '').trim();
            const nombres = (datosForm.nombres || '').trim();
            if (!apellido || !nombres) {
                throw new Error('Apellido y Nombres son obligatorios.');
            }
            const cuil = (datosForm.cuil || '').replace(/\D/g, '');
            if (!cuil) throw new Error('El CUIL es obligatorio para inscribir en el sistema oficial.');
            const email = (datosForm.email || '').trim().toLowerCase();
            if (!email) throw new Error('El email es obligatorio para inscribir en el sistema oficial.');

            const yaExiste = await inscriptoLocalRepo.existeEnCurso(cursoLocal._id, dni);
            if (yaExiste) {
                throw new Error(`${yaExiste.apellido}, ${yaExiste.nombres} (DNI ${dni}) ya está inscripto/a en este curso.`);
            }

            const emailAlternativo = (datosForm.emailAlternativo || '').trim().toLowerCase();

            // 1. Inscripción real en el sistema oficial de ABC
            const resultadoAbc = await inscriptoExternoService.registrarInscripcion({
                apelnom: apellido,
                nombres,
                cuil,
                email,
                conmail: email,
                emailalt: emailAlternativo,
                conemailalt: emailAlternativo,
                telefono: (datosForm.telefono || '').trim(),
                domicilio: (datosForm.domicilio || '').trim(),
                fechanac: datosForm.fechaNacimiento || '',
                anioegre: (datosForm.anioEgreso || '').trim(),
                idcurso: cursoLocal.idCursoOriginal,
                idfechaciie: cursoLocal.idOfertaOficial,
                cohorte: cursoLocal.cohorte ?? '0',
                tipo: 'A',
                region: InscriptoLocalService.REGION_ABC_DEFAULT,
                idciie: InscriptoLocalService.IDCIIE_ABC_DEFAULT,
                couli: '1'
            });

            if (!resultadoAbc.exito) {
                throw new Error(`El sistema oficial rechazó la inscripción: ${resultadoAbc.mensaje}`);
            }

            // 2. Reflejo local, con el idInscripcionOficial real devuelto por ABC
            const nuevoInscripto = {
                idInscripcionOficial: resultadoAbc.idInscripcionOficial,
                cursoId: cursoLocal._id,
                idOfertaOficial: cursoLocal.idOfertaOficial,

                cuil,
                dni,
                apellido: apellido.toUpperCase(),
                nombres: nombres.toUpperCase(),
                fechaNacimiento: datosForm.fechaNacimiento ? new Date(datosForm.fechaNacimiento) : null,

                domicilio: (datosForm.domicilio || '').trim().toUpperCase(),
                telefono: (datosForm.telefono || '').trim(),
                email,
                emailAlternativo,

                localidad: (datosForm.localidad || '').trim().toUpperCase(),
                anioEgreso: (datosForm.anioEgreso || '').trim(),

                anioInscripcion: String(cursoLocal.anio || ''),
                cohorte: String(cursoLocal.cohorte || ''),

                creadoPor: usuarioEmail,
                calificacion: 'Sin Calificar',
                observaciones: 'Inscripción cargada manualmente (no se anotó en término) e informada al sistema oficial de ABC.'
            };

            return await inscriptoLocalRepo.post(nuevoInscripto);
        } catch (error) {
            if (error.code === 11000) {
                throw new Error('Ya existe una inscripción con esos datos.');
            }
            console.error('Error en InscriptoLocalService.altaManual:', error.message);
            throw error;
        }
    }

    async putCalificacion(idOfertaOficial, calificaciones) {
        try {        
            
            //console.log('Datos recibidos para nueva asistencia:', data);
            const cursoLocal = await cursoLocalService.getPorIdOfertaOficial(idOfertaOficial);
            if (!cursoLocal) {
                return res.status(404).json({ error: 'Curso no encontrado para la oferta oficial.' });
            }

            const resultado = await inscriptoLocalRepo.putCalificaciones(calificaciones);
            return resultado;
           
        } catch (error) {
            console.error('Error al guardar la calificación:', error);
            throw error;
        }
    }

}

module.exports = new InscriptoLocalService();