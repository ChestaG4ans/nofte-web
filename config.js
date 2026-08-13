// NOFTe Configuration
// Update these URLs after deploying to Cloudflare

const CONFIG = {
    // Backend API URLs
    // For production: Change these to your Cloudflare Worker URL
    API_URL: "https://nofte-api.chestagans.workers.dev", // TODO: Update with your Worker URL
    CHAT_API_URL: "https://nofte-api.chestagans.workers.dev/api/chat", // TODO: Update with your Worker URL

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
