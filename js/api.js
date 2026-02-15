const API_BASE = "https://kivor.onrender.com";

/* =========================
   LOGIN
========================= */

async function login(username, password) {
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

    const data = await response.json();

    // Guardamos el token en sessionStorage
    sessionStorage.setItem("access_token", data.access_token);

    return data;
}

/* =========================
   CONSULTA GANANCIAS
========================= */

async function obtenerGananciasPorMes(mes) {
    try {

        const token = sessionStorage.getItem("access_token");

        if (!token) {
            throw new Error("No autenticado");
        }

        const response = await fetch(`${API_BASE}/ganancias-por-mes?mes=${mes}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Error al consultar la API");
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

 
