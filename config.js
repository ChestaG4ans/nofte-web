// NOFTe Configuration
// Update these URLs after deploying to Cloudflare

const CONFIG = {
    // Backend API URLs - Cloudflare Worker
    API_URL: "https://nofte-api.chestaadabikarnen03.workers.dev",
    CHAT_API_URL: "https://nofte-api.chestaadabikarnen03.workers.dev/api/chat",

    // For local development (optional)
    isLocal: window.location.hostname === 'localhost',

    // Get the appropriate API URL
    getChatUrl() {
        // Always use Worker URL (no localhost fallback)
        return this.CHAT_API_URL;
    },
    getApiUrl() {
        // Always use Worker URL (no localhost fallback)
        return this.API_URL;
    }
};
