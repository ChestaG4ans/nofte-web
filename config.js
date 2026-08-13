// NOFTe Configuration
// Update these URLs after deploying to Cloudflare

const CONFIG = {
    // Backend API URLs - Cloudflare Worker
    API_URL: "https://nofte-api.chestaadabikarnen03.workers.dev",
    CHAT_API_URL: "https://nofte-api.chestaadabikarnen03.workers.dev/api/chat",

    // For local development, use localhost
    isLocal: window.location.hostname === 'localhost',

    // Get the appropriate API URL
    getChatUrl() {
        return this.isLocal ? "http://localhost:3000/api/chat" : this.CHAT_API_URL;
    },
    getApiUrl() {
        return this.isLocal ? "http://localhost:8000" : this.API_URL;
    }
};
