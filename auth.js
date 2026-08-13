// NoFTe API Configuration
// Uses CONFIG from config.js for API URLs

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

// Make logout globally available
window.logout = logout;

// Initialize auth check
document.addEventListener('DOMContentLoaded', requireAuth);
