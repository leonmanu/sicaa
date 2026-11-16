const mongoose = require('mongoose')

const CredencialSitioSchema = new mongoose.Schema({
    sitioNombre: { type: String, required: true }, // 'ABC' (portal de inscripción, ej: ciie06901), 'DFDP' o 'DRUPAL'
    usuario: { type: String, required: true },
    password: { type: String, required: true },    // Recordá encriptar antes de guardar
    baseUrl: String,                               // Solo Drupal: cada institución entra por una URL distinta
    ultimaSincronizacion: { type: Date, default: Date.now }
})

// Conexión con Meta para publicar en las redes PROPIAS de la institución.
// El token es el de un usuario del sistema del Business Manager del CIIE
// (no vence); se guarda cifrado con credencialCrypto, igual que wrappingConfigs.
const RedesSocialesSchema = new mongoose.Schema({
    token: String,
    facebookPageId: String,
    facebookPageNombre: String,
    instagramId: String,
    instagramUsuario: String,
    verificadoEn: Date
}, { _id: false })

const CiieSchema = new mongoose.Schema({
    clave: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    distrito: { type: String, required: true },
    localidad: { type: String, required: true },
    region: { type: String, required: true },
    sede: { type: String, required: false },
    direccion: String,
    telefono: String,
    // Identificadores de esta institución en el sitio oficial de formación permanente
    qi: String,        // parámetro qi / idciie de las URLs (Laferrere: '65')
    regionAbc: String, // id de región del nomenclador oficial (Laferrere: '3')
// Ahora es un Array de configuraciones
    wrappingConfigs: [CredencialSitioSchema],
    redesSociales: { type: RedesSocialesSchema, default: undefined }
})

module.exports = mongoose.models.Ciie || mongoose.model('Ciie', CiieSchema);