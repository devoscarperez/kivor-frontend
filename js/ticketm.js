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

function numeroTicketPadded(ticketId) {
    return String(ticketId).padStart(5, "0");
}

function construirTicketHTML(t, contador) {
    const nombreClienta = escapeHtmlM(t.customer_full_name || t.customer_nickname || "Sin asignar");
    const grupo = STATUS_GRUPO_M[t.ticket_status] || "neutral";
    const statusTexto = STATUS_ES[t.ticket_status] || t.ticket_status;
    const numero = numeroTicketPadded(t.ticket_id);

    return `
        <div class="ticket" aria-label="Ticket número ${numero} de ${nombreClienta}">
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
                        <span class="antiguedad">${tiempoTranscurridoM(t.ticket_booking_date)}</span>
                    </div>
                    <div class="details">
                        <div class="ficha-wrap" id="fichaWrap"><span class="label">Atención</span><strong class="ficha-vacio">—</strong></div>
                        <div class="money"><span class="label">Abono</span><strong>${formatearMontoM(t.ticket_booking_deposit)}</strong></div>
                    </div>
                    <div class="rule"></div>
                    <div class="ticket-footer">
                        <span class="ticket-fechas">Cre: ${formatearFechaM(t.ticket_created_at)} · Act: ${formatearFechaM(t.ticket_updated_at)}</span>
                        <span class="ticket-contador">${contador}</span>
                    </div>
                </div>
                <div class="stub"><span class="number">${numero}</span></div>
            </div>
        </div>
    `;
}

// La "ficha de atención" (Clienta – Profesional – Fecha hora) vive en
// ticket_professional_customer, no en el endpoint de lista — por eso
// se pide aparte, por ticket, reutilizando el mismo endpoint que ya
// usa ticket-profesionales.html.
let atencionesActuales = [];
let indiceAtencionActual = 0;

function aplanarAtenciones(profesionales) {
    const atenciones = [];
    (profesionales || []).forEach(p => {
        const nombreProfesional = p.professional_name || p.professional_nickname || "Sin nombre";
        (p.customers || []).forEach(c => {
            atenciones.push({
                clienta: c.customer_full_name || c.customer_nickname || "Sin clienta",
                profesional: nombreProfesional,
                fecha: c.ticket_professional_customer_booking_date
            });
        });
    });
    return atenciones;
}

async function cargarAtenciones(ticketId) {
    try {
        const response = await fetch(`${API_BASE}/ticket/${ticketId}/professionals`, {
            headers: authHeadersM()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const profesionales = await response.json();
        atencionesActuales = aplanarAtenciones(profesionales);
        indiceAtencionActual = 0;
        renderFicha();

    } catch (error) {
        console.error("Error cargando atenciones:", error);
    }
}

function renderFicha() {
    const wrap = document.getElementById("fichaWrap");
    if (!wrap) return;

    if (!atencionesActuales.length) {
        wrap.innerHTML = `<span class="label">Atención</span><strong class="ficha-vacio">—</strong>`;
        ajustarNumeroTicket();
        return;
    }

    const a = atencionesActuales[indiceAtencionActual];
    const posicion = String(indiceAtencionActual + 1).padStart(2, "0");
    const total = String(atencionesActuales.length).padStart(2, "0");

    wrap.innerHTML = `
        <span class="label">Atención <span class="ficha-contador">${posicion}-${total}</span></span>
        <div class="ficha-atencion">
            <strong class="ficha-nombre">${escapeHtmlM(a.clienta)} – ${escapeHtmlM(a.profesional)}</strong>
            <div class="ficha-hora">${formatearFechaM(a.fecha)}</div>
        </div>
    `;
    ajustarNumeroTicket();
}

function anteriorAtencion() {
    if (indiceAtencionActual > 0) {
        indiceAtencionActual--;
        renderFicha();
    }
}

function siguienteAtencion() {
    if (indiceAtencionActual < atencionesActuales.length - 1) {
        indiceAtencionActual++;
        renderFicha();
    }
}

// Arrastre horizontal específico sobre la ficha, para moverse entre
// las atenciones del mismo ticket -no choca con el arrastre vertical
// del número (otra zona) ni con el swipe de salida/entrada entre
// tickets (ese lo dispara el usuario desde los botones o el número).
function inicializarArrastreFicha() {
    const slot = document.getElementById("ticketmSlot");
    let inicioX = null;
    let enFicha = false;

    slot.addEventListener("touchstart", (e) => {
        enFicha = !!e.target.closest(".ficha-atencion");
        inicioX = enFicha ? e.touches[0].clientX : null;
    }, { passive: true });

    slot.addEventListener("touchend", (e) => {
        if (!enFicha || inicioX === null) return;

        const finX = e.changedTouches[0].clientX;
        const deltaX = finX - inicioX;

        if (Math.abs(deltaX) > 40) {
            if (deltaX < 0) siguienteAtencion();
            else anteriorAtencion();
        }

        inicioX = null;
        enFicha = false;
    }, { passive: true });
}

function ajustarNumeroTicket() {
    const stub = document.querySelector(".ticket .stub");
    const numero = document.querySelector(".ticket .number");
    if (!stub || !numero) return;

    // El número (siempre 5 dígitos) debe ocupar todo el alto del talón.
    const alto = stub.clientHeight;
    const tamano = Math.floor(alto / 5.2);
    numero.style.fontSize = `${tamano}px`;
}

function renderActual() {
    const slot = document.getElementById("ticketmSlot");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    if (!ticketsDelDia.length) {
        const mensaje = filtrosSonPorDefecto()
            ? "No hay tickets agendados para hoy."
            : "No hay tickets para los filtros seleccionados.";
        slot.innerHTML = `<div class="ticketm-vacio">${mensaje}</div>`;
        btnPrev.disabled = true;
        btnNext.disabled = true;
        return;
    }

    const actual = ticketsDelDia[indiceActual];
    const posicion = String(indiceActual + 1).padStart(2, "0");
    const total = String(ticketsDelDia.length).padStart(2, "0");

    slot.innerHTML = construirTicketHTML(actual, `${posicion}-${total}`);
    ajustarNumeroTicket();

    atencionesActuales = [];
    indiceAtencionActual = 0;
    if (actual.professional_count > 0) {
        cargarAtenciones(actual.ticket_id);
    }

    btnPrev.disabled = indiceActual === 0;
    btnNext.disabled = indiceActual === ticketsDelDia.length - 1;
}

let cambioEnCurso = false;

function prefiereMenosMovimiento() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// El ticket sale (hacia arriba si avanzamos, hacia abajo si retrocedemos)
// y recién cuando termina de salir entra el siguiente desde el lado
// opuesto -como pasar páginas. La animación se aplica al contenedor
// del ticket, nunca al ticket mismo (ese combo ya causó un glitch
// visual con la sombra en capa aparte; se verificó por separado).
function cambiarTicket(nuevoIndice, direccion) {
    if (cambioEnCurso) return;

    if (prefiereMenosMovimiento()) {
        indiceActual = nuevoIndice;
        renderActual();
        return;
    }

    cambioEnCurso = true;
    const slot = document.getElementById("ticketmSlot");
    const claseSale = direccion === "siguiente" ? "ticketm-sale-arriba" : "ticketm-sale-abajo";
    const claseEntra = direccion === "siguiente" ? "ticketm-entra-abajo" : "ticketm-entra-arriba";

    slot.classList.add(claseSale);

    slot.addEventListener("animationend", function alTerminarSalida() {
        slot.removeEventListener("animationend", alTerminarSalida);
        slot.classList.remove(claseSale);

        indiceActual = nuevoIndice;
        renderActual();

        slot.classList.add(claseEntra);
        slot.addEventListener("animationend", function alTerminarEntrada() {
            slot.removeEventListener("animationend", alTerminarEntrada);
            slot.classList.remove(claseEntra);
            cambioEnCurso = false;
        });
    });
}

function irAnterior() {
    if (indiceActual > 0) {
        cambiarTicket(indiceActual - 1, "anterior");
    }
}

function irSiguiente() {
    if (indiceActual < ticketsDelDia.length - 1) {
        cambiarTicket(indiceActual + 1, "siguiente");
    }
}

// El gesto de navegación vive específicamente en el número del ticket
// (el talón), no en toda la tarjeta — así no choca con otros cajones
// secretos que más adelante usarán arrastre horizontal (status, fichas
// de atención). Arrastrar hacia arriba avanza, hacia abajo retrocede.
function inicializarArrastreNumero() {
    const slot = document.getElementById("ticketmSlot");
    let inicioY = null;
    let enTalon = false;

    slot.addEventListener("touchstart", (e) => {
        enTalon = !!e.target.closest(".stub");
        inicioY = enTalon ? e.touches[0].clientY : null;
    }, { passive: true });

    slot.addEventListener("touchend", (e) => {
        if (!enTalon || inicioY === null) return;

        const finY = e.changedTouches[0].clientY;
        const deltaY = finY - inicioY;

        if (Math.abs(deltaY) > 40) {
            if (deltaY < 0) irSiguiente();
            else irAnterior();
        }

        inicioY = null;
        enTalon = false;
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
inicializarArrastreNumero();
inicializarArrastreFicha();
cargarTicketsDelDia();

window.addEventListener("resize", ajustarNumeroTicket);
