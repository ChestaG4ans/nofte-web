// NoFTe API Configuration
// Backend: Cloudflare Worker

const TOKEN_KEY = "nofte_access_token";
const USER_KEY = "nofte_user";

// API URL - Production
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

    if (!userStr) {
        return null;
    }

    try {
        return JSON.parse(userStr);
    } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem(USER_KEY);
        return null;
    }
}

function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// =========================
// GLOBAL FUNCTIONS
// =========================

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

    // Gunakan /login sebagai URL login production
    window.location.href = "/login";
}

// =========================
// AUTH CHECK
// =========================

function checkAuth() {
    const currentPath = window.location.pathname;

    // Halaman yang tidak membutuhkan login
    const publicPages = [
        "/login",
        "/login.html",
        "/register",
        "/register.html"
    ];

    // Jika berada di halaman publik,
    // jangan lakukan redirect
    if (publicPages.includes(currentPath)) {
        return true;
    }

    // Jika halaman membutuhkan login
    // tetapi token tidak tersedia
    if (!getToken()) {
        window.location.href = "/login";
        return false;
    }

    return true;
}

// =========================
// INITIALIZE AUTH
// =========================

window.addEventListener("DOMContentLoaded", function () {
    checkAuth();
});

// =========================
// API HELPERS
// =========================

async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    // Tambahkan Authorization jika token tersedia
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        // Handle 401 Unauthorized
        if (response.status === 401) {
            clearToken();

            // Jangan redirect berulang jika sudah berada di login
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }

            throw new Error("Unauthorized");
        }

        return response;

    } catch (error) {
        console.error("API Request Error:", error);
        throw error;
    }
}