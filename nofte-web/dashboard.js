// Dashboard JavaScript - Connects to NoFTe Backend

document.addEventListener("DOMContentLoaded", async () => {
    await loadDashboardData();
    updateGreeting();
});

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = "Selamat Datang";
    if (hour >= 5 && hour < 12) greeting = "Selamat Pagi";
    else if (hour >= 12 && hour < 15) greeting = "Selamat Siang";
    else if (hour >= 15 && hour < 18) greeting = "Selamat Sore";
    else greeting = "Selamat Malam";

    const user = getUser();
    const name = user?.name || "Chesta";
    const h1 = document.querySelector('.header-left h1');
    if (h1) {
        h1.innerHTML = `${greeting}, ${name} &#128075;`;
    }
}

async function loadDashboardData() {
    const token = getToken();
    if (!token) {
        logout();
        return;
    }

    try {
        const [historyRes, inventoryRes] = await Promise.all([
            apiRequest('/history'),
            apiRequest('/inventory')
        ]);

        if (historyRes.status === 401 || inventoryRes.status === 401) {
            logout();
            return;
        }

        if (!historyRes.ok || !inventoryRes.ok) {
            throw new Error("Gagal memuat data.");
        }

        const histories = await historyRes.json();
        const inventories = await inventoryRes.json();

        renderStats(histories);
        renderRecent(histories);
        renderInventoryPreview(inventories);
    } catch (error) {
        console.error("Dashboard Error:", error);
        // Show mock data for demo
        showMockData();
    }
}

function renderStats(histories) {
    const totalEl = document.getElementById("statTotalScan");
    const safeEl = document.getElementById("statSafeFood");
    const expiringEl = document.getElementById("statExpiring");

    let totalScan = 0, safeCount = 0, expiringCount = 0;

    (histories || []).forEach((item) => {
        totalScan++;
        try {
            const parsed = JSON.parse(item.scan_result || "{}");
            if (Array.isArray(parsed.foods)) {
                parsed.foods.forEach(food => {
                    const freshness = String(food.freshness || "").toLowerCase();
                    if (freshness.includes("fresh") || freshness.includes("segar")) safeCount++;

                    const shelf = String(food.shelf_life || "");
                    const m = shelf.match(/\d+/);
                    if (m && Number(m[0]) <= 3) expiringCount++;
                });
            }
        } catch (_) {}
    });

    if (totalEl) totalEl.textContent = totalScan || "0";
    if (safeEl) safeEl.textContent = safeCount || "0";
    if (expiringEl) expiringEl.textContent = expiringCount || "0";
}

function renderRecent(histories) {
    const container = document.getElementById("recentGrid");
    if (!container) return;

    const rows = [];

    (histories || []).forEach((item) => {
        try {
            const parsed = JSON.parse(item.scan_result || "{}");
            if (Array.isArray(parsed.foods)) {
                parsed.foods.forEach(food => {
                    let days = 7;
                    const m = String(food.shelf_life || "").match(/\d+/);
                    if (m) days = Number(m[0]);
                    rows.push({ name: food.name || "Makanan", days });
                });
            }
        } catch (_) {}
    });

    rows.sort((a, b) => a.days - b.days);

    if (!rows.length) {
        container.innerHTML = `
            <div class="list-item">
                <div class="list-icon">&#128247;</div>
                <div class="list-info">
                    <h4>Belum ada scan</h4>
                    <span>Mulai scan makanan pertama Anda</span>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = rows.slice(0, 5).map((item) => {
        let badgeClass = "badge-success";
        let badgeText = item.days + " Hari";
        if (item.days <= 1) {
            badgeClass = "badge-danger";
        } else if (item.days <= 3) {
            badgeClass = "badge-warning";
        }

        return `
            <div class="list-item">
                <div class="list-icon">${getFoodIcon(item.name)}</div>
                <div class="list-info">
                    <h4>${escapeHtml(item.name)}</h4>
                    <span>Segar - ${item.days} hari lagi</span>
                </div>
                <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
        `;
    }).join('');
}

function renderInventoryPreview(items) {
    const container = document.getElementById("inventoryPreview");
    if (!container) return;

    if (!(items || []).length) {
        container.innerHTML = `
            <div class="inventory-card">
                <span class="inventory-icon">&#128230;</span>
                <h3>Belum Ada</h3>
                <span>Tambahkan makanan</span>
            </div>
        `;
        return;
    }

    container.innerHTML = items.slice(0, 4).map((item) => `
        <div class="inventory-card">
            <span class="inventory-icon">${getFoodIcon(item.name)}</span>
            <h3>${escapeHtml(item.name)}</h3>
            <span>${item.quantity} ${escapeHtml(item.unit)}</span>
        </div>
    `).join('');
}

function showMockData() {
    // Show demo data when backend is not available
    console.log("Showing mock data - backend not connected");
}

function getFoodIcon(name) {
    const n = (name || "").toLowerCase();
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
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
