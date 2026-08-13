// NoFTe API Configuration
// Backend: Cloudflare Worker

const TOKEN_KEY = "nofte_access_token";
const USER_KEY = "nofte_user";

// Get API URL - always use Worker URL
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

// Make functions globally available
window.getToken = getToken;
window.setToken = setToken;
window.getUser = getUser;
window.setUser = setUser;
window.clearToken = clearToken;
window.API_URL = API_URL;

// =========================
// AUTH CHECK
// =========================

function requireAuth() {
    // Get current page name
    const pathParts = window.location.pathname.split('/');
    const currentPage = pathParts[pathParts.length - 1] || 'index.html';

    const publicPages = ['login.html', 'register.html', ''];

    // If on public page, don't redirect
    if (publicPages.includes(currentPage)) {
        // If logged in and on login page, redirect to index
        if (currentPage === 'login.html' && getToken()) {
            window.location.href = 'index.html';
        }
        return true;
    }

    // If not logged in, redirect to login
    if (!getToken()) {
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

function logout() {
    clearToken();
    window.location.href = 'login.html';
}

window.logout = logout;

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

    // Handle 401 Unauthorized
    if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please login again.');
    }

    return response;
}

// Initialize auth check - only on non-login pages
document.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/');
    const currentPage = pathParts[pathParts.length - 1] || 'index.html';

    if (!['login.html', 'register.html', ''].includes(currentPage)) {
        requireAuth();
    }
});
