// History JavaScript - Connects to NoFTe Backend

const searchInput = document.getElementById("searchFood");
const historyList = document.getElementById("historyList");

let cachedItems = [];

document.addEventListener("DOMContentLoaded", async () => {
    await loadHistory();
    if (searchInput) {
        searchInput.addEventListener("keyup", filterItems);
    }
});

async function loadHistory() {
    const token = getToken();
    if (!token) {
        logout();
        return;
    }

    if (historyList) {
        historyList.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">&#128247;</div>
                <p style="color: var(--text-secondary);">Memuat riwayat...</p>
            </div>
        `;
    }

    try {
        const response = await apiRequest('/history');

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Gagal memuat riwayat.");
        }

        const histories = await response.json();
        renderHistory(histories);
    } catch (error) {
        console.error("History Error:", error);
        if (historyList) {
            historyList.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">&#9888;</div>
                    <p style="color: var(--danger);">Gagal memuat riwayat.</p>
                    <small style="color: var(--text-muted);">Pastikan backend NoFTe berjalan</small>
                </div>
            `;
        }
    }
}

function renderHistory(histories) {
    if (!historyList) return;

    if (!histories || !histories.length) {
        historyList.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 16px;">&#128196;</div>
                <p>Belum ada riwayat scan.</p>
                <small style="color: var(--text-muted);">Scan makanan pertama Anda</small>
            </div>
        `;
        cachedItems = [];
        return;
    }

    historyList.innerHTML = '';
    cachedItems = [];

    histories.forEach((item) => {
        const date = new Date(item.created_at);
        const dateText = Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        let food = { name: "-", freshness: "-", confidence: null };
        try {
            const parsed = JSON.parse(item.scan_result || "{}");
            if (Array.isArray(parsed.foods) && parsed.foods.length > 0) {
                food = parsed.foods[0];
            }
        } catch (_) {}

        const confidenceText = typeof food.confidence === "number" ? `${Math.round(food.confidence * 100)}%` : "-";

        let badgeClass = "badge-warning";
        let badgeText = food.freshness || "-";
        if (String(badgeText).toLowerCase().includes("fresh") || String(badgeText).toLowerCase().includes("segar")) {
            badgeClass = "badge-success";
        } else if (String(badgeText).toLowerCase().includes("expired") || String(badgeText).toLowerCase().includes("kadaluarsa")) {
            badgeClass = "badge-danger";
        }

        const div = document.createElement("div");
        div.className = "list-item";
        div.innerHTML = `
            <div class="list-icon">${getFoodIcon(food.name || "")}</div>
            <div class="list-info">
                <h4>${escapeHtml(food.name || "-")}</h4>
                <span>${dateText} • Akurasi ${confidenceText}</span>
            </div>
            <span class="badge ${badgeClass}">${escapeHtml(badgeText)}</span>
        `;
        historyList.appendChild(div);
        cachedItems.push({
            el: div,
            text: `${food.name} ${badgeText}`.toLowerCase()
        });
    });
}

function filterItems() {
    const keyword = (searchInput.value || "").toLowerCase();
    cachedItems.forEach((item) => {
        item.el.style.display = item.text.includes(keyword) ? "flex" : "none";
    });
}

function getFoodIcon(name) {
    const n = name.toLowerCase();
    if (n.includes('apel')) return '&#127822;';
    if (n.includes('pisang')) return '&#127820;';
    if (n.includes('tomat')) return '&#127813;';
    if (n.includes('wortel')) return '&#129365;';
    if (n.includes('brokoli')) return '&#129388;';
    if (n.includes('susu')) return '&#127968;';
    if (n.includes('telur')) return '&#129370;';
    if (n.includes('ayam')) return '&#127831;';
    if (n.includes('ikan')) return '&#128031;';
    if (n.includes('nasi')) return '&#127838;';
    if (n.includes('roti')) return '&#127838;';
    if (n.includes('keju')) return '&#129472;';
    if (n.includes('sayur')) return '&#129389;';
    return '&#127829;';
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
