/* =========================
   ESTADO / CONSTANTES
========================= */

const METRICA_LABELS = {
    ganancia_salon: "Ganancia Salón",
    ganancia_prof: "Ganancia Profesional",
    precio_web: "Precio Web",
};

let currentReporte = null;
let mostrarBrecha = false;
let mostrarValores = false;

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", async () => {
    await initFiltros();
    bindReporteEvents();
});

async function initFiltros() {
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

function bindReporteEvents() {
    document.getElementById("reporteFiltrosForm")
        .addEventListener("submit", handleGenerarReporte);

    document.querySelectorAll(".reporte-clear-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = document.getElementById(btn.dataset.clearTarget);
            Array.from(target.options).forEach(o => { o.selected = false; });
        });
    });

    document.getElementById("btnToggleBrecha").addEventListener("click", () => {
        mostrarBrecha = !mostrarBrecha;
        const btn = document.getElementById("btnToggleBrecha");
        btn.classList.toggle("active", mostrarBrecha);
        btn.textContent = mostrarBrecha ? "Ocultar brecha" : "Mostrar brecha";
        if (currentReporte) renderReporte(currentReporte);
    });

    document.getElementById("btnToggleValores").addEventListener("click", () => {
        mostrarValores = !mostrarValores;
        const btn = document.getElementById("btnToggleValores");
        btn.classList.toggle("active", mostrarValores);
        btn.textContent = mostrarValores ? "Ocultar cifras" : "Mostrar cifras";
        if (currentReporte) renderReporte(currentReporte);
    });
}

/* =========================
   GENERAR REPORTE
========================= */

async function handleGenerarReporte(event) {
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

    const btn = document.getElementById("btnGenerarReporte");

    try {
        btn.disabled = true;
        btn.textContent = "Generando...";
        hideReporteResult();

        const data = await obtenerReporteVentas({
            anio1: Number(anio1),
            anio2: Number(anio2),
            metrica,
            familias,
            profesionales,
            diasSemana,
            quincenas,
        });

        if (!data) {
            showReporteResult("No se pudo obtener el reporte.", true);
            return;
        }

        currentReporte = data;
        renderReporte(data);

    } catch (error) {
        showReporteResult(error.message || "Error al generar el reporte.", true);
    } finally {
        btn.disabled = false;
        btn.textContent = "Generar reporte";
    }
}

/* =========================
   RENDER REPORTE
========================= */

function renderReporte(data) {
    const { anio1, anio2, metrica, meses, valores_anio1: dataA, valores_anio2: dataB } = data;
    const metricaLabel = METRICA_LABELS[metrica] || metrica;
    const labelA = String(anio1);
    const labelB = String(anio2);

    document.getElementById("reporteContenido").classList.remove("hidden");

    /* Leyenda de colores por año (fija en todos los gráficos) */
    document.getElementById("reporteLegend").innerHTML = `
        <span class="legend-item"><span class="legend-dot" style="background:${C1}"></span>Año ${labelA}</span>
        <span class="legend-item"><span class="legend-dot" style="background:${C2}"></span>Año ${labelB}</span>
    `;

    /* KPIs */
    const totalA = dataA.reduce((acc, v) => acc + (v || 0), 0);
    const totalB = dataB.reduce((acc, v) => acc + (v || 0), 0);

    const mesesConB = meses.map((m, i) => ({ m, a: dataA[i], b: dataB[i] })).filter(p => p.b !== null);
    const totalASameMonths = mesesConB.reduce((acc, p) => acc + (p.a || 0), 0);
    const yoyTotal = totalASameMonths !== 0
        ? ((totalB - totalASameMonths) / totalASameMonths * 100)
        : null;

    let bestMonthB = null;
    mesesConB.forEach(p => {
        if (bestMonthB === null || p.b > bestMonthB.b) bestMonthB = p;
    });

    const kpis = [
        { label: `Total ${metricaLabel} ${labelA}`, value: fmtCLP(totalA), sub: '' },
        { label: `Total ${metricaLabel} ${labelB}`, value: fmtCLP(totalB), sub: '' },
        {
            label: 'Variación interanual',
            value: yoyTotal === null ? '—' : (yoyTotal >= 0 ? '+' : '') + yoyTotal.toFixed(1) + '%',
            sub: `${labelB} vs ${labelA}, mismos ${mesesConB.length} meses`,
            cls: yoyTotal === null ? '' : (yoyTotal >= 0 ? 'up' : 'down'),
        },
        { label: `Mes más fuerte ${labelB}`, value: bestMonthB ? bestMonthB.m : '—', sub: bestMonthB ? fmtCLP(bestMonthB.b) : '' },
    ];

    const kpiRow = document.getElementById('kpiRow');
    kpiRow.innerHTML = '';
    kpis.forEach(k => {
        const d = document.createElement('div');
        d.className = 'kpi';
        d.innerHTML = `<div class="label">${k.label}</div><div class="value">${k.value}</div><div class="sub ${k.cls || ''}">${k.sub}</div>`;
        kpiRow.appendChild(d);
    });

    /* Gráficos */
    drawGroupedBars('chartBars', meses, dataA, dataB, C1, C2, labelA, labelB, fmtShort, undefined, mostrarBrecha, mostrarValores);
    drawLines('chartLine', meses, dataA, dataB, C1, C2, labelA, labelB, fmtShort);

    document.getElementById('chartYoYSub').textContent = `% de cambio ${labelB} vs ${labelA}, por mes`;
    const yoyData = meses.map((m, i) => dataB[i] !== null && dataA[i] ? ((dataB[i] - dataA[i]) / dataA[i] * 100) : null);
    drawSignedBars('chartYoY', meses, yoyData, v => Math.round(v) + '%', mostrarValores);

    drawCumLines('chartCum', meses, cumulative(dataA), cumulative(dataB), C1, C2, labelA, labelB, fmtShort);

    const shareA = meses.map((m, i) => dataA[i] !== null && totalA ? dataA[i] / totalA * 100 : null);
    const shareB = meses.map((m, i) => dataB[i] !== null && totalB ? dataB[i] / totalB * 100 : null);
    const fmtPct = v => Math.round(v) + '%';
    drawGroupedBars('chartShare', meses, shareA, shareB, C1, C2, labelA, labelB, fmtPct, v => v.toFixed(1) + '%', false, mostrarValores);
}
