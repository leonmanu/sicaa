// test.js
require('dotenv').config();
const inscriptoExternoService = require('./inscriptoExternoService');

async function test() {
    try {
        console.log('Probando scraping de ficha docente...\n');
        
        const resultado = await inscriptoExternoService.probarFichaDocente('555443');
        
        console.log('\n=== RESULTADO FINAL ===');
        console.log(JSON.stringify(resultado, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

test();