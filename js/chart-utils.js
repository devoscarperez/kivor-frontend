/* =========================
   COLORES COMPARTIDOS
========================= */

const C1 = "#2563eb";   // Año 1
const C2 = "#d97706";   // Año 2
const CUP = "#166534";
const CDOWN = "#991b1b";
const CLINE = "#e5e7eb";
const CDIM = "#6b7280";

/* =========================
   FORMATEO
========================= */

function fmtCLP(v) {
    if (v === null || v === undefined) return "—";
    return "$" + Math.round(v).toLocaleString("es-CL");
}

function fmtShort(v) {
    if (v === null || v === undefined) return "";
    const sign = v < 0 ? "-" : "";
    v = Math.abs(v);
    if (v >= 1000000) return sign + "$" + (v / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (v >= 1000) return sign + "$" + Math.round(v / 1000) + "K";
    return sign + "$" + v;
}

/* =========================
   TOOLTIP
========================= */

const tooltip = document.getElementById("tooltip");

function showTooltip(evt, titleHtml, rows) {
    tooltip.innerHTML = '<div class="t-title">' + titleHtml + '</div>' +
        rows.map(r => '<div class="t-row"><span class="t-dot" style="background:' + r.color + '"></span>' + r.label + '</div>').join('');
    tooltip.style.opacity = '1';
    moveTooltip(evt);
}

function moveTooltip(evt) {
    const pad = 14;
    let x = evt.clientX + pad;
    let y = evt.clientY + pad;
    const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
    if (x + tw > window.innerWidth - 10) x = evt.clientX - tw - pad;
    if (y + th > window.innerHeight - 10) y = evt.clientY - th - pad;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function hideTooltip() {
    tooltip.style.opacity = '0';
}

document.addEventListener('mousemove', (evt) => {
    if (tooltip && tooltip.style.opacity === '1') moveTooltip(evt);
});

/* =========================
   SVG HELPERS
========================= */

const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
}

function niceScale(maxVal, minVal) {
    minVal = minVal || 0;
    const range = maxVal - minVal;
    const roughStep = range / 4 || 1;
    const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const norm = roughStep / mag;
    let step;
    if (norm < 1.5) step = 1 * mag;
    else if (norm < 3) step = 2 * mag;
    else if (norm < 7) step = 5 * mag;
    else step = 10 * mag;
    const niceMin = Math.floor(minVal / step) * step;
    const niceMax = Math.ceil(maxVal / step) * step;
    const ticks = [];
    for (let t = niceMin; t <= niceMax + 1e-9; t += step) ticks.push(t);
    return { min: niceMin, max: niceMax || step, ticks: ticks.length ? ticks : [0, step] };
}

/* ============ GROUPED BAR CHART (2 series) ============ */
function drawGroupedBars(containerId, categories, seriesA, seriesB, colorA, colorB, labelA, labelB, fmtVal, fmtTooltip, mostrarBrechaFlag, mostrarValoresFlag) {
    fmtTooltip = fmtTooltip || fmtCLP;
    const container = document.getElementById(containerId);
    const W = 1080, H = 340;
    const padL = 64, padR = 16, padT = 16, padB = 34;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    const allVals = seriesA.concat(seriesB).filter(v => v !== null);
    const maxV = allVals.length ? Math.max(...allVals) : 0;
    const scale = niceScale(maxV, 0);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' });

    scale.ticks.forEach(t => {
        const y = padT + plotH - (t / scale.max) * plotH;
        svg.appendChild(el('line', { x1: padL, x2: W - padR, y1: y, y2: y, stroke: CLINE, 'stroke-width': 1 }));
        const txt = el('text', { x: padL - 10, y: y + 4, fill: CDIM, 'font-size': 11, 'text-anchor': 'end' });
        txt.textContent = fmtVal(t);
        svg.appendChild(txt);
    });

    const n = categories.length;
    const groupW = plotW / n;
    const barW = groupW * 0.30;
    const gap = groupW * 0.06;

    categories.forEach((cat, i) => {
        const gx = padL + i * groupW;
        const lbl = el('text', { x: gx + groupW / 2, y: H - padB + 18, fill: CDIM, 'font-size': 11, 'text-anchor': 'middle' });
        lbl.textContent = cat;
        svg.appendChild(lbl);

        let topY = null;

        [{ v: seriesA[i], color: colorA, label: labelA, idx: 0 }, { v: seriesB[i], color: colorB, label: labelB, idx: 1 }].forEach(s => {
            if (s.v === null) return;
            const barH = (s.v / scale.max) * plotH;
            const bx = gx + groupW / 2 - barW - gap / 2 + s.idx * (barW + gap);
            const by = padT + plotH - barH;
            if (topY === null || by < topY) topY = by;
            const rect = el('rect', { class: 'bar-shape series-' + s.idx, x: bx, y: by, width: barW, height: Math.max(barH, 1), fill: s.color, rx: 3 });
            rect.addEventListener('mousemove', (evt) => {
                showTooltip(evt, cat, [
                    { color: colorA, label: labelA + ': ' + (seriesA[i] !== null ? fmtTooltip(seriesA[i]) : '—') },
                    { color: colorB, label: labelB + ': ' + (seriesB[i] !== null ? fmtTooltip(seriesB[i]) : '—') }
                ]);
            });
            rect.addEventListener('mouseleave', hideTooltip);
            svg.appendChild(rect);

            if (mostrarValoresFlag) {
                const valEl = el('text', { x: bx + barW / 2, y: by - 6, fill: s.color, 'font-size': 9.5, 'font-weight': 700, 'text-anchor': 'middle' });
                valEl.textContent = fmtTooltip(s.v);
                svg.appendChild(valEl);
            }
        });

        if (mostrarBrechaFlag && seriesA[i] !== null && seriesB[i] !== null && topY !== null) {
            const delta = seriesB[i] - seriesA[i];
            const deltaPct = seriesA[i] ? (delta / seriesA[i] * 100) : null;
            const color = delta > 0 ? CUP : (delta < 0 ? CDOWN : CDIM);
            const pctY = Math.max(topY - (mostrarValoresFlag ? 24 : 8), padT + 20);
            const moneyY = pctY - 12;

            const pctText = deltaPct === null ? '' : (deltaPct >= 0 ? '+' : '') + deltaPct.toFixed(1) + '%';
            const moneyText = (delta > 0 ? '+' : '') + fmtShort(delta);

            const pctEl = el('text', { x: gx + groupW / 2, y: pctY, fill: color, 'font-size': 10.5, 'font-weight': 700, 'text-anchor': 'middle' });
            pctEl.textContent = pctText || moneyText;
            svg.appendChild(pctEl);

            if (pctText) {
                const moneyEl = el('text', { x: gx + groupW / 2, y: moneyY, fill: color, 'font-size': 9, 'text-anchor': 'middle' });
                moneyEl.textContent = moneyText;
                svg.appendChild(moneyEl);
            }
        }
    });

    container.innerHTML = '';
    container.appendChild(svg);
}

/* ============ LINE CHART (2 series, with area) ============ */
function drawLines(containerId, categories, seriesA, seriesB, colorA, colorB, labelA, labelB, fmtVal) {
    const container = document.getElementById(containerId);
    const W = 1080, H = 380;
    const padL = 64, padR = 16, padT = 16, padB = 34;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    const allVals = seriesA.concat(seriesB).filter(v => v !== null);
    const maxV = allVals.length ? Math.max(...allVals) : 0;
    const scale = niceScale(maxV, 0);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' });
    const defs = el('defs', {});
    [[colorA, 'gradA'], [colorB, 'gradB']].forEach(([c, id]) => {
        const g = el('linearGradient', { id, x1: '0', y1: '0', x2: '0', y2: '1' });
        g.appendChild(el('stop', { offset: '0%', 'stop-color': c, 'stop-opacity': 0.22 }));
        g.appendChild(el('stop', { offset: '100%', 'stop-color': c, 'stop-opacity': 0 }));
        defs.appendChild(g);
    });
    svg.appendChild(defs);

    scale.ticks.forEach(t => {
        const y = padT + plotH - (t / scale.max) * plotH;
        svg.appendChild(el('line', { x1: padL, x2: W - padR, y1: y, y2: y, stroke: CLINE, 'stroke-width': 1 }));
        const txt = el('text', { x: padL - 10, y: y + 4, fill: CDIM, 'font-size': 11, 'text-anchor': 'end' });
        txt.textContent = fmtVal(t);
        svg.appendChild(txt);
    });

    const n = categories.length;
    const stepX = plotW / (n - 1);

    function pointXY(i, v) {
        return [padL + i * stepX, padT + plotH - (v / scale.max) * plotH];
    }

    function drawSeries(series, color, gradId) {
        const pts = [];
        series.forEach((v, i) => { if (v !== null) pts.push([i, v]); });
        if (pts.length === 0) return;

        let areaD = '';
        pts.forEach(([i, v], k) => {
            const [x, y] = pointXY(i, v);
            areaD += (k === 0 ? 'M' : 'L') + x + ',' + y + ' ';
        });
        const [lastX] = pointXY(pts[pts.length - 1][0], pts[pts.length - 1][1]);
        const [firstX] = pointXY(pts[0][0], pts[0][1]);
        const baseY = padT + plotH;
        areaD += `L${lastX},${baseY} L${firstX},${baseY} Z`;
        svg.appendChild(el('path', { d: areaD, fill: `url(#${gradId})`, stroke: 'none' }));

        let lineD = '';
        pts.forEach(([i, v], k) => {
            const [x, y] = pointXY(i, v);
            lineD += (k === 0 ? 'M' : 'L') + x + ',' + y + ' ';
        });
        svg.appendChild(el('path', { d: lineD, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

        pts.forEach(([i, v]) => {
            const [x, y] = pointXY(i, v);
            const c = el('circle', { class: 'pt-shape', cx: x, cy: y, r: 4, fill: color, stroke: '#ffffff', 'stroke-width': 1.5 });
            c.addEventListener('mousemove', (evt) => {
                showTooltip(evt, categories[i], [
                    { color: colorA, label: labelA + ': ' + fmtCLP(seriesA[i]) },
                    { color: colorB, label: labelB + ': ' + fmtCLP(seriesB[i]) }
                ]);
            });
            c.addEventListener('mouseleave', hideTooltip);
            svg.appendChild(c);
        });
    }

    drawSeries(seriesA, colorA, 'gradA');
    drawSeries(seriesB, colorB, 'gradB');

    categories.forEach((cat, i) => {
        const [x] = pointXY(i, 0);
        const lbl = el('text', { x, y: H - padB + 18, fill: CDIM, 'font-size': 11, 'text-anchor': 'middle' });
        lbl.textContent = cat;
        svg.appendChild(lbl);
    });

    container.innerHTML = '';
    container.appendChild(svg);
}

/* ============ SINGLE-SERIES BAR (signed, e.g. YoY %) ============ */
function drawSignedBars(containerId, categories, series, fmtVal, mostrarValoresFlag) {
    const container = document.getElementById(containerId);
    const W = 520, H = 300;
    const padL = 54, padR = 12, padT = 16, padB = 34;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    const vals = series.filter(v => v !== null);
    const maxV = Math.max(...vals, 0);
    const minV = Math.min(...vals, 0);
    const upScale = niceScale(maxV, 0);
    const downScale = niceScale(Math.abs(minV), 0);
    const scaleMax = Math.max(upScale.max, downScale.max, 1);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' });
    const zeroY = padT + plotH / 2;

    [scaleMax, scaleMax / 2, 0, -scaleMax / 2, -scaleMax].forEach(t => {
        const y = zeroY - (t / scaleMax) * (plotH / 2);
        svg.appendChild(el('line', { x1: padL, x2: W - padR, y1: y, y2: y, stroke: CLINE, 'stroke-width': t === 0 ? 1.4 : 1 }));
        const txt = el('text', { x: padL - 8, y: y + 4, fill: CDIM, 'font-size': 10.5, 'text-anchor': 'end' });
        txt.textContent = fmtVal(t);
        svg.appendChild(txt);
    });

    const n = categories.length;
    const colW = plotW / n;
    const barW = colW * 0.5;

    categories.forEach((cat, i) => {
        const cx = padL + i * colW + colW / 2;
        const lbl = el('text', { x: cx, y: H - padB + 18, fill: CDIM, 'font-size': 11, 'text-anchor': 'middle' });
        lbl.textContent = cat;
        svg.appendChild(lbl);

        const v = series[i];
        if (v === null) {
            const dash = el('line', { x1: cx - barW / 2, x2: cx + barW / 2, y1: zeroY, y2: zeroY, stroke: CDIM, 'stroke-width': 1.5, 'stroke-dasharray': '3,3' });
            svg.appendChild(dash);
            return;
        }
        const h = Math.abs(v / scaleMax) * (plotH / 2);
        const y = v >= 0 ? zeroY - h : zeroY;
        const color = v >= 0 ? CUP : CDOWN;
        const rect = el('rect', { class: 'bar-shape', x: cx - barW / 2, y, width: barW, height: Math.max(h, 1), fill: color, rx: 3 });
        rect.addEventListener('mousemove', (evt) => {
            showTooltip(evt, cat, [{ color, label: (v >= 0 ? '+' : '') + v.toFixed(1) + '%' }]);
        });
        rect.addEventListener('mouseleave', hideTooltip);
        svg.appendChild(rect);

        if (mostrarValoresFlag) {
            const labelY = v >= 0 ? y - 6 : y + Math.max(h, 1) + 12;
            const valEl = el('text', { x: cx, y: labelY, fill: color, 'font-size': 9.5, 'font-weight': 700, 'text-anchor': 'middle' });
            valEl.textContent = fmtVal(v);
            svg.appendChild(valEl);
        }
    });

    container.innerHTML = '';
    container.appendChild(svg);
}

/* ============ CUMULATIVE LINE (2 series, no fill) ============ */
function drawCumLines(containerId, categories, seriesA, seriesB, colorA, colorB, labelA, labelB, fmtVal) {
    const container = document.getElementById(containerId);
    const W = 520, H = 300;
    const padL = 64, padR = 16, padT = 16, padB = 34;
    const plotW = W - padL - padR, plotH = H - padT - padB;

    const allVals = seriesA.concat(seriesB).filter(v => v !== null);
    const maxV = allVals.length ? Math.max(...allVals) : 0;
    const scale = niceScale(maxV, 0);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' });

    scale.ticks.forEach(t => {
        const y = padT + plotH - (t / scale.max) * plotH;
        svg.appendChild(el('line', { x1: padL, x2: W - padR, y1: y, y2: y, stroke: CLINE, 'stroke-width': 1 }));
        const txt = el('text', { x: padL - 8, y: y + 4, fill: CDIM, 'font-size': 10.5, 'text-anchor': 'end' });
        txt.textContent = fmtVal(t);
        svg.appendChild(txt);
    });

    const n = categories.length;
    const stepX = plotW / (n - 1);
    function pointXY(i, v) { return [padL + i * stepX, padT + plotH - (v / scale.max) * plotH]; }

    function drawSeries(series, color) {
        const pts = [];
        series.forEach((v, i) => { if (v !== null) pts.push([i, v]); });
        if (pts.length === 0) return;
        let d = '';
        pts.forEach(([i, v], k) => {
            const [x, y] = pointXY(i, v);
            d += (k === 0 ? 'M' : 'L') + x + ',' + y + ' ';
        });
        svg.appendChild(el('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
        pts.forEach(([i, v]) => {
            const [x, y] = pointXY(i, v);
            const c = el('circle', { class: 'pt-shape', cx: x, cy: y, r: 3.5, fill: color, stroke: '#ffffff', 'stroke-width': 1.3 });
            c.addEventListener('mousemove', (evt) => {
                showTooltip(evt, categories[i], [
                    { color: colorA, label: labelA + ' acum.: ' + fmtCLP(seriesA[i]) },
                    { color: colorB, label: labelB + ' acum.: ' + fmtCLP(seriesB[i]) }
                ]);
            });
            c.addEventListener('mouseleave', hideTooltip);
            svg.appendChild(c);
        });
    }

    drawSeries(seriesA, colorA);
    drawSeries(seriesB, colorB);

    categories.forEach((cat, i) => {
        const [x] = pointXY(i, 0);
        const lbl = el('text', { x, y: H - padB + 18, fill: CDIM, 'font-size': 10.5, 'text-anchor': 'middle' });
        lbl.textContent = cat;
        svg.appendChild(lbl);
    });

    container.innerHTML = '';
    container.appendChild(svg);
}

function cumulative(arr) {
    let sum = 0, out = [];
    for (const v of arr) {
        if (v === null) { out.push(null); continue; }
        sum += v;
        out.push(sum);
    }
    return out;
}
