// NoFTe API Configuration
// Backend: Cloudflare Worker

const TOKEN_KEY = "nofte_access_token";
const USER_KEY = "nofte_user";

// Get API URL from config
const getApiUrl = () => {
    if (typeof CONFIG !== 'undefined' && CONFIG.API_URL) {
        return CONFIG.API_URL;
    }
    // Fallback to same origin for Cloudflare Pages
    return "";
};

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

// Make functions globally available
window.getToken = getToken;
window.setToken = setToken;
window.getUser = getUser;
window.setUser = setUser;
window.clearToken = clearToken;

// =========================
// AUTH CHECK
// =========================

function requireAuth() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const publicPages = ["login.html", "register.html"];

    if (!publicPages.includes(currentPage) && !getToken()) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

function logout() {
    clearToken();
    window.location.href = "login.html";
}

window.logout = logout;

// =========================
// API HELPERS
// =========================

async function apiRequest(endpoint, options = {}) {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
        throw new Error('No backend API configured');
    }

    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please login again.');
    }

    return response;
}

// Initialize auth check
document.addEventListener('DOMContentLoaded', requireAuth);
