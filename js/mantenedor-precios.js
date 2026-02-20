document.addEventListener("DOMContentLoaded", async () => {

    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    const overlay = document.getElementById("overlay");
    const btnFiltros = document.getElementById("btnFiltros");
    const btnAplicar = document.getElementById("btnAplicar");
    const breadcrumb = document.getElementById("breadcrumb");

    const selectFamily = document.getElementById("family");
    const selectLevel2 = document.getElementById("level2");
    const selectLevel3 = document.getElementById("level3");
    const selectLevel4 = document.getElementById("level4");

    const resultadoDiv = document.getElementById("resultado");

    // ========================
    // Overlay
    // ========================

    btnFiltros.addEventListener("click", () => {
        overlay.classList.remove("hidden");
    });

    btnAplicar.addEventListener("click", async () => {
        overlay.classList.add("hidden");
        actualizarBreadcrumb();
        await cargarPrecios();
    });

    // ========================
    // Cargar Familias
    // ========================

    try {
        const response = await fetch(`${API_BASE}/familias`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const familias = await response.json();

        familias.forEach(f => {
            addOption(selectFamily, f);
        });

    } catch (error) {
        console.error(error);
    }

    // ========================
    // Nivel 2
    // ========================

    selectFamily.addEventListener("change", async () => {

        resetSelect(selectLevel2);
        resetSelect(selectLevel3);
        resetSelect(selectLevel4);

        if (!selectFamily.value) return;

        const response = await fetch(
            `${API_BASE}/niveles2?family=${encodeURIComponent(selectFamily.value)}`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );

        const niveles = await response.json();
        niveles.forEach(n => addOption(selectLevel2, n));
        selectLevel2.disabled = false;
    });

    // ========================
    // Nivel 3
    // ========================

    selectLevel2.addEventListener("change", async () => {

        resetSelect(selectLevel3);
        resetSelect(selectLevel4);

        if (!selectLevel2.value) return;

        const response = await fetch(
            `${API_BASE}/niveles3?family=${encodeURIComponent(selectFamily.value)}&level2=${encodeURIComponent(selectLevel2.value)}`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );

        const niveles = await response.json();
        niveles.forEach(n => addOption(selectLevel3, n));
        selectLevel3.disabled = false;
    });

    // ========================
    // Nivel 4
    // ========================

    selectLevel3.addEventListener("change", async () => {

        resetSelect(selectLevel4);

        if (!selectLevel3.value) return;

        const response = await fetch(
            `${API_BASE}/niveles4?family=${encodeURIComponent(selectFamily.value)}&level2=${encodeURIComponent(selectLevel2.value)}&level3=${encodeURIComponent(selectLevel3.value)}`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );

        const niveles = await response.json();
        niveles.forEach(n => addOption(selectLevel4, n));
        selectLevel4.disabled = false;
    });

    // ========================
    // FUNCIONES INTERNAS
    // ========================

    function actualizarBreadcrumb() {
        breadcrumb.textContent = [
            selectFamily.value,
            selectLevel2.value,
            selectLevel3.value,
            selectLevel4.value
        ].filter(v => v).join(" → ") || "Sin filtros";
    }

    async function cargarPrecios() {

        if (!selectFamily.value) return;

        let url = `${API_BASE}/precios?family=${encodeURIComponent(selectFamily.value)}`;

        if (selectLevel2.value)
            url += `&level2=${encodeURIComponent(selectLevel2.value)}`;

        if (selectLevel3.value)
            url += `&level3=${encodeURIComponent(selectLevel3.value)}`;

        if (selectLevel4.value)
            url += `&level4=${encodeURIComponent(selectLevel4.value)}`;

        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();
        renderTabla(data);
    }

    function renderTabla(data) {

        if (!data.length) {
            resultadoDiv.innerHTML = "<p>No hay datos</p>";
            return;
        }

        let html = `
            <table class="tabla-precios">
                <thead>
                    <tr>
                        <th>Family</th>
                        <th>Nivel2</th>
                        <th>Nivel3</th>
                        <th>Nivel4</th>
                        <th class="num">Lista</th>
                        <th class="num">Profesional</th>
                        <th class="num">% Salón</th>
                        <th class="num">% Profesional</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(row => {
            html += `
                <tr>
                    <td>${truncate(row.family)}</td>
                    <td>${truncate(row.level2)}</td>
                    <td>${truncate(row.level3)}</td>
                    <td>${truncate(row.level4)}</td>
                    <td class="num">${formatNumber(row.listprice)}</td>
                    <td class="num">${formatNumber(row.professionalprice)}</td>
                    <td class="num">${formatNumber(row.salonpercentage)}</td>
                    <td class="num">${formatNumber(row.professionalpercentage)}</td>
                </tr>
            `;
        });

        html += "</tbody></table>";
        resultadoDiv.innerHTML = html;
    }

});

// ========================
// UTILIDADES GLOBALES
// ========================

function resetSelect(select) {
    select.innerHTML = '<option value="">Seleccionar...</option>';
    select.disabled = true;
}

function addOption(select, value) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString("es-CL", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function truncate(text) {
    if (!text) return "";
    return text.length > 15 ? text.substring(0, 15) : text;
}
