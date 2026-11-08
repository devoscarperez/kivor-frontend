const REFRESCO_MS = 20000;
const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// Valores reales permitidos por el constraint chk_ticket_status en BD.
// Started/Completed/Approved/Finished quedan con el color neutro de
// respaldo (ver grupoStatus) hasta definir su semántica/color.
const STATUS_GRUPO = {
    "Inactive": "error",
    "Assigned": "warning",
};

const TODOS_LOS_STATUS = ["Inactive", "Assigned", "Started", "Completed", "Approved", "Finished"];

let ordenActual = "desc";
let campoFechaActual = "created";
let statusSeleccionados = [];
let ticketsActuales = [];

function authHeaders() {
    const t = sessionStorage.getItem("access_token");
    return { "Authorization": `Bearer ${t}` };
}

let toastTimeout = null;

function mostrarToast(texto, esError = false) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = texto;
    toast.classList.toggle("toast-error", esError);
    toast.classList.add("visible");

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("visible"), 3500);
}

async function extraerMensajeError(response, mensajePorDefecto) {
    try {
        const data = await response.json();
        return data.detail || mensajePorDefecto;
    } catch (e) {
        return mensajePorDefecto;
    }
}

function grupoStatus(status) {
    return STATUS_GRUPO[status] || "neutral";
}

function escapeHtml(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatearFecha(valor) {
    if (!valor) return "-";
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return "-";
    return fecha.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short", hour12: false });
}

function tiempoTranscurrido(valor) {
    if (!valor) return "-";
    const inicio = new Date(valor).getTime();
    if (isNaN(inicio)) return "-";

    const diffMin = Math.floor((Date.now() - inicio) / 60000);
    if (diffMin < 1) return "recién";
    if (diffMin < 60) return `hace ${diffMin} min`;

    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} h`;

    const diffD = Math.floor(diffH / 24);
    return `hace ${diffD} d`;
}

function nivelAntiguedad(status, statusChangedAt) {
    if (status === "Completed") return "antiguedad-na";

    const inicio = new Date(statusChangedAt).getTime();
    if (isNaN(inicio)) return "antiguedad-na";

    const horas = (Date.now() - inicio) / (1000 * 60 * 60);

    if (horas <= 1) return "antiguedad-ok";
    if (horas <= 4) return "antiguedad-media";
    return "antiguedad-alerta";
}

function actualizarFechaCabecera() {
    const hoy = new Date();
    const dia = DIAS_SEMANA[hoy.getDay()];
    const diaCapitalizado = dia.charAt(0).toUpperCase() + dia.slice(1);
    const fechaTexto = hoy.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });

    document.getElementById("fechaCabecera").textContent = `${diaCapitalizado}, ${fechaTexto}`;
}

function fechaLocalISO(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function horaLocalHHMM(fecha) {
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    return `${horas}:${minutos}`;
}

function inicializarFiltros() {
    const hoy = fechaLocalISO(new Date());
    document.getElementById("fechaDesde").value = hoy;
    document.getElementById("fechaHasta").value = hoy;

    const contenedor = document.getElementById("statusBotones");
    contenedor.innerHTML = "";

    const btnTodos = document.createElement("button");
    btnTodos.type = "button";
    btnTodos.className = "status-boton";
    btnTodos.dataset.status = "__todos__";
    btnTodos.textContent = "Todos";
    btnTodos.addEventListener("click", () => toggleStatusBoton("__todos__"));
    contenedor.appendChild(btnTodos);

    TODOS_LOS_STATUS.forEach(status => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "status-boton";
        boton.dataset.status = status;
        boton.textContent = status;
        boton.addEventListener("click", () => toggleStatusBoton(status));
        contenedor.appendChild(boton);
    });

    renderStatusBotones();

    const selector = document.getElementById("statusSelector");
    selector.innerHTML = "";
    TODOS_LOS_STATUS.forEach(status => {
        const opcion = document.createElement("option");
        opcion.value = status;
        opcion.textContent = status;
        selector.appendChild(opcion);
    });
}

function toggleStatusBoton(status) {
    if (status === "__todos__") {
        statusSeleccionados = [];
    } else if (statusSeleccionados.includes(status)) {
        statusSeleccionados = statusSeleccionados.filter(s => s !== status);
    } else {
        statusSeleccionados.push(status);
    }

    renderStatusBotones();
}

function renderStatusBotones() {
    const botones = document.querySelectorAll("#statusBotones .status-boton");

    botones.forEach(boton => {
        const esTodos = boton.dataset.status === "__todos__";
        const activo = esTodos
            ? statusSeleccionados.length === 0
            : statusSeleccionados.includes(boton.dataset.status);

        boton.classList.toggle("activo", activo);
    });
}

function construirQueryString() {
    const params = new URLSearchParams();

    const desde = document.getElementById("fechaDesde").value;
    const hasta = document.getElementById("fechaHasta").value;

    if (desde) params.append("date_from", desde);
    if (hasta) params.append("date_to", hasta);

    statusSeleccionados.forEach(s => params.append("status", s));

    params.append("order", ordenActual);
    params.append("date_field", campoFechaActual);

    return params.toString();
}

function alternarCampoFecha() {
    const btn = document.getElementById("btnCampoFecha");
    campoFechaActual = campoFechaActual === "created" ? "booking" : "created";

    btn.dataset.campo = campoFechaActual;
    btn.textContent = campoFechaActual === "created" ? "📅 Creado" : "📅 Agendamiento";
}

async function cargarLista() {
    try {
        const response = await fetch(`${API_BASE}/ticket?${construirQueryString()}`, {
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const tickets = await response.json();
        ticketsActuales = tickets || [];
        renderLista(ticketsActuales);

    } catch (error) {
        console.error("Error cargando tickets:", error);
    }
}

function renderLista(tickets) {
    const contenedor = document.getElementById("listaTickets");
    const vacia = document.getElementById("listaVacia");

    contenedor.innerHTML = "";

    if (!tickets.length) {
        vacia.classList.remove("hidden");
        return;
    }

    vacia.classList.add("hidden");

    tickets.forEach(t => {
        const item = document.createElement("div");
        const grupo = grupoStatus(t.ticket_status);
        const nombreClienta = t.customer_full_name || t.customer_nickname;

        item.className = `tarjeta-ticket status-${grupo}`;

        item.innerHTML = `
            <div class="ticket-info">
                <div class="ticket-id-row">
                    <div class="ticket-id">Ticket #${escapeHtml(t.ticket_id)}</div>
                    <button class="ticket-chip" data-ticket-id="${t.ticket_id}">${escapeHtml(t.ticket_status)}</button>
                </div>
                <button class="ticket-clienta ${nombreClienta ? "clienta-asignada" : "clienta-vacia"}" data-ticket-id="${t.ticket_id}">
                    ${nombreClienta ? escapeHtml(nombreClienta) : "+ Asociar clienta"}
                </button>
                <a class="ticket-profesionales" href="ticket-profesionales.html?ticket_id=${t.ticket_id}">
                    Profesionales (${t.professional_count || 0}) →
                </a>
                <div class="ticket-fechas">
                    Creado: ${formatearFecha(t.ticket_created_at)}<br>
                    Actualizado: ${formatearFecha(t.ticket_updated_at)}
                </div>
                <div class="ticket-booking-row">
                    <button class="ticket-booking" data-ticket-id="${t.ticket_id}">
                        Agendado: ${formatearFecha(t.ticket_booking_date)}
                    </button>
                    <span class="ticket-antiguedad ${nivelAntiguedad(t.ticket_status, t.ticket_status_changed_at)}">
                        ${tiempoTranscurrido(t.ticket_status_changed_at)}
                    </span>
                </div>
            </div>
        `;

        item.querySelector(".ticket-clienta").addEventListener("click", () => {
            abrirSelectorClienta((clienta) => asociarClienta(t.ticket_id, clienta));
        });

        item.querySelector(".ticket-booking").addEventListener("click", () => {
            abrirPopupAgendamiento(t);
        });

        item.querySelector(".ticket-chip").addEventListener("click", () => {
            abrirPopupStatus(t);
        });

        contenedor.appendChild(item);
    });
}

async function asociarClienta(ticketId, clienta) {
    try {
        const response = await fetch(`${API_BASE}/ticket/${ticketId}/customer`, {
            method: "PATCH",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ customer_id: clienta.customer_id })
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo asociar la clienta.");
            throw new Error(mensaje);
        }

        const actualizado = await response.json();

        const ticket = ticketsActuales.find(t => t.ticket_id === ticketId);
        if (ticket) {
            ticket.ticket_customer_id = actualizado.ticket_customer_id;
            ticket.ticket_status = actualizado.ticket_status;
            ticket.ticket_status_changed_at = actualizado.ticket_status_changed_at;
            ticket.ticket_updated_at = actualizado.ticket_updated_at;
            ticket.customer_full_name = clienta.customer_full_name;
            ticket.customer_nickname = clienta.customer_nickname;
            ticket.customer_mobile = clienta.customer_mobile;
        }

        renderLista(ticketsActuales);
        mostrarToast("Clienta asociada correctamente");

    } catch (error) {
        console.error("Error asociando clienta:", error);
        mostrarToast(error.message || "No se pudo asociar la clienta.", true);
    }
}

async function crearTicket() {
    const btn = document.getElementById("btnNuevoTicket");
    const ahora = new Date();
    const bookingDate = `${fechaLocalISO(ahora)}T${horaLocalHHMM(ahora)}:00`;

    try {
        btn.disabled = true;

        const response = await fetch(`${API_BASE}/ticket`, {
            method: "POST",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ booking_date: bookingDate })
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo crear el ticket.");
            throw new Error(mensaje);
        }

        await cargarLista();

    } catch (error) {
        console.error("Error creando ticket:", error);
        mostrarToast(error.message || "No se pudo crear el ticket.", true);
    } finally {
        btn.disabled = false;
    }
}

let ticketIdEnEdicionAgendamiento = null;

function abrirPopupAgendamiento(ticket) {
    ticketIdEnEdicionAgendamiento = ticket.ticket_id;

    const fecha = ticket.ticket_booking_date ? new Date(ticket.ticket_booking_date) : new Date();
    document.getElementById("bookingFecha").value = fechaLocalISO(fecha);
    document.getElementById("bookingHora").value = horaLocalHHMM(fecha);

    document.getElementById("bookingModal").classList.add("activa");
    document.body.style.overflow = "hidden";
}

function cerrarPopupAgendamiento() {
    document.getElementById("bookingModal").classList.remove("activa");
    document.body.style.overflow = "";
    ticketIdEnEdicionAgendamiento = null;
}

async function guardarAgendamiento() {
    if (!ticketIdEnEdicionAgendamiento) return;

    const fecha = document.getElementById("bookingFecha").value;
    const hora = document.getElementById("bookingHora").value;
    if (!fecha || !hora) return;

    const ticketId = ticketIdEnEdicionAgendamiento;
    const bookingDate = `${fecha}T${hora}:00`;

    try {
        const response = await fetch(`${API_BASE}/ticket/${ticketId}/booking-date`, {
            method: "PATCH",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ booking_date: bookingDate })
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo actualizar la fecha de agendamiento.");
            throw new Error(mensaje);
        }

        const actualizado = await response.json();

        const ticket = ticketsActuales.find(t => t.ticket_id === ticketId);
        if (ticket) {
            ticket.ticket_booking_date = actualizado.ticket_booking_date;
            ticket.ticket_updated_at = actualizado.ticket_updated_at;
        }

        renderLista(ticketsActuales);
        mostrarToast("Fecha de agendamiento actualizada");
        cerrarPopupAgendamiento();

    } catch (error) {
        console.error("Error actualizando agendamiento:", error);
        mostrarToast(error.message || "No se pudo actualizar la fecha de agendamiento.", true);
    }
}

let ticketIdEnEdicionStatus = null;

function abrirPopupStatus(ticket) {
    ticketIdEnEdicionStatus = ticket.ticket_id;

    document.getElementById("statusSelector").value = ticket.ticket_status;

    document.getElementById("statusModal").classList.add("activa");
    document.body.style.overflow = "hidden";
}

function cerrarPopupStatus() {
    document.getElementById("statusModal").classList.remove("activa");
    document.body.style.overflow = "";
    ticketIdEnEdicionStatus = null;
}

async function guardarStatus() {
    if (!ticketIdEnEdicionStatus) return;

    const status = document.getElementById("statusSelector").value;
    const ticketId = ticketIdEnEdicionStatus;

    try {
        const response = await fetch(`${API_BASE}/ticket/${ticketId}/status`, {
            method: "PATCH",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo cambiar el status.");
            throw new Error(mensaje);
        }

        const actualizado = await response.json();

        const ticket = ticketsActuales.find(t => t.ticket_id === ticketId);
        if (ticket) {
            ticket.ticket_status = actualizado.ticket_status;
            ticket.ticket_status_changed_at = actualizado.ticket_status_changed_at;
            ticket.ticket_updated_at = actualizado.ticket_updated_at;
        }

        renderLista(ticketsActuales);
        mostrarToast("Status actualizado");
        cerrarPopupStatus();

    } catch (error) {
        console.error("Error cambiando status:", error);
        mostrarToast(error.message || "No se pudo cambiar el status.", true);
    }
}

function alternarOrden() {
    const btn = document.getElementById("btnOrden");
    ordenActual = ordenActual === "desc" ? "asc" : "desc";

    btn.dataset.orden = ordenActual;
    btn.textContent = ordenActual === "desc"
        ? "Más reciente primero ↓"
        : "Más antiguo primero ↑";

    cargarLista();
}

const FILTROS_VISIBLES_KEY = "kivor_ticket_filtros_visible";

function aplicarVisibilidadFiltros(visible) {
    const filtros = document.getElementById("filtros");
    const btn = document.getElementById("btnToggleFiltros");

    filtros.classList.toggle("hidden", !visible);
    btn.textContent = visible ? "▴" : "▾";
    btn.setAttribute("aria-expanded", String(visible));
    btn.setAttribute("aria-label", visible ? "Ocultar filtros" : "Mostrar filtros");
}

function alternarFiltros() {
    const visible = document.getElementById("filtros").classList.contains("hidden");
    localStorage.setItem(FILTROS_VISIBLES_KEY, String(visible));
    aplicarVisibilidadFiltros(visible);
}

document.addEventListener("DOMContentLoaded", () => {
    actualizarFechaCabecera();
    inicializarFiltros();
    aplicarVisibilidadFiltros(localStorage.getItem(FILTROS_VISIBLES_KEY) === "true");
    cargarLista();

    document.getElementById("btnRefrescar").addEventListener("click", cargarLista);
    document.getElementById("btnNuevoTicket").addEventListener("click", crearTicket);
    document.getElementById("btnAplicarFiltros").addEventListener("click", cargarLista);
    document.getElementById("btnCampoFecha").addEventListener("click", alternarCampoFecha);
    document.getElementById("btnOrden").addEventListener("click", alternarOrden);
    document.getElementById("btnToggleFiltros").addEventListener("click", alternarFiltros);

    document.getElementById("bookingClose").addEventListener("click", cerrarPopupAgendamiento);
    document.getElementById("bookingBackdrop").addEventListener("click", cerrarPopupAgendamiento);
    document.getElementById("bookingGuardar").addEventListener("click", guardarAgendamiento);

    document.getElementById("statusClose").addEventListener("click", cerrarPopupStatus);
    document.getElementById("statusBackdrop").addEventListener("click", cerrarPopupStatus);
    document.getElementById("statusAplicar").addEventListener("click", guardarStatus);

    setInterval(cargarLista, REFRESCO_MS);
});
