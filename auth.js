// NoFTe API Configuration
// Backend: Cloudflare Worker

const TOKEN_KEY = "nofte_access_token";
const USER_KEY = "nofte_user";

// API URL - hardcoded untuk production
const API_URL = "https://nofte-api.chestaadabikarnen03.workers.dev";

// =========================
// TOKEN MANAGEMENT
// =========================

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Make globally available
window.getToken = getToken;
window.setToken = setToken;
window.getUser = getUser;
window.setUser = setUser;
window.clearToken = clearToken;
window.API_URL = API_URL;
window.logout = logout;

// =========================
// LOGOUT
// =========================

function logout() {
    clearToken();
    window.location.href = "login.html";
}

// =========================
// SIMPLE AUTH CHECK
// =========================

function checkAuth() {
    // Only redirect if NOT on login page AND no token
    const onLoginPage = window.location.href.includes('login.html');

    if (!onLoginPage && !getToken()) {
        window.location.href = "login.html";
    }
}

// Run auth check after page loads
window.addEventListener('DOMContentLoaded', function() {
    // Skip auth check on login page
    if (window.location.href.includes('login.html')) {
        return;
    }

    // Small delay to prevent loop
    setTimeout(checkAuth, 100);
});

// =========================
// API HELPERS
// =========================

async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    // Handle 401 - redirect to login
    if (response.status === 401) {
        clearToken();
        window.location.href = "login.html";
        throw new Error('Unauthorized');
    }

    return response;
}
