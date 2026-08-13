// NoFTe Notification System
// Connects to backend at localhost:8000

let expiringItems = [];
let notificationCount = 0;

// =========================
// API CONFIG
// =========================

const API_BASE_URL = "http://localhost:8000";

function getToken() {
    return localStorage.getItem('nofte_access_token') || null;
}

async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });
    return response;
}

// =========================
// NOTIFICATION FUNCTIONS
// =========================

// Initialize notifications on page load
document.addEventListener("DOMContentLoaded", async () => {
    await checkExpiringItems();
    setupNotificationToggle();
    // Check every 5 minutes
    setInterval(checkExpiringItems, 5 * 60 * 1000);
});

async function checkExpiringItems() {
    const token = getToken();
    if (!token) {
        // Use demo data if not logged in
        loadDemoNotifications();
        return;
    }

    try {
        const response = await apiRequest('/inventory');
        if (!response.ok) {
            loadDemoNotifications();
            return;
        }

        const items = await response.json();
        expiringItems = items.filter(item => (item.expiry_days || 0) <= 3 && (item.expiry_days || 0) > 0);
        notificationCount = expiringItems.length;

        updateNotificationBadge();
        updateNotificationDropdown();
        updateNotificationBadgeLocalStorage();
    } catch (error) {
        console.error("Error checking expiring items:", error);
        loadDemoNotifications();
    }
}

function loadDemoNotifications() {
    // Demo data for prototype
    expiringItems = [
        { name: 'Tomat', quantity: 5, unit: 'buah', expiry_days: 2 },
        { name: 'Bayam', quantity: 200, unit: 'gram', expiry_days: 1 },
        { name: 'Telur', quantity: 6, unit: 'buah', expiry_days: 3 }
    ];
    notificationCount = expiringItems.length;
    updateNotificationBadge();
    updateNotificationDropdown();
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (notificationCount > 0) {
            badge.textContent = notificationCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function updateNotificationDropdown() {
    const list = document.getElementById('notificationList');
    const count = document.getElementById('notificationCount');

    if (count) {
        count.textContent = notificationCount > 0 ? `${notificationCount} peringatan` : '0';
    }

    if (list) {
        if (expiringItems.length === 0) {
            list.innerHTML = `
                <div class="notification-empty">
                    <div class="notification-empty-icon">👍</div>
                    <p>Tidak ada makanan yang akan kadaluarsa</p>
                    <small style="color: var(--text-muted);">Semua makanan masih aman</small>
                </div>
            `;
        } else {
            list.innerHTML = expiringItems.map(item => `
                <div class="notification-item" onclick="window.location.href='expiry.html'">
                    <div class="notification-icon">${getFoodIcon(item.name)}</div>
                    <div class="notification-content">
                        <h4>${escapeHtml(item.name)}</h4>
                        <p>${item.quantity} ${escapeHtml(item.unit)}</p>
                    </div>
                    <span class="notification-days">${item.expiry_days} hari lagi</span>
                </div>
            `).join('');
        }
    }
}

function setupNotificationToggle() {
    const btn = document.getElementById('notificationBtn');
    const dropdown = document.getElementById('notificationDropdown');

    if (!btn || !dropdown) return;

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

function updateNotificationBadgeLocalStorage() {
    if (notificationCount > 0) {
        localStorage.setItem('nofte-expiring-notified', 'true');
        localStorage.setItem('nofte-expiring-count', notificationCount);
    }
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
