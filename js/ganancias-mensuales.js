document.getElementById("btnConsultar").addEventListener("click", async () => {
document.getElementById("logout").addEventListener("click", () => {
sessionStorage.removeItem("access_token");
window.location.href = "login.html";
});
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

    let tabla = `
        <table border="1">
            <thead>
                <tr>
                    <th>Fecha</th>
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
        tabla += `
            <tr>
                <td>${fila.fecha}</td>
                <td>${fila.cabello}</td>
                <td>${fila.manos_y_pies}</td>
                <td>${fila.depilacion}</td>
                <td>${fila.cejas_y_pestanas}</td>
                <td>${fila.faciales}</td>
                <td>${fila.corporal}</td>
            </tr>
        `;
    });

    tabla += `
            </tbody>
        </table>
    `;

    resultadoDiv.innerHTML = tabla;
});
 
