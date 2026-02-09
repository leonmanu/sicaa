// utils/cuilHelper.js
class CuilHelper {
    /**
     * Extrae el DNI del CUIL
     * Formato CUIL: XX-XXXXXXXX-X (ej: 20-27874500-8)
     * Sin guiones: XXXXXXXXXXXX (ej: 20278745008)
     */
    static extraerDNI(cuil) {
        if (!cuil) return '';
        
        // Remover cualquier guión o espacio
        const cuilLimpio = cuil.replace(/[-\s]/g, '');
        
        // Validar longitud (debe ser 11 dígitos)
        if (cuilLimpio.length !== 11) {
            console.warn(`CUIL inválido: ${cuil}`);
            return '';
        }
        
        // Extraer del dígito 3 al 10 (8 dígitos del DNI)
        const dni = cuilLimpio.substring(2, 10);
        
        return dni;
    }
    
    /**
     * Valida formato de CUIL
     */
    static esValido(cuil) {
        if (!cuil) return false;
        const cuilLimpio = cuil.replace(/[-\s]/g, '');
        return /^\d{11}$/.test(cuilLimpio);
    }
    
    /**
     * Formatea CUIL con guiones
     */
    static formatear(cuil) {
        if (!cuil) return '';
        const cuilLimpio = cuil.replace(/[-\s]/g, '');
        
        if (cuilLimpio.length !== 11) return cuil;
        
        return `${cuilLimpio.substring(0, 2)}-${cuilLimpio.substring(2, 10)}-${cuilLimpio.substring(10)}`;
    }
}

module.exports = CuilHelper;