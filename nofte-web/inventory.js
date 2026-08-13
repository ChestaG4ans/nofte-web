// Inventory JavaScript - Connects to NoFTe Backend

const inventoryForm = document.getElementById("inventoryForm");
const inventoryGrid = document.getElementById("inventoryGrid");
const inventoryMessage = document.getElementById("inventoryMessage");

document.addEventListener("DOMContentLoaded", async () => {
    await loadInventory();
    if (inventoryForm) {
        inventoryForm.addEventListener("submit", onSubmitInventory);
    }
    // Set default date
    const dateInput = document.getElementById("itemDate");
    if (dateInput) dateInput.valueAsDate = new Date();
});

async function loadInventory() {
    const token = getToken();
    if (!token) {
        logout();
        return;
    }

    if (inventoryGrid) {
        inventoryGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">&#8987;</div>
                <p style="color: var(--text-secondary);">Memuat inventory...</p>
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
            throw new Error("Gagal memuat inventory.");
        }

        const items = await response.json();
        renderInventory(items);
        generateRecommendations(items);
        updateWasteCalculator(items);
    } catch (error) {
        console.error("Inventory Error:", error);
        if (inventoryGrid) {
            inventoryGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">&#9888;</div>
                    <p style="color: var(--danger);">Gagal memuat inventory.</p>
                    <small style="color: var(--text-muted);">Pastikan backend NoFTe berjalan</small>
                </div>
            `;
        }
    }
}

function renderInventory(items) {
    if (!inventoryGrid) return;

    if (!items || !items.length) {
        inventoryGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 16px;">&#128230;</div>
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

async function onSubmitInventory(event) {
    event.preventDefault();
    const token = getToken();
    if (!token) {
        logout();
        return;
    }

    const payload = {
        name: document.getElementById("itemName").value.trim(),
        quantity: Number(document.getElementById("itemQty").value) || 1,
        unit: document.getElementById("itemUnit").value.trim() || "Item",
        expiry_days: 7
    };

    if (!payload.name) {
        if (inventoryMessage) {
            inventoryMessage.textContent = "Nama harus diisi.";
            inventoryMessage.style.color = "var(--danger)";
        }
        return;
    }

    if (inventoryMessage) {
        inventoryMessage.textContent = "Menyimpan...";
        inventoryMessage.style.color = "var(--text-secondary)";
    }

    try {
        const response = await apiRequest('/inventory', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Gagal menambah.");
        }

        if (inventoryForm) inventoryForm.reset();
        const dateInput = document.getElementById("itemDate");
        if (dateInput) dateInput.valueAsDate = new Date();

        if (inventoryMessage) {
            inventoryMessage.textContent = "Berhasil ditambahkan!";
            inventoryMessage.style.color = "var(--success)";
        }

        await loadInventory();

        setTimeout(() => {
            if (inventoryMessage) {
                inventoryMessage.textContent = "";
            }
        }, 3000);

    } catch (error) {
        if (inventoryMessage) {
            inventoryMessage.textContent = `Gagal: ${error.message}`;
            inventoryMessage.style.color = "var(--danger)";
        }
    }
}

function generateRecommendations(items) {
    const container = document.getElementById('recommendationList');
    if (!container) return;

    if (!items || !items.length) {
        container.innerHTML = `
            <div class="rec-item">
                <span class="rec-icon">&#128230;</span>
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
            <span class="rec-icon">&#128293;</span>
            <div class="rec-content">
                <h4>Konsumsi Sekarang</h4>
                <p>${urgent.map(i => `${i.name} (${i.expiry_days} hari)`).join(', ')}</p>
                <span class="rec-suggestion">&#10140; Gunakan dalam menu hari ini</span>
            </div>
        </div>`;
    }

    if (warning.length) {
        html += `<div class="rec-item warning">
            <span class="rec-icon">&#9888;</span>
            <div class="rec-content">
                <h4>Rencanakan Penggunaan</h4>
                <p>${warning.slice(0, 3).map(i => `${i.name} (${i.expiry_days} hari)`).join(', ')}</p>
                <span class="rec-suggestion">&#10140; Masukkan dalam menu minggu ini</span>
            </div>
        </div>`;
    }

    container.innerHTML = html || `<div class="rec-item">
        <span class="rec-icon">&#10004;</span>
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
