// repos/usuarioRepo.js
const { sheets, spreadsheetId } = require('../config/googleConfig');
const { RANGOS } = require('../config/hojas');

class UsuarioRepo {
    constructor() {
        this.sheets = sheets;
        this.spreadsheetId = spreadsheetId;
        this.range = RANGOS.USUARIOS;
    }

    async obtenerTodasLasFilas() {
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: this.range,
        });
        return response.data.values || [];
    }

    async insertarFila(valores) {
        return await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: this.range,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [valores] },
        });
    }
}

module.exports = new UsuarioRepo();