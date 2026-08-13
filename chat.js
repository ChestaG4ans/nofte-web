// Chat JavaScript - NOFTe AI Assistant
// Connects to Cloudflare Worker

const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

// API URL - from auth.js
const CHAT_API_URL = (window.API_URL || "https://nofte-api.chestaadabikarnen03.workers.dev") + "/api/chat";

let isLoading = false;

if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
}

if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });
}

// Load chat history
loadChatHistory();

async function sendMessage() {
    if (isLoading) return;

    const message = chatInput ? chatInput.value.trim() : "";
    if (!message) return;

    isLoading = true;
    if (sendBtn) sendBtn.disabled = true;

    addMessage(escapeHtml(message), "user");
    if (chatInput) chatInput.value = "";

    const loading = addMessage("🤔 Memikirkan jawaban...", "ai");

    try {
        // Call backend chat endpoint
        const response = await fetch(CHAT_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        if (loading.parentNode) loading.remove();

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            addMessage(`⚠️ Error: ${data.error || "Terjadi kesalahan"}`, "ai");
        } else {
            const data = await response.json();
            addMessage(formatAIResponse(data.reply || "Tidak ada jawaban."), "ai");
        }

    } catch (err) {
        console.error("Chat Error:", err);
        if (loading.parentNode) loading.remove();
        addMessage("⚠️ Gagal terhubung ke server AI. Pastikan koneksi internet stabil.", "ai");
    }

    isLoading = false;
    if (sendBtn) sendBtn.disabled = false;
    saveChatHistory();
}

function formatAIResponse(text) {
    if (!text) return "🤖 Maaf, saya tidak dapat memproses jawaban ini.";

    let formatted = escapeHtml(text);
    // Format markdown-style text
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/\*(.+?)\*/g, "<em>$1</em>");
    formatted = formatted.replace(/`([^`]+)`/g, "<code style='background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px;'>$1</code>");
    // Format bullet points
    formatted = formatted.replace(/^[-•]\s(.+)$/gm, "<li>$1</li>");
    formatted = formatted.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
    // Line breaks
    formatted = formatted.replace(/\n/g, "<br>");

    return formatted;
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function addMessage(html, type) {
    if (!chatBox) return null;

    const div = document.createElement("div");
    div.className = `message ${type}`;
    div.innerHTML = html;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    return div;
}

function saveChatHistory() {
    if (chatBox) {
        localStorage.setItem("nofte_chat_history", chatBox.innerHTML);
    }
}

function loadChatHistory() {
    const history = localStorage.getItem("nofte_chat_history");
    if (history && chatBox) {
        chatBox.innerHTML = history;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function clearChat() {
    localStorage.removeItem("nofte_chat_history");
    if (chatBox) {
        chatBox.innerHTML = `
            <div class="message ai">
                👋 Halo!<br><br>
                Saya NOFTe, asisten dapur pintar Anda. Saya siap membantu Anda:<br><br>
                • Memberikan saran resep berdasarkan bahan yang ada<br>
                • Memberitahu tips menyimpan makanan<br>
                • Membantu mengatur bahan di kulkas<br><br>
                Ada yang bisa saya bantu?
            </div>
        `;
    }
}

window.clearChat = clearChat;
