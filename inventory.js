// Inventory JavaScript - Demo Mode
const API_URL = window.API_URL || "https://nofte-api.chestaadabikarnen03.workers.dev";

const inventoryForm = document.getElementById("inventoryForm");
const inventoryGrid = document.getElementById("inventoryGrid");
const inventoryMessage = document.getElementById("inventoryMessage");

// Demo inventory data
let inventoryItems = [
    { id: 1, name: "Tomat", quantity: 5, unit: "buah", expiry_days: 2, status: "critical" },
    { id: 2, name: "Bayam", quantity: 200, unit: "gram", expiry_days: 1, status: "critical" },
    { id: 3, name: "Telur", quantity: 6, unit: "buah", expiry_days: 3, status: "soon" },
    { id: 4, name: "Susu", quantity: 1, unit: "liter", expiry_days: 5, status: "soon" },
    { id: 5, name: "Ayam", quantity: 500, unit: "gram", expiry_days: 7, status: "fresh" },
    { id: 6, name: "Wortel", quantity: 3, unit: "buah", expiry_days: 10, status: "fresh" },
];

document.addEventListener("DOMContentLoaded", async () => {
    loadInventory();

    if (inventoryForm) {
        inventoryForm.addEventListener("submit", onSubmitInventory);
    }

    // Set default date
    const dateInput = document.getElementById("itemDate");
    if (dateInput) dateInput.valueAsDate = new Date();
});

async function loadInventory() {
    if (inventoryGrid) {
        inventoryGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
                <p style="color: var(--text-secondary);">Memuat inventory...</p>
            </div>
        `;
    }

    try {
        // Try to fetch from API
        const response = await fetch(`${API_URL}/inventory`);

        if (response.ok) {
            inventoryItems = await response.json();
        }
    } catch (error) {
        console.log("Using demo inventory data");
    }

    // Small delay for loading effect
    setTimeout(() => {
        renderInventory(inventoryItems);
        generateRecommendations(inventoryItems);
        updateWasteCalculator(inventoryItems);
    }, 300);
}

function renderInventory(items) {
    if (!inventoryGrid) return;

    if (!items || !items.length) {
        inventoryGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 16px;">📦</div>
                <p>Inventory kosong</p>
                <small style="color: var(--text-muted);">Tambahkan makanan pertama Anda</small>
            </div>
        `;
        return;
    }

    inventoryGrid.innerHTML = items.map((item) => {
        const daysLeft = item.expiry_days || 0;
        let badgeClass = "badge-success";
        let badgeText = daysLeft + " hari";

        if (daysLeft <= 0) {
            badgeClass = "badge-danger";
            badgeText = "Expired";
        } else if (daysLeft <= 3) {
            badgeClass = "badge-danger";
        } else if (daysLeft <= 7) {
            badgeClass = "badge-warning";
        }

        const expiryDate = calculateExpiryDate(daysLeft);

        return `
            <div class="inventory-card">
                <span class="inventory-icon">${getFoodIcon(item.name)}</span>
                <h3>${escapeHtml(item.name)}</h3>
                <span>${item.quantity} ${escapeHtml(item.unit)}</span>
                <div style="margin-top: 8px;">
                    <span class="badge ${badgeClass}">${badgeText}</span>
                </div>
                <p style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">${expiryDate}</p>
            </div>
        `;
    }).join('');
}

function onSubmitInventory(event) {
    event.preventDefault();

    const name = document.getElementById("itemName")?.value.trim();
    const qty = document.getElementById("itemQty")?.value || 1;
    const unit = document.getElementById("itemUnit")?.value.trim() || "Item";

    if (!name) {
        if (inventoryMessage) {
            inventoryMessage.textContent = "Nama harus diisi.";
            inventoryMessage.style.color = "var(--danger)";
        }
        return;
    }

    // Add to local inventory
    const newItem = {
        id: Date.now(),
        name: name,
        quantity: Number(qty),
        unit: unit,
        expiry_days: 7,
        status: "fresh"
    };

    inventoryItems.unshift(newItem);
    renderInventory(inventoryItems);
    generateRecommendations(inventoryItems);
    updateWasteCalculator(inventoryItems);

    if (inventoryForm) inventoryForm.reset();
    const dateInput = document.getElementById("itemDate");
    if (dateInput) dateInput.valueAsDate = new Date();

    if (inventoryMessage) {
        inventoryMessage.textContent = "Berhasil ditambahkan!";
        inventoryMessage.style.color = "var(--success)";

        setTimeout(() => {
            inventoryMessage.textContent = "";
        }, 3000);
    }
}

function generateRecommendations(items) {
    const container = document.getElementById('recommendationList');
    if (!container) return;

    if (!items || !items.length) {
        container.innerHTML = `
            <div class="rec-item">
                <span class="rec-icon">📦</span>
                <div class="rec-content">
                    <h4>Inventory Kosong</h4>
                    <p>Tambahkan makanan untuk rekomendasi AI</p>
                </div>
            </div>`;
        return;
    }

    const sorted = [...items].sort((a, b) => (a.expiry_days || 0) - (b.expiry_days || 0));
    const urgent = sorted.filter(i => (i.expiry_days || 0) <= 3);
    const warning = sorted.filter(i => (i.expiry_days || 0) > 3 && (i.expiry_days || 0) <= 7);

    let html = '';

    if (urgent.length) {
        html += `<div class="rec-item urgent">
            <span class="rec-icon">🔥</span>
            <div class="rec-content">
                <h4>Konsumsi Sekarang</h4>
                <p>${urgent.map(i => `${i.name} (${i.expiry_days} hari)`).join(', ')}</p>
                <span class="rec-suggestion">→ Gunakan dalam menu hari ini</span>
            </div>
        </div>`;
    }

    if (warning.length) {
        html += `<div class="rec-item warning">
            <span class="rec-icon">⚠️</span>
            <div class="rec-content">
                <h4>Rencanakan Penggunaan</h4>
                <p>${warning.slice(0, 3).map(i => `${i.name} (${i.expiry_days} hari)`).join(', ')}</p>
                <span class="rec-suggestion">→ Masukkan dalam menu minggu ini</span>
            </div>
        </div>`;
    }

    container.innerHTML = html || `<div class="rec-item">
        <span class="rec-icon">✅</span>
        <div class="rec-content">
            <h4>Semua Aman</h4>
            <p>Tidak ada makanan yang segera expire</p>
        </div>
    </div>`;
}

function updateWasteCalculator(items) {
    const foodSavedEl = document.getElementById('calcFoodSaved');
    const mealsEl = document.getElementById('calcMealsPrevented');

    if (!items || !items.length) {
        if (foodSavedEl) foodSavedEl.textContent = '0 kg';
        if (mealsEl) mealsEl.textContent = '~0';
        return;
    }

    const urgent = items.filter(i => (i.expiry_days || 0) <= 3).length;
    const foodSaved = (urgent * 0.4 + (items.length - urgent) * 0.2).toFixed(1);

    if (foodSavedEl) foodSavedEl.textContent = `${foodSaved} kg`;
    if (mealsEl) mealsEl.textContent = `~${Math.round(urgent * 1.5)}`;
}

function calculateExpiryDate(daysLeft) {
    if (!daysLeft || daysLeft <= 0) return "Sudah kadaluarsa";
    const date = new Date();
    date.setDate(date.getDate() + daysLeft);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function getFoodIcon(name) {
    const n = (name || "").toLowerCase();
    if (n.includes('apel')) return '🍎';
    if (n.includes('pisang')) return '🍌';
    if (n.includes('tomat')) return '🍅';
    if (n.includes('wortel')) return '🥕';
    if (n.includes('brokoli')) return '🥦';
    if (n.includes('susu')) return '🥛';
    if (n.includes('telur')) return '🥚';
    if (n.includes('ayam')) return '🍗';
    if (n.includes('ikan')) return '🐟';
    if (n.includes('nasi')) return '🍚';
    if (n.includes('roti')) return '🍞';
    if (n.includes('keju')) return '🧀';
    if (n.includes('sayur')) return '🥬';
    return '🍳';
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
