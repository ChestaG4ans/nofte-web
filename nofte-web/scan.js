// Scan JavaScript - Connects to NoFTe Backend

const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const scanButton = document.getElementById("scanButton");
const results = document.getElementById("results");
const scanContainer = document.getElementById("scanContainer");
const emptyState = document.getElementById("emptyState");

let selectedFile = null;
let lastScanResults = [];

if (imageInput) {
    imageInput.addEventListener("change", (e) => {
        selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (emptyState) emptyState.style.display = "none";
        if (previewImage) {
            previewImage.src = URL.createObjectURL(selectedFile);
            previewImage.style.display = "block";
        }
    });
}

if (scanButton) {
    scanButton.addEventListener("click", scanFood);
}

async function scanFood() {
    if (!selectedFile) {
        alert("Pilih gambar terlebih dahulu!");
        return;
    }

    const resultsCard = document.getElementById("resultsCard");
    if (resultsCard) resultsCard.style.display = "block";

    if (results) {
        results.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 16px; animation: spin 1s linear infinite;">&#128259;</div>
                <p style="color: var(--text-secondary);">AI sedang menganalisis...</p>
                <small style="color: var(--text-muted);">Tunggu sebentar</small>
            </div>
        `;
    }

    try {
        const token = getToken();
        if (!token) {
            logout();
            return;
        }

        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch(`${API_BASE_URL}/scan`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: selectedFile // Send as raw binary
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Gagal scan");
        }

        const data = await response.json();
        lastScanResults = data.foods || [];
        renderFoods(lastScanResults);

    } catch (err) {
        console.error("Scan Error:", err);
        if (results) {
            results.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">&#9888;</div>
                    <p style="color: var(--danger);">Gagal: ${err.message}</p>
                    <small style="color: var(--text-muted);">Pastikan backend NoFTe berjalan</small>
                </div>
            `;
        }
    }
}

function renderFoods(foods) {
    if (!results) return;

    if (!foods || !foods.length) {
        results.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 16px;">&#128554;</div>
                <p>Tidak ada makanan terdeteksi</p>
                <small style="color: var(--text-muted);">Coba foto yang lebih jelas</small>
            </div>
        `;
        return;
    }

    results.innerHTML = foods.map((food, index) => {
        const freshnessColor = getFreshnessColor(food.freshness);
        const expiryDate = calculateExpiryDate(food.shelf_life);

        let badgeClass = "badge-warning";
        if (freshnessColor === "#22c55e") badgeClass = "badge-success";
        else if (freshnessColor === "#ef4444") badgeClass = "badge-danger";

        return `
            <div style="background: var(--bg-tertiary); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 16px; border: 1px solid var(--border);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <span style="font-size: 40px;">${getFoodIcon(food.name)}</span>
                        <h3 style="font-size: 18px; font-weight: 600;">${escapeHtml(food.name)}</h3>
                    </div>
                    <span class="badge ${badgeClass}">${escapeHtml(food.freshness)}</span>
                </div>
                <div class="result-details">
                    <div class="result-detail">
                        <span class="result-detail-value">${Math.round((food.confidence || 0) * 100)}%</span>
                        <span class="result-detail-label">Akurasi</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-value">${food.shelf_life || 0}</span>
                        <span class="result-detail-label">Hari</span>
                    </div>
                    <div class="result-detail">
                        <span class="result-detail-value" style="font-size: 16px;">${expiryDate}</span>
                        <span class="result-detail-label">Kadaluarsa</span>
                    </div>
                </div>
                ${renderNutrition(food.nutrition)}
                <button onclick="addToInventory(${index})" class="btn btn-primary" style="width: 100%; margin-top: 20px;">
                    &#10133; Tambah ke Inventory
                </button>
            </div>
        `;
    }).join('');
}

function getFreshnessColor(freshness) {
    if (!freshness) return "#666";
    const lower = freshness.toLowerCase();
    if (lower.includes("segar") || lower.includes("fresh")) return "#22c55e";
    if (lower.includes("perlu") || lower.includes("check")) return "#eab308";
    if (lower.includes("tidak segar") || lower.includes("rotten")) return "#ef4444";
    return "#666";
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

function calculateExpiryDate(shelfLifeDays) {
    if (!shelfLifeDays || shelfLifeDays <= 0) return "Sudah expired";
    const date = new Date();
    date.setDate(date.getDate() + shelfLifeDays);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function renderNutrition(nutrition) {
    if (!nutrition) return "";
    return `
        <details style="margin-top: 16px;">
            <summary style="cursor: pointer; color: var(--primary); font-size: 14px; font-weight: 500; padding: 8px 0;">
                &#128202; Info Nutrisi
            </summary>
            <div style="padding: 16px; background: var(--bg-card); border-radius: var(--radius); margin-top: 8px; font-size: 14px;">
                ${nutrition.serving ? `<p style="margin-bottom: 6px;">Serving: ${nutrition.serving}</p>` : ""}
                ${nutrition.calories ? `<p style="margin-bottom: 6px;">Kalori: ${nutrition.calories}</p>` : ""}
                ${nutrition.protein_g ? `<p style="margin-bottom: 6px;">Protein: ${nutrition.protein_g}g</p>` : ""}
                ${nutrition.carbohydrates_g ? `<p style="margin-bottom: 6px;">Karbohidrat: ${nutrition.carbohydrates_g}g</p>` : ""}
                ${nutrition.total_fat_g ? `<p style="margin-bottom: 6px;">Lemak: ${nutrition.total_fat_g}g</p>` : ""}
                ${nutrition.fiber_g ? `<p>Serat: ${nutrition.fiber_g}g</p>` : ""}
            </div>
        </details>
    `;
}

async function addToInventory(foodIndex) {
    const food = lastScanResults[foodIndex];
    if (!food) return;

    const token = getToken();
    if (!token) {
        logout();
        return;
    }

    const payload = {
        name: food.name,
        expiry_days: food.shelf_life || 0,
        quantity: 1,
        unit: "Item"
    };

    try {
        const response = await apiRequest('/inventory/from-scan', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) throw new Error("Gagal menambah ke inventory");

        alert(`&#10004; ${food.name} berhasil ditambahkan!\nKadaluarsa: ${calculateExpiryDate(food.shelf_life)}`);
    } catch (err) {
        alert(`&#9888; Gagal: ${err.message}`);
    }
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
