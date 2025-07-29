// Configuración de la API
const Config = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost/utepsa_certificados/backend/src/',
    
    // Endpoints
    ENDPOINTS: {
        LOGIN: 'login.php',
        CERTIFICADOS: 'certificados.php',
        DOWNLOAD: 'download.php'
    },
    
    // URL completa para login
    getLoginUrl() {
        return this.API_BASE_URL + this.ENDPOINTS.LOGIN;
    },
    
    // URL completa para certificados
    getCertificadosUrl() {
        return this.API_BASE_URL + this.ENDPOINTS.CERTIFICADOS;
    },
    
    // URL completa para descarga
    getDownloadUrl() {
        return this.API_BASE_URL + this.ENDPOINTS.DOWNLOAD;
    }
};

export default Config;
