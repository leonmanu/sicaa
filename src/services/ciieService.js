const ciieRepo = require('../repos/ciieRepo');

class CiieService {
    
    async postCiie(datosForm, usuarioGoogle) {
        try {
            // 1. Mapeamos los datos del array 'externo' del formulario
            // Recordá que datosForm.externo[0] es DFDP y [1] es ABC
            const configsMapeadas = [
                {
                    sitioNombre: 'DFDP',
                    usuario: datosForm.externo[0].u,
                    password: datosForm.externo[0].p, // Aquí podrías aplicar cifrado luego
                    ultimaSincronizacion: new Date()
                },
                {
                    sitioNombre: 'ABC',
                    usuario: datosForm.externo[1].u,
                    password: datosForm.externo[1].p,
                    ultimaSincronizacion: new Date()
                }
            ];

            // 2. Construimos el objeto para el Repo
            // Usamos los datos de usuarioGoogle para los campos que el usuario no puede editar (readonly)
            const objetoCiie = {
                clave: usuarioGoogle.clave,           // Generado en el auth
                numero: usuarioGoogle.numeroSede || 0, // Extraído del mail en el auth
                nombre: usuarioGoogle.nombre,          // "CIIE La Matanza"
                distrito: usuarioGoogle.distrito,
                region: usuarioGoogle.region,
                emailInstitucional: usuarioGoogle.email,
                // Si agregaste dirección o teléfono opcionales en el form, irían aquí:
                direccion: datosForm.direccion || "",
                telefono: datosForm.telefono || "",
                wrappingConfigs: configsMapeadas
            };

            // 3. Guardamos en el Repo
            const nuevoCiie = await ciieRepo.postCiie(objetoCiie);
            
            return nuevoCiie;
        } catch (error) {
            console.error('Error al procesar el alta del CIIE en Service:', error);
            throw error;
        }
    }

    async getPorClave(clave) {
        try {
            return await ciieRepo.getPorClave(clave)
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new CiieService();