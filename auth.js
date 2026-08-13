// NoFTe API Configuration
// Backend server runs on localhost:8000

const API_BASE_URL = "http://localhost:8000";
const CHAT_API_URL = "http://localhost:3000";
const TOKEN_KEY = "nofte_access_token";
const USER_KEY = "nofte_user";

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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
