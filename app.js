// Scan Feature - Demo Mode (no backend required)
const API_URL = window.API_URL || "https://nofte-api.chestaadabikarnen03.workers.dev";

const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const scanButton = document.getElementById("scanButton");
const statusLine = document.getElementById("statusLine");
const results = document.getElementById("results");

let selectedFile = null;

if (imageInput) {
    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];
        if (!file) return;

        selectedFile = file;
        previewImage.src = URL.createObjectURL(file);
        previewImage.style.display = "block";

        const emptyState = document.getElementById("emptyState");
        if (emptyState) emptyState.style.display = "none";

        if (scanButton) scanButton.disabled = false;
        if (statusLine) statusLine.innerText = file.name;
    });
}

if (scanButton) {
    scanButton.addEventListener("click", scanFood);
}

async function scanFood() {
    if (!selectedFile) return;

    if (statusLine) statusLine.innerText = "Memindai...";

    // Demo scan results (no backend)
    const demoResults = generateDemoResults();

    renderFoods(demoResults);

    if (statusLine) statusLine.innerText = "Scan selesai (Demo)";

    // Save to history
    demoResults.forEach(food => addHistory(food));
}

function generateDemoResults() {
    const foods = [
        { name: "Tomat", freshness: "Fresh", confidence: 0.94, shelf_life: "5-7 hari", detected_label: "tomato" },
        { name: "Bayam", freshness: "Soon", confidence: 0.87, shelf_life: "2-3 hari", detected_label: "spinach" },
        { name: "Wortel", freshness: "Fresh", confidence: 0.91, shelf_life: "7-10 hari", detected_label: "carrot" },
        { name: "Telur", freshness: "Fresh", confidence: 0.89, shelf_life: "10-14 hari", detected_label: "egg" },
        { name: "Ayam", freshness: "Soon", confidence: 0.85, shelf_life: "2-3 hari", detected_label: "chicken" },
    ];

    // Random 2-4 items
    const count = Math.floor(Math.random() * 3) + 2;
    return foods.sort(() => Math.random() - 0.5).slice(0, count);
}

function renderFoods(foods) {
    if (!results) return;

    results.innerHTML = "";

    foods.forEach(food => {
        const card = document.createElement("div");
        card.className = "result-card";

        const freshnessColor = food.freshness === "Fresh" ? "var(--success)" :
                              food.freshness === "Soon" ? "var(--warning)" : "var(--danger)";

        card.innerHTML = `
            <h3>${food.name}</h3>
            <p style="color: ${freshnessColor}">${food.freshness}</p>
            <div class="metrics">
                <div class="metric">
                    Confidence<br>
                    <strong>${Math.round(food.confidence * 100)}%</strong>
                </div>
                <div class="metric">
                    Shelf Life<br>
                    <strong>${food.shelf_life}</strong>
                </div>
                <div class="metric">
                    Label<br>
                    <strong>${food.detected_label}</strong>
                </div>
            </div>
        `;

        results.appendChild(card);
    });
}

function addHistory(food) {
    const table = document.getElementById("historyTable");
    if (!table) return;

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${new Date().toLocaleDateString()}</td>
        <td>${food.name}</td>
        <td style="color: ${food.freshness === 'Fresh' ? 'var(--success)' : 'var(--warning)'}">${food.freshness}</td>
    `;

    table.prepend(row);
}

// Scan Chart
const scanChartCtx = document.getElementById("scanChart");
if (scanChartCtx && typeof Chart !== 'undefined') {
    new Chart(scanChartCtx, {
        type: "line",
        data: {
            labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
            datasets: [{
                label: "Jumlah Scan",
                data: [5, 7, 4, 8, 12, 10, 14],
                tension: 0.4,
                borderColor: "#10B981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
