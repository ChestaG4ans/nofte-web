// Expiry JavaScript - Connects to NoFTe Backend

document.addEventListener("DOMContentLoaded", async () => {
    await loadExpiryData();
});

async function loadExpiryData() {
    const token = getToken();
    const expiryGrid = document.getElementById("expiryGrid");

    if (!token) {
        logout();
        return;
    }

    if (expiryGrid) {
        expiryGrid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">&#8987;</div>
                <p style="color: var(--text-secondary);">Memuat data...</p>
            </div>
        `;
    }

    try {
        const response = await apiRequest('/inventory');

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Gagal memuat data.");
        }

        const items = await response.json();
        renderExpiry(items);
        updateStats(items);
    } catch (error) {
        console.error("Expiry Error:", error);
        if (expiryGrid) {
            expiryGrid.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">&#9888;</div>
                    <p style="color: var(--danger);">Gagal memuat data.</p>
                    <small style="color: var(--text-muted);">Pastikan backend NoFTe berjalan</small>
                </div>
            `;
        }
    }
}

function updateStats(items) {
    let critical = 0, warning = 0, safe = 0;

    if (items && items.length) {
        items.forEach(item => {
            const days = item.expiry_days || 0;
            if (days <= 3) critical++;
            else if (days <= 7) warning++;
            else safe++;
        });
    }

    const cEl = document.getElementById("statCritical");
    const wEl = document.getElementById("statWarning");
    const sEl = document.getElementById("statSafe");
    if (cEl) cEl.textContent = critical;
    if (wEl) wEl.textContent = warning;
    if (sEl) sEl.textContent = safe;
}

function renderExpiry(items) {
    const expiryGrid = document.getElementById("expiryGrid");
    if (!expiryGrid) return;

    if (!items || !items.length) {
        expiryGrid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 16px;">&#128230;</div>
                <p>Inventory kosong</p>
                <small style="color: var(--text-muted);">Tambahkan makanan untuk melihat jadwal kadaluarsa</small>
            </div>
        `;
        return;
    }

    const sorted = [...items].sort((a, b) => (a.expiry_days || 0) - (b.expiry_days || 0));

    expiryGrid.innerHTML = sorted.map((item) => {
        const daysLeft = item.expiry_days || 0;
        let urgencyClass = "safe";
        let badgeClass = "badge-success";
        let daysText = daysLeft + " hari";

        if (daysLeft <= 0) {
            urgencyClass = "danger";
            badgeClass = "badge-danger";
            daysText = "Expired";
        } else if (daysLeft <= 3) {
            urgencyClass = "danger";
            badgeClass = "badge-danger";
        } else if (daysLeft <= 7) {
            urgencyClass = "warning";
            badgeClass = "badge-warning";
        }

        const expiryDate = calculateExpiryDate(daysLeft);

        return `
            <div class="expiry-item ${urgencyClass}">
                <div class="expiry-icon">${getFoodIcon(item.name)}</div>
                <div class="expiry-info">
                    <h4>${escapeHtml(item.name)}</h4>
                    <p>${item.quantity} ${escapeHtml(item.unit)} • ${expiryDate}</p>
                </div>
                <div class="expiry-days">
                    <span class="expiry-days-value">${daysLeft <= 0 ? '0' : daysLeft}</span>
                    <span class="expiry-days-label">${daysLeft <= 0 ? 'Expired' : 'hari'}</span>
                </div>
            </div>
        `;
    }).join('');
}

function calculateExpiryDate(daysLeft) {
    if (!daysLeft || daysLeft <= 0) return "Sudah kadaluarsa";
    const date = new Date();
    date.setDate(date.getDate() + daysLeft);
    return date.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });
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
    if (value === null || value === undefined) return "";
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
