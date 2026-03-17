/* =========================
   CONFIG AUTOMÁTICA
========================= */

function getApiBase() {

    const hostname = window.location.hostname;

    if (hostname.includes("dev")) {
        return "https://kivor-dev.onrender.com";
    }

    return "https://kivor.onrender.com";
}

const API_BASE = getApiBase();

/* =========================
   Funcion leer el JWT
========================= */

function isTokenExpired(token) {

    try {

        const payload = JSON.parse(atob(token.split(".")[1]));
        const exp = payload.exp;

        if (!exp) return true;

        const now = Math.floor(Date.now() / 1000);

        return now >= exp;

    } catch (e) {
        return true;
    }
}

/* =========================
   FUNCIÓN CENTRAL API
========================= */

async function apiFetch(url, options = {}) {

    const token = sessionStorage.getItem("access_token");
   
    if (!token || isTokenExpired(token)) {
   
        sessionStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
    }

    options.headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };

    const response = await fetch(url, options);

    if (response.status === 401) {
        sessionStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
    }

    return response;
}

/* =========================
   LOGIN
========================= */

async function login(username, password) {

    if (!API_BASE) {
        throw new Error("API_BASE no definido");
    }

    const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
        throw new Error("Credenciales inválidas");
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("Respuesta inválida del servidor");
    }

    sessionStorage.setItem("access_token", data.access_token);

    return data;
}

/* =========================
   LOGOUT
========================= */

async function logout() {

    const token = sessionStorage.getItem("access_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {

        await fetch(`${API_BASE}/logout`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

    } catch (e) {
        console.error("Error al cerrar sesión");
    }

    sessionStorage.removeItem("access_token");
    window.location.href = "login.html";
}

/* =========================
   CONSULTA GANANCIAS
========================= */

async function obtenerGananciasPorMes(mes) {

    try {

        const response = await apiFetch(`${API_BASE}/ganancias-por-mes?mes=${mes}`);

        if (!response.ok) {
            throw new Error("Error al consultar la API");
        }

        return await response.json();

    } catch (error) {

        console.error("Error:", error);
        return null;

    }
}
