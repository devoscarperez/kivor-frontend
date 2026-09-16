/* =========================
   ESTADO
========================= */

const METRICA_LABELS = {
    ganancia_salon: "Ganancia Salón",
    ganancia_prof: "Ganancia Profesional",
    precio_web: "Precio Web",
};

const SEMESTRES = ["S1 (Ene-Jun)", "S2 (Jul-Dic)"];

const TAB_DESCRIPCIONES = {
    ventas: "Comparativo mes a mes entre Año 1 y Año 2: brecha, variación interanual, acumulado y participación.",
    kpis: "Ticket promedio, clientas nuevas, cross-selling y análisis ABC de familias.",
};

let activeTab = "ventas";
let hasGeneratedOnce = false;
let mostrarValores = false;
let mostrarBrecha = false;

const cache = {
    ventas: { filtersKey: null, data: null },
    kpis: { filtersKey: null, data: null },
};

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", async () => {
    await initFiltros();
    bindEvents();
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

function bindEvents() {
    document.getElementById("analisisFiltrosForm")
        .addEventListener("submit", handleGenerarReporte);

    document.querySelectorAll(".reporte-clear-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = document.getElementById(btn.dataset.clearTarget);
            Array.from(target.options).forEach(o => { o.selected = false; });
        });
    });

    document.querySelectorAll(".reporte-tab").forEach(tabBtn => {
        tabBtn.addEventListener("click", () => switchTab(tabBtn.dataset.tab));
    });

    document.getElementById("btnToggleValores").addEventListener("click", () => {
        mostrarValores = !mostrarValores;
        const btn = document.getElementById("btnToggleValores");
        btn.classList.toggle("active", mostrarValores);
        btn.textContent = mostrarValores ? "Ocultar cifras" : "Mostrar cifras";
        if (cache.ventas.data) renderVentas(cache.ventas.data);
        if (cache.kpis.data) renderKpis(cache.kpis.data);
    });

    document.getElementById("btnToggleBrecha").addEventListener("click", () => {
        mostrarBrecha = !mostrarBrecha;
        const btn = document.getElementById("btnToggleBrecha");
        btn.classList.toggle("active", mostrarBrecha);
        btn.textContent = mostrarBrecha ? "Ocultar brecha" : "Mostrar brecha";
        if (cache.ventas.data) renderVentas(cache.ventas.data);
    });
}

/* =========================
   PESTAÑAS
========================= */

function switchTab(tab) {
    activeTab = tab;

    document.querySelectorAll(".reporte-tab").forEach(b => {
        b.classList.toggle("active", b.dataset.tab === tab);
    });
    document.getElementById("tabDescripcion").textContent = TAB_DESCRIPCIONES[tab];

    document.getElementById("tabContenidoVentas").classList.toggle("hidden", !(tab === "ventas" && !!cache.ventas.data));
    document.getElementById("tabContenidoKpis").classList.toggle("hidden", !(tab === "kpis" && !!cache.kpis.data));

    if (!hasGeneratedOnce) return;

    const filtersKey = JSON.stringify(leerFiltros());
    const entry = cache[tab];

    if (entry.data && entry.filtersKey === filtersKey) {
        return;
    }

    fetchAndRenderTab(tab, filtersKey, false);
}

/* =========================
   GENERAR REPORTE
========================= */

function leerFiltros() {
    return {
        anio1: Number(document.getElementById("filtroAnio1").value),
        anio2: Number(document.getElementById("filtroAnio2").value),
        metrica: document.getElementById("filtroMetrica").value,
        familias: getSeleccionMultiple("filtroFamilia"),
        profesionales: getSeleccionMultiple("filtroProfesional"),
        diasSemana: getSeleccionMultiple("filtroDiaSemana").map(Number),
        quincenas: getSeleccionMultiple("filtroQuincena").map(Number),
    };
}

async function handleGenerarReporte(event) {
    event.preventDefault();

    const anio1 = document.getElementById("filtroAnio1").value;
    const anio2 = document.getElementById("filtroAnio2").value;

    if (!anio1 || !anio2) {
        showReporteResult("Debe seleccionar Año 1 y Año 2.", true);
        return;
    }

    if (anio1 === anio2) {
        showReporteResult("Año 1 y Año 2 deben ser distintos.", true);
        return;
    }

    hasGeneratedOnce = true;
    const filtersKey = JSON.stringify(leerFiltros());

    await fetchAndRenderTab(activeTab, filtersKey, true);
}

async function fetchAndRenderTab(tab, filtersKey, esEnvioManual) {
    const btn = document.getElementById("btnGenerarReporte");
    const params = leerFiltros();

    try {
        if (esEnvioManual) {
            btn.disabled = true;
            btn.textContent = "Generando...";
            hideReporteResult();
        }

        const data = tab === "ventas"
            ? await obtenerReporteVentas(params)
            : await obtenerReporteKpis(params);

        if (!data) {
            showReporteResult("No se pudo obtener el reporte.", true);
            return;
        }

        cache[tab] = { filtersKey, data };

        document.getElementById("reporteLegendRow").classList.remove("hidden");

        if (tab === "ventas") {
            renderVentas(data);
            document.getElementById("tabContenidoVentas").classList.remove("hidden");
        } else {
            renderKpis(data);
            document.getElementById("tabContenidoKpis").classList.remove("hidden");
        }

    } catch (error) {
        showReporteResult(error.message || "Error al generar el reporte.", true);
    } finally {
        if (esEnvioManual) {
            btn.disabled = false;
            btn.textContent = "Generar reporte";
        }
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
   LEYENDA COMPARTIDA
========================= */

function actualizarLeyenda(labelA, labelB) {
    document.getElementById("reporteLegend").innerHTML = `
        <span class="legend-item"><span class="legend-dot" style="background:${C1}"></span>Año ${labelA}</span>
        <span class="legend-item"><span class="legend-dot" style="background:${C2}"></span>Año ${labelB}</span>
    `;
}

/* =========================
   KPI COMPARATIVO (3 tarjetas: valor Año1, valor Año2, variación)
========================= */

function renderKpiComparativo(containerId, tituloBase, valorA, valorB, labelA, labelB, fmt, countA, countB, countLabel) {
    const variacion = (valorA && valorB) ? ((valorB - valorA) / valorA * 100) : null;
    const conteoHtml = (count) => count === undefined
        ? ''
        : `<div class="count">${fmtInt(count)} ${countLabel || ''}</div>`;

    const kpis = [
        { label: `${tituloBase} ${labelA}`, count: conteoHtml(countA), value: fmt(valorA), sub: '' },
        { label: `${tituloBase} ${labelB}`, count: conteoHtml(countB), value: fmt(valorB), sub: '' },
        {
            label: 'Variación',
            count: '',
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
        d.innerHTML = `<div class="label">${k.label}</div>${k.count}<div class="value">${k.value}</div><div class="sub ${k.cls || ''}">${k.sub}</div>`;
        box.appendChild(d);
    });
}

/* =========================
   TABLAS KPIs
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
   RENDER: ANÁLISIS DE VENTAS
========================= */

function renderVentas(data) {
    const { anio1, anio2, metrica, meses, valores_anio1: dataA, valores_anio2: dataB } = data;
    const metricaLabel = METRICA_LABELS[metrica] || metrica;
    const labelA = String(anio1);
    const labelB = String(anio2);

    actualizarLeyenda(labelA, labelB);

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

/* =========================
   RENDER: ANÁLISIS DE KPIs
========================= */

function renderKpis(data) {
    const { anio1, anio2, metrica, meses } = data;
    const metricaLabel = METRICA_LABELS[metrica] || metrica;
    const labelA = String(anio1);
    const labelB = String(anio2);

    actualizarLeyenda(labelA, labelB);

    document.getElementById("ticketMensualSub").textContent =
        `Suma de ${metricaLabel} ÷ cantidad de tickets (fecha entrega + N° formulario) del mes`;

    drawGroupedBars(
        'chartTicketMensual', meses,
        data.ticket_mensual_anio1, data.ticket_mensual_anio2,
        C1, C2, labelA, labelB, fmtShort, undefined, false, mostrarValores
    );
    drawGroupedBars(
        'chartTicketMensualCantidad', meses,
        data.ticket_mensual_tickets_anio1, data.ticket_mensual_tickets_anio2,
        C1, C2, labelA, labelB, fmtInt, fmtInt, false, mostrarValores
    );

    drawGroupedBars(
        'chartTicketSemestral', SEMESTRES,
        data.ticket_semestral_anio1, data.ticket_semestral_anio2,
        C1, C2, labelA, labelB, fmtShort, undefined, false, mostrarValores
    );
    drawGroupedBars(
        'chartTicketSemestralCantidad', SEMESTRES,
        data.ticket_semestral_tickets_anio1, data.ticket_semestral_tickets_anio2,
        C1, C2, labelA, labelB, fmtInt, fmtInt, false, mostrarValores
    );

    renderKpiComparativo(
        'kpiTicketAnual', 'Ticket promedio',
        data.ticket_anual_anio1, data.ticket_anual_anio2,
        labelA, labelB, fmtCLP,
        data.ticket_anual_tickets_anio1, data.ticket_anual_tickets_anio2, 'tickets'
    );

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

    renderCrossSellingTable('crossSellingAnio1', 'crossTituloAnio1', anio1, data.cross_selling_anio1);
    renderCrossSellingTable('crossSellingAnio2', 'crossTituloAnio2', anio2, data.cross_selling_anio2);

    renderAbcTable('abcTablaAnio1', 'abcTituloAnio1', anio1, data.abc_anio1);
    renderAbcTable('abcTablaAnio2', 'abcTituloAnio2', anio2, data.abc_anio2);
}
