/* =========================
   ESTADO
========================= */

const METRICA_LABELS_KPIS = {
    ganancia_salon: "Ganancia Salón",
    ganancia_prof: "Ganancia Profesional",
    precio_web: "Precio Web",
};

const SEMESTRES = ["S1 (Ene-Jun)", "S2 (Jul-Dic)"];

let currentKpis = null;
let mostrarValores = false;

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", async () => {
    await initFiltrosKpis();
    bindKpisEvents();
});

async function initFiltrosKpis() {
    const [anios, familias, profesionales] = await Promise.all([
        obtenerAniosReporteVentas(),
        obtenerFamiliasReporteVentas(),
        obtenerProfesionalesReporteVentas(),
    ]);

    llenarSelectAnios("filtroAnio1", anios);
    llenarSelectAnios("filtroAnio2", anios);

    llenarSelectMultiple("filtroFamilia", familias);
    llenarSelectMultiple("filtroProfesional", profesionales);
}

function bindKpisEvents() {
    document.getElementById("kpisFiltrosForm")
        .addEventListener("submit", handleGenerarKpis);

    document.querySelectorAll(".reporte-clear-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = document.getElementById(btn.dataset.clearTarget);
            Array.from(target.options).forEach(o => { o.selected = false; });
        });
    });

    document.getElementById("btnToggleValores").addEventListener("click", () => {
        mostrarValores = !mostrarValores;
        const btn = document.getElementById("btnToggleValores");
        btn.classList.toggle("active", mostrarValores);
        btn.textContent = mostrarValores ? "Ocultar cifras" : "Mostrar cifras";
        if (currentKpis) renderKpis(currentKpis);
    });
}

/* =========================
   GENERAR KPIs
========================= */

async function handleGenerarKpis(event) {
    event.preventDefault();

    const anio1 = document.getElementById("filtroAnio1").value;
    const anio2 = document.getElementById("filtroAnio2").value;
    const metrica = document.getElementById("filtroMetrica").value;
    const familias = getSeleccionMultiple("filtroFamilia");
    const profesionales = getSeleccionMultiple("filtroProfesional");
    const diasSemana = getSeleccionMultiple("filtroDiaSemana").map(Number);
    const quincenas = getSeleccionMultiple("filtroQuincena").map(Number);

    if (!anio1 || !anio2) {
        showReporteResult("Debe seleccionar Año 1 y Año 2.", true);
        return;
    }

    if (anio1 === anio2) {
        showReporteResult("Año 1 y Año 2 deben ser distintos.", true);
        return;
    }

    const btn = document.getElementById("btnGenerarKpis");

    try {
        btn.disabled = true;
        btn.textContent = "Generando...";
        hideReporteResult();

        const data = await obtenerReporteKpis({
            anio1: Number(anio1),
            anio2: Number(anio2),
            metrica,
            familias,
            profesionales,
            diasSemana,
            quincenas,
        });

        if (!data) {
            showReporteResult("No se pudo obtener el reporte de KPIs.", true);
            return;
        }

        currentKpis = data;
        renderKpis(data);

    } catch (error) {
        showReporteResult(error.message || "Error al generar el reporte de KPIs.", true);
    } finally {
        btn.disabled = false;
        btn.textContent = "Generar KPIs";
    }
}

/* =========================
   FORMATEO LOCAL (conteos, sin signo $)
========================= */

function fmtInt(v) {
    if (v === null || v === undefined) return "—";
    return Math.round(v).toLocaleString("es-CL");
}

/* =========================
   KPI COMPARATIVO (3 tarjetas: valor Año1, valor Año2, variación)
========================= */

function renderKpiComparativo(containerId, tituloBase, valorA, valorB, labelA, labelB, fmt) {
    const variacion = (valorA && valorB) ? ((valorB - valorA) / valorA * 100) : null;
    const kpis = [
        { label: `${tituloBase} ${labelA}`, value: fmt(valorA), sub: '' },
        { label: `${tituloBase} ${labelB}`, value: fmt(valorB), sub: '' },
        {
            label: 'Variación',
            value: variacion === null ? '—' : (variacion >= 0 ? '+' : '') + variacion.toFixed(1) + '%',
            sub: `${labelB} vs ${labelA}`,
            cls: variacion === null ? '' : (variacion >= 0 ? 'up' : 'down'),
        },
    ];

    const box = document.getElementById(containerId);
    box.innerHTML = '';
    kpis.forEach(k => {
        const d = document.createElement('div');
        d.className = 'kpi';
        d.innerHTML = `<div class="label">${k.label}</div><div class="value">${k.value}</div><div class="sub ${k.cls || ''}">${k.sub}</div>`;
        box.appendChild(d);
    });
}

/* =========================
   TABLAS
========================= */

function renderCrossSellingTable(containerId, tituloId, anio, data) {
    document.getElementById(tituloId).textContent = `Año ${anio}`;
    const container = document.getElementById(containerId);
    const { familias, matriz } = data;

    if (!familias.length) {
        container.innerHTML = '<p class="reporte-hint">Sin datos para este año.</p>';
        return;
    }

    let maxOffDiag = 1;
    familias.forEach((_, i) => familias.forEach((_, j) => {
        if (i !== j) maxOffDiag = Math.max(maxOffDiag, matriz[i][j]);
    }));

    let html = '<table class="kpi-table"><thead><tr><th></th>';
    familias.forEach(f => { html += `<th>${f}</th>`; });
    html += '</tr></thead><tbody>';

    familias.forEach((fa, i) => {
        html += `<tr><th>${fa}</th>`;
        familias.forEach((fb, j) => {
            const v = matriz[i][j];
            if (i === j) {
                html += `<td class="kpi-table-diag">${v}</td>`;
            } else {
                const intensity = Math.min(1, v / maxOffDiag);
                const bg = `rgba(37, 99, 235, ${(intensity * 0.55).toFixed(2)})`;
                html += `<td style="background:${bg}">${v}</td>`;
            }
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderAbcTable(containerId, tituloId, anio, rows) {
    document.getElementById(tituloId).textContent = `Año ${anio}`;
    const container = document.getElementById(containerId);

    if (!rows.length) {
        container.innerHTML = '<p class="reporte-hint">Sin datos para este año.</p>';
        return;
    }

    let html = `
        <table class="kpi-table">
            <thead>
                <tr>
                    <th>Familia</th>
                    <th>Ganancia Salón</th>
                    <th>%</th>
                    <th>% acumulado</th>
                    <th>Umbral</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.forEach(r => {
        const badges = r.umbrales.map(u => `<span class="abc-badge">${u}%</span>`).join(' ');
        html += `
            <tr>
                <td>${r.familia}</td>
                <td>${fmtCLP(r.valor)}</td>
                <td>${r.porcentaje.toFixed(1)}%</td>
                <td>${r.porcentaje_acumulado.toFixed(1)}%</td>
                <td>${badges}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

/* =========================
   RENDER KPIs
========================= */

function renderKpis(data) {
    const { anio1, anio2, metrica, meses } = data;
    const metricaLabel = METRICA_LABELS_KPIS[metrica] || metrica;
    const labelA = String(anio1);
    const labelB = String(anio2);

    document.getElementById("reporteContenido").classList.remove("hidden");

    document.getElementById("reporteLegend").innerHTML = `
        <span class="legend-item"><span class="legend-dot" style="background:${C1}"></span>Año ${labelA}</span>
        <span class="legend-item"><span class="legend-dot" style="background:${C2}"></span>Año ${labelB}</span>
    `;

    /* Ticket promedio mensual */
    document.getElementById("ticketMensualSub").textContent =
        `Suma de ${metricaLabel} ÷ clientas únicas del mes`;
    drawGroupedBars(
        'chartTicketMensual', meses,
        data.ticket_mensual_anio1, data.ticket_mensual_anio2,
        C1, C2, labelA, labelB, fmtShort, undefined, false, mostrarValores
    );

    /* Ticket promedio semestral */
    drawGroupedBars(
        'chartTicketSemestral', SEMESTRES,
        data.ticket_semestral_anio1, data.ticket_semestral_anio2,
        C1, C2, labelA, labelB, fmtShort, undefined, false, mostrarValores
    );

    /* Ticket promedio anual */
    renderKpiComparativo(
        'kpiTicketAnual', 'Ticket promedio',
        data.ticket_anual_anio1, data.ticket_anual_anio2,
        labelA, labelB, fmtCLP
    );

    /* Clientas nuevas */
    drawGroupedBars(
        'chartClientasNuevas', meses,
        data.clientas_nuevas_anio1, data.clientas_nuevas_anio2,
        C1, C2, labelA, labelB, fmtInt, fmtInt, false, mostrarValores
    );

    renderKpiComparativo(
        'kpiClientasNuevasAnual', 'Clientas nuevas',
        data.clientas_nuevas_anual_anio1, data.clientas_nuevas_anual_anio2,
        labelA, labelB, fmtInt
    );

    /* Cross-selling */
    renderCrossSellingTable('crossSellingAnio1', 'crossTituloAnio1', anio1, data.cross_selling_anio1);
    renderCrossSellingTable('crossSellingAnio2', 'crossTituloAnio2', anio2, data.cross_selling_anio2);

    /* ABC */
    renderAbcTable('abcTablaAnio1', 'abcTituloAnio1', anio1, data.abc_anio1);
    renderAbcTable('abcTablaAnio2', 'abcTituloAnio2', anio2, data.abc_anio2);
}
