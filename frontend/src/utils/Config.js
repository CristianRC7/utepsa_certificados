// Configuración de la API
const Config = {
    API_BASE_URL: 'http://localhost/utepsa_certificados/backend/src/',
    
    // Endpoints
    ENDPOINTS: {
        LOGIN: 'login.php',
        CERTIFICADOS: 'certificados.php'
    },
    
    // URL completa para login
    getLoginUrl() {
        return this.API_BASE_URL + this.ENDPOINTS.LOGIN;
    },
    
    // URL completa para certificados
    getCertificadosUrl() {
        return this.API_BASE_URL + this.ENDPOINTS.CERTIFICADOS;
    }
};

export default Config;
