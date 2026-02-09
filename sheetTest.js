const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

async function testConexion() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, 'google-credentials.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'ciie!A1:C1', // Lee la cabecera
        });
        console.log('✅ Conexión exitosa. Cabeceras:', res.data.values);
    } catch (err) {
        console.error('❌ Error de conexión:', err.message);
    }
}

testConexion();