/* =========================
   LOGOUT
========================= */

document.getElementById("logout").addEventListener("click", () => {
    sessionStorage.removeItem("access_token");
    window.location.href = "login.html";
});


/* =========================
   CONSULTAR GANANCIAS
========================= */

document.getElementById("btnConsultar").addEventListener("click", async () => {

    const mes = document.getElementById("mes").value;
    const resultadoDiv = document.getElementById("resultado");

    resultadoDiv.innerHTML = "Cargando...";

    const data = await obtenerGananciasPorMes(mes);

    if (!data || !data.data) {
        resultadoDiv.innerHTML = "Error al obtener datos.";
        return;
    }

    if (data.data.length === 0) {
        resultadoDiv.innerHTML = "No hay datos para este mes.";
        return;
    }

    let html = "";

    data.data.forEach(fila => {

        const year = fila.fecha.substring(0,4);

        html += `
            <div class="card">
                <div class="year-title">${year}</div>

                <div class="row">
                    <span>Cabello</span>
                    <span class="value">$${formatearNumero(fila.cabello)}</span>
                </div>

                <div class="row">
                    <span>Manos y Pies</span>
                    <span class="value">$${formatearNumero(fila.manos_y_pies)}</span>
                </div>

                <div class="row">
                    <span>Depilación</span>
                    <span class="value">$${formatearNumero(fila.depilacion)}</span>
                </div>

                <div class="row">
                    <span>Cejas y Pestañas</span>
                    <span class="value">$${formatearNumero(fila.cejas_y_pestanas)}</span>
                </div>

                <div class="row">
                    <span>Faciales</span>
                    <span class="value">$${formatearNumero(fila.faciales)}</span>
                </div>

                <div class="row">
                    <span>Corporal</span>
                    <span class="value">$${formatearNumero(fila.corporal)}</span>
                </div>
            </div>
        `;
    });

    resultadoDiv.innerHTML = html;
});


/* =========================
   FORMATEAR NUMEROS
========================= */

function formatearNumero(numero) {
    return Number(numero).toLocaleString("es-CL");
}

 
