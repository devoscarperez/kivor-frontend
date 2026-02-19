/* =========================
   LOGOUT
========================= */

/*
document.getElementById("logout").addEventListener("click", () => {
    sessionStorage.removeItem("access_token");
    window.location.href = "login.html";
});
*/
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("access_token");
        window.location.href = "login.html";
    });
}


/* =========================
   CONSULTAR GANANCIAS (MATRIZ)
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

    let html = `
        <div class="tabla-container">
            <table class="tabla-dashboard">
                <thead>
                    <tr>
                        <th>Año-Mes</th>
                        <th>Cabello</th>
                        <th>Manos y Pies</th>
                        <th>Depilación</th>
                        <th>Cejas y Pestañas</th>
                        <th>Faciales</th>
                        <th>Corporal</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.data.forEach(fila => {
        html += `
            <tr>
                <td>${fila.fecha}</td>
                <td>$${formatearNumero(fila.cabello)}</td>
                <td>$${formatearNumero(fila.manos_y_pies)}</td>
                <td>$${formatearNumero(fila.depilacion)}</td>
                <td>$${formatearNumero(fila.cejas_y_pestanas)}</td>
                <td>$${formatearNumero(fila.faciales)}</td>
                <td>$${formatearNumero(fila.corporal)}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    resultadoDiv.innerHTML = html;
});


/* =========================
   FORMATEAR NUMEROS
========================= */

function formatearNumero(numero) {
    return Number(numero).toLocaleString("es-CL");
}

 
