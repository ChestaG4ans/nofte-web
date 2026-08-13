# NOFTe Web

Aplikasi web prototype NOFTe - Smart Kitchen Management

## Fitur

- 📊 Dashboard - Overview kitchen score
- 📷 Scan - Scan bahan makanan
- 📋 Inventory - Daftar bahan makanan
- 📅 Kadaluarsa - Monitoring kadaluarsa
- 💬 AI Chat - Asisten dapur pintar (Groq/Llama)
- ⚙️ Settings - Pengaturan aplikasi

## Deployment

### Frontend (Cloudflare Pages)
1. Push repo ke GitHub
2. Buka https://dash.cloudflare.com
3. Workers & Pages → Create Application → Pages
4. Connect to GitHub → Deploy

### Backend API (Cloudflare Worker)
1. cd cloudflare
2. wrangler login
3. wrangler secret put GROQ_API_KEY
4. wrangler deploy

## Konfigurasi

Edit `config.js` untuk mengubah URL API:
```javascript
const CONFIG = {
    API_URL: "https://your-worker.workers.dev",
    CHAT_API_URL: "https://your-worker.workers.dev/api/chat",
};
```

## Teknologi

- HTML5, CSS3, JavaScript
- Cloudflare Pages (Frontend)
- Cloudflare Workers (Backend)
- Groq API (AI - Llama 3.1)
