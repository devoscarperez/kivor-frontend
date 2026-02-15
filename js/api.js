const API_BASE = "https://kivor.onrender.com";

async function obtenerGananciasPorMes(mes) {
    try {
        const response = await fetch(`${API_BASE}/ganancias-por-mes?mes=${mes}`);
        
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
 
