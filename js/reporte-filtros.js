/* =========================
   HELPERS DE FILTROS COMPARTIDOS
   (reporte de ventas y reporte de KPIs)
========================= */

function llenarSelectAnios(selectId, anios) {
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">Seleccione</option>`;

    anios.forEach(anio => {
        const option = document.createElement("option");
        option.value = anio;
        option.textContent = anio;
        select.appendChild(option);
    });

    if (anios.length >= 2) {
        select.value = selectId === "filtroAnio1"
            ? anios[anios.length - 2]
            : anios[anios.length - 1];
    }
}

function llenarSelectMultiple(selectId, valores) {
    const select = document.getElementById(selectId);
    select.innerHTML = "";

    valores.forEach(valor => {
        const option = document.createElement("option");
        option.value = valor;
        option.textContent = valor;
        select.appendChild(option);
    });
}

function getSeleccionMultiple(selectId) {
    const select = document.getElementById(selectId);
    return Array.from(select.selectedOptions).map(o => o.value);
}

function showReporteResult(message, isError = false) {
    const box = document.getElementById("reporteResult");
    box.classList.remove("hidden");
    box.classList.toggle("error", isError);
    box.innerHTML = message;
}

function hideReporteResult() {
    const box = document.getElementById("reporteResult");
    box.classList.add("hidden");
    box.innerHTML = "";
}
