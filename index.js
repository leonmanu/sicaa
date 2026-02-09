const app = require('./src/app');
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Sistema modular listo en http://localhost:${PORT}/mis-cursos`);
});