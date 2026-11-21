// Ticket Mágico — Etapa 1: un ticket por pantalla, solo lectura + navegación.
// Sin cajones secretos todavía (eso viene en la próxima etapa).

const DIAS_SEMANA_M = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// Mismo agrupamiento de color que ya usa ticket.js (grupoStatus). Started/
// Completed/Approved/Finished quedan en "neutral" hasta que se defina su
// semántica/color en el resto de la app — no se inventa aquí.
const STATUS_GRUPO_M = {
    "Inactive": "error",
    "Assigned": "warning",
    "Started": "info",
};

const STATUS_ES = {
    "Inactive": "Inactivo",
    "Assigned": "Asignado",
    "Started": "Iniciado",
    "Completed": "Completado",
    "Approved": "Aprobado",
    "Finished": "Finalizado",
};

let ticketsDelDia = [];
let indiceActual = 0;

// Filtros: por defecto, "hoy" y todos los status — igual que el
// comportamiento actual. Solo cambian si el usuario los toca.
let filtroDesde = null;
let filtroHasta = null;
let filtroStatus = [];

function authHeadersM() {
    const t = sessionStorage.getItem("access_token");
    return { "Authorization": `Bearer ${t}` };
}

function escapeHtmlM(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatearFechaM(valor) {
    if (!valor) return "-";
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return "-";
    return fecha.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short", hour12: false });
}

function formatearMontoM(valor) {
    return `$${Number(valor || 0).toLocaleString("es-CL")}`;
}

function tiempoTranscurridoM(valor) {
    if (!valor) return "-";
    const inicio = new Date(valor).getTime();
    if (isNaN(inicio)) return "-";

    const diffMin = Math.floor((Date.now() - inicio) / 60000);
    if (diffMin < 1) return "recién";
    if (diffMin < 60) return `${diffMin} min`;

    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} h`;

    const diffD = Math.floor(diffH / 24);
    return `${diffD} d`;
}

function fechaLocalISOM(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function actualizarFechaCabeceraM() {
    const hoy = new Date();
    const dia = DIAS_SEMANA_M[hoy.getDay()];
    const diaCapitalizado = dia.charAt(0).toUpperCase() + dia.slice(1);
    const fechaTexto = hoy.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
    document.getElementById("ticketmFecha").textContent = `${diaCapitalizado}, ${fechaTexto}`;
}

function hoyISOM() {
    return fechaLocalISOM(new Date());
}

function filtrosSonPorDefecto() {
    return filtroDesde === hoyISOM() && filtroHasta === hoyISOM() && filtroStatus.length === 0;
}

function actualizarHuellaFiltros() {
    document.getElementById("btnFiltros").classList.toggle("ticketm-filtro-activo", !filtrosSonPorDefecto());
}

async function cargarTicketsDelDia() {
    if (filtroDesde === null) filtroDesde = hoyISOM();
    if (filtroHasta === null) filtroHasta = hoyISOM();

    const params = new URLSearchParams();
    params.append("date_from", filtroDesde);
    params.append("date_to", filtroHasta);
    filtroStatus.forEach(s => params.append("status", s));
    params.append("order", "asc");
    params.append("date_field", "booking");

    try {
        const response = await fetch(`${API_BASE}/ticket?${params.toString()}`, {
            headers: authHeadersM()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const tickets = await response.json();
        ticketsDelDia = tickets || [];
        indiceActual = 0;
        renderActual();
        actualizarHuellaFiltros();

    } catch (error) {
        console.error("Error cargando tickets:", error);
        document.getElementById("ticketmSlot").innerHTML =
            `<div class="ticketm-vacio">No se pudo cargar el ticket. Intenta actualizar.</div>`;
    }
}

function construirTicketHTML(t) {
    const nombreClienta = escapeHtmlM(t.customer_full_name || t.customer_nickname || "Sin asignar");
    const grupo = STATUS_GRUPO_M[t.ticket_status] || "neutral";
    const statusTexto = STATUS_ES[t.ticket_status] || t.ticket_status;
    const profesionales = t.professional_count || 0;
    const aliasProfesionales = (t.professional_aliases && t.professional_aliases.length)
        ? t.professional_aliases.join(" · ")
        : "—";

    return `
        <div class="ticket" aria-label="Ticket número ${escapeHtmlM(t.ticket_id)} de ${nombreClienta}">
            <span class="cut cut-l cut-top"></span>
            <span class="cut cut-l cut-bottom"></span>
            <span class="cut cut-r cut-top"></span>
            <span class="cut cut-r cut-bottom"></span>
            <div class="frame">
                <div class="main">
                    <h1 class="name">${nombreClienta}</h1>
                    <div class="rule"></div>
                    <div class="row">
                        <span>${formatearFechaM(t.ticket_booking_date)}</span>
                        <span class="pill pill-${grupo}">${escapeHtmlM(statusTexto)}</span>
                        <span class="antiguedad">${tiempoTranscurridoM(t.ticket_status_changed_at)}</span>
                    </div>
                    <div class="details">
                        <div><span class="label">Profesionales (${profesionales})</span><strong>${escapeHtmlM(aliasProfesionales)}</strong></div>
                        <div class="money"><span class="label">Abono</span><strong>${formatearMontoM(t.ticket_booking_deposit)}</strong></div>
                    </div>
                    <div class="rule"></div>
                    <div class="ticket-footer">Cre: ${formatearFechaM(t.ticket_created_at)} · Act: ${formatearFechaM(t.ticket_updated_at)}</div>
                </div>
                <div class="stub"><span class="number">${escapeHtmlM(t.ticket_id)}</span></div>
            </div>
        </div>
    `;
}

function renderActual() {
    const slot = document.getElementById("ticketmSlot");
    const indice = document.getElementById("ticketmIndice");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    if (!ticketsDelDia.length) {
        const mensaje = filtrosSonPorDefecto()
            ? "No hay tickets agendados para hoy."
            : "No hay tickets para los filtros seleccionados.";
        slot.innerHTML = `<div class="ticketm-vacio">${mensaje}</div>`;
        indice.textContent = "";
        btnPrev.disabled = true;
        btnNext.disabled = true;
        return;
    }

    const actual = ticketsDelDia[indiceActual];
    slot.innerHTML = construirTicketHTML(actual);

    indice.textContent = `Ticket ${indiceActual + 1} de ${ticketsDelDia.length}`;
    btnPrev.disabled = indiceActual === 0;
    btnNext.disabled = indiceActual === ticketsDelDia.length - 1;
}

function irAnterior() {
    if (indiceActual > 0) {
        indiceActual--;
        renderActual();
    }
}

function irSiguiente() {
    if (indiceActual < ticketsDelDia.length - 1) {
        indiceActual++;
        renderActual();
    }
}

function inicializarSwipe() {
    const slot = document.getElementById("ticketmSlot");
    let inicioX = null;
    let inicioY = null;

    slot.addEventListener("touchstart", (e) => {
        inicioX = e.touches[0].clientX;
        inicioY = e.touches[0].clientY;
    }, { passive: true });

    slot.addEventListener("touchend", (e) => {
        if (inicioX === null) return;

        const finX = e.changedTouches[0].clientX;
        const finY = e.changedTouches[0].clientY;
        const deltaX = finX - inicioX;
        const deltaY = finY - inicioY;

        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
            if (deltaX < 0) irSiguiente();
            else irAnterior();
        }

        inicioX = null;
        inicioY = null;
    }, { passive: true });
}

function construirChipsStatus() {
    const contenedor = document.getElementById("fStatusChips");
    contenedor.innerHTML = "";

    Object.keys(STATUS_ES).forEach(status => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "ticketm-status-chip";
        chip.textContent = STATUS_ES[status];
        chip.dataset.status = status;
        chip.addEventListener("click", () => {
            chip.classList.toggle("activo");
        });
        contenedor.appendChild(chip);
    });
}

function abrirPanelFiltros() {
    const panel = document.getElementById("panelFiltros");
    const boton = document.getElementById("btnFiltros");

    document.getElementById("fFechaDesde").value = filtroDesde || hoyISOM();
    document.getElementById("fFechaHasta").value = filtroHasta || hoyISOM();

    document.querySelectorAll("#fStatusChips .ticketm-status-chip").forEach(chip => {
        chip.classList.toggle("activo", filtroStatus.includes(chip.dataset.status));
    });

    panel.hidden = false;
    boton.setAttribute("aria-expanded", "true");
}

function cerrarPanelFiltros() {
    document.getElementById("panelFiltros").hidden = true;
    document.getElementById("btnFiltros").setAttribute("aria-expanded", "false");
}

function aplicarFiltros() {
    filtroDesde = document.getElementById("fFechaDesde").value || hoyISOM();
    filtroHasta = document.getElementById("fFechaHasta").value || hoyISOM();
    filtroStatus = Array.from(document.querySelectorAll("#fStatusChips .ticketm-status-chip.activo"))
        .map(chip => chip.dataset.status);

    cerrarPanelFiltros();
    cargarTicketsDelDia();
}

document.getElementById("btnPrev").addEventListener("click", irAnterior);
document.getElementById("btnNext").addEventListener("click", irSiguiente);
document.getElementById("btnRefrescarM").addEventListener("click", cargarTicketsDelDia);
document.getElementById("btnFiltros").addEventListener("click", () => {
    const abierto = document.getElementById("panelFiltros").hidden === false;
    if (abierto) cerrarPanelFiltros();
    else abrirPanelFiltros();
});
document.getElementById("btnAplicarFiltrosM").addEventListener("click", aplicarFiltros);

actualizarFechaCabeceraM();
construirChipsStatus();
inicializarSwipe();
cargarTicketsDelDia();
