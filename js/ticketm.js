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

// Orden en que se cicla el status al arrastrar verticalmente el
// talón izquierdo. Mismo orden que ya usan los filtros (TODOS_LOS_STATUS
// en ticket.js). El cambio es solo visual por ahora -no se guarda en
// la base de datos todavía, eso vendrá cuando construyamos el secreto
// de status con escritura real.
const ORDEN_STATUS = ["Inactive", "Assigned", "Started", "Completed", "Approved", "Finished"];

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
                <div class="stub-status grupo-${grupo}" id="stubStatus" data-status="${escapeHtmlM(t.ticket_status)}">
                    <span class="status-vertical">${escapeHtmlM(statusTexto)}</span>
                </div>
                <div class="main">
                    <div class="name-wrap">
                        <h1 class="name">${nombreClienta}</h1>
                        <span class="atenciones-contador" id="atencionesContador"></span>
                    </div>
                    <div class="rule"></div>
                    <div class="details">
                        <div class="atenciones-lista" id="atencionesLista"><div class="ficha-vacio">—</div></div>
                    </div>
                    <div class="rule"></div>
                    <div class="ticket-footer">
                        <span class="abono-footer"><span class="label">Abono</span><strong>${formatearMontoM(t.ticket_booking_deposit)}</strong></span>
                        <span class="antiguedad">${tiempoTranscurridoM(t.ticket_booking_date)}</span>
                        <!-- Cre/Act deshabilitado por ahora, no hace falta mostrarlo:
                        <span class="ticket-fechas">Cre: ${formatearFechaM(t.ticket_created_at)} · Act: ${formatearFechaM(t.ticket_updated_at)}</span>
                        -->
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

// Lista de hasta 3 atenciones relajadas, con scroll vertical si hay
// más -reemplaza el modelo de "una a la vez con arrastre horizontal".
// El contador junto al nombre de la titular indica la posición actual
// según qué fila esté más arriba del scroll, y el total, para saber
// si conviene seguir desplazándose.
function renderFicha() {
    const lista = document.getElementById("atencionesLista");
    const contador = document.getElementById("atencionesContador");
    if (!lista) return;

    if (!atencionesActuales.length) {
        lista.innerHTML = `<div class="ficha-vacio">—</div>`;
        if (contador) contador.textContent = "";
        ajustarNumeroTicket();
        return;
    }

    lista.innerHTML = atencionesActuales.map(a => `
        <div class="ficha-atencion">
            <span class="ficha-clienta">${escapeHtmlM(a.clienta)}</span>
            <span class="ficha-sep">–</span>
            <span class="ficha-profesional">${escapeHtmlM(a.profesional)}</span>
            <span class="ficha-sep">–</span>
            <span class="ficha-fecha">${formatearFechaM(a.fecha)}</span>
        </div>
    `).join("");

    lista.addEventListener("scroll", actualizarContadorAtenciones, { passive: true });
    actualizarContadorAtenciones();
    ajustarNumeroTicket();
}

function actualizarContadorAtenciones() {
    const lista = document.getElementById("atencionesLista");
    const contador = document.getElementById("atencionesContador");
    if (!lista || !contador || !atencionesActuales.length) return;

    const filas = lista.querySelectorAll(".ficha-atencion");
    if (!filas.length) return;

    let indiceVisible = 0;
    filas.forEach((fila, i) => {
        if (fila.offsetTop <= lista.scrollTop + 4) indiceVisible = i;
    });

    const posicion = String(indiceVisible + 1).padStart(2, "0");
    const total = String(atencionesActuales.length).padStart(2, "0");
    contador.textContent = `${posicion}-${total}`;
}

function ajustarNumeroTicket() {
    const stub = document.querySelector(".ticket .stub");
    const numero = document.querySelector(".ticket .number");
    if (stub && numero) {
        // El número (siempre 5 dígitos) debe ocupar todo el alto del talón.
        const alto = stub.clientHeight;
        numero.style.fontSize = `${Math.floor(alto / 5.2)}px`;
    }

    // Mismo criterio para el status: llenar el alto del talón. El
    // divisor usa el largo real de la palabra (varía 8-10 letras según
    // el status) en vez de un valor fijo, para que nunca se corte.
    const stubStatus = document.querySelector(".ticket .stub-status");
    const statusTexto = document.querySelector(".ticket .status-vertical");
    if (stubStatus && statusTexto) {
        const altoStatus = stubStatus.clientHeight;
        const largo = statusTexto.textContent.length || 1;
        statusTexto.style.fontSize = `${Math.floor(altoStatus / (largo * 1.04))}px`;
    }
}

function renderActual() {
    const slot = document.getElementById("ticketmSlot");

    if (!ticketsDelDia.length) {
        const mensaje = filtrosSonPorDefecto()
            ? "No hay tickets agendados para hoy."
            : "No hay tickets para los filtros seleccionados.";
        slot.innerHTML = `<div class="ticketm-vacio">${mensaje}</div>`;
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

// Arrastre vertical sobre el talón de status, para ciclar entre los
// estados (mismo orden que los filtros). Por ahora es solo visual —
// no llama a ningún endpoint todavía, eso llega con el secreto de
// status con escritura real.
function inicializarArrastreStatus() {
    const slot = document.getElementById("ticketmSlot");
    let inicioY = null;
    let enStub = false;

    slot.addEventListener("touchstart", (e) => {
        enStub = !!e.target.closest(".stub-status");
        inicioY = enStub ? e.touches[0].clientY : null;
    }, { passive: true });

    slot.addEventListener("touchend", (e) => {
        if (!enStub || inicioY === null) return;

        const finY = e.changedTouches[0].clientY;
        const deltaY = finY - inicioY;

        if (Math.abs(deltaY) > 40) {
            cambiarStatusVisual(deltaY < 0 ? 1 : -1);
        }

        inicioY = null;
        enStub = false;
    }, { passive: true });
}

function cambiarStatusVisual(direccion) {
    const stub = document.getElementById("stubStatus");
    if (!stub) return;

    const actual = stub.dataset.status;
    const indiceActualStatus = ORDEN_STATUS.indexOf(actual);
    const nuevoIndice = Math.min(ORDEN_STATUS.length - 1, Math.max(0, indiceActualStatus + direccion));
    if (nuevoIndice === indiceActualStatus) return;

    const nuevoStatus = ORDEN_STATUS[nuevoIndice];
    const nuevoGrupo = STATUS_GRUPO_M[nuevoStatus] || "neutral";

    stub.dataset.status = nuevoStatus;
    stub.className = `stub-status grupo-${nuevoGrupo}`;
    stub.querySelector(".status-vertical").textContent = STATUS_ES[nuevoStatus] || nuevoStatus;
    ajustarNumeroTicket();
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
inicializarArrastreStatus();
cargarTicketsDelDia();

window.addEventListener("resize", ajustarNumeroTicket);
