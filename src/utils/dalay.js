// utils/delay.js
class DelayHelper {
    /**
     * Pausa aleatoria entre min y max milisegundos
     */
    static async random(min = 1000, max = 3000) {
        const ms = Math.floor(Math.random() * (max - min + 1)) + min;
        console.log(`⏳ Esperando ${(ms/1000).toFixed(1)}s...`);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Pausa fija
     */
    static async fixed(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Pausa incremental (se va haciendo más larga)
     */
    static async incremental(index, base = 1000, increment = 500) {
        const ms = base + (index * increment);
        console.log(`⏳ Pausa incremental: ${(ms/1000).toFixed(1)}s`);
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = DelayHelper;