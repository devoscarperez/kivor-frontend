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
    return fecha.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
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

function inicializarAgendamiento() {
    const ahora = new Date();
    document.getElementById("fechaAgendamiento").value = fechaLocalISO(ahora);
    document.getElementById("horaAgendamiento").value = horaLocalHHMM(ahora);
}

function inicializarFiltros() {
    const hoy = fechaLocalISO(new Date());
    document.getElementById("fechaDesde").value = hoy;
    document.getElementById("fechaHasta").value = hoy;

    const selectStatus = document.getElementById("filtroStatus");
    TODOS_LOS_STATUS.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        selectStatus.appendChild(option);
    });
}

function construirQueryString() {
    const params = new URLSearchParams();

    const desde = document.getElementById("fechaDesde").value;
    const hasta = document.getElementById("fechaHasta").value;

    if (desde) params.append("date_from", desde);
    if (hasta) params.append("date_to", hasta);

    const statusSeleccionados = Array.from(document.getElementById("filtroStatus").selectedOptions)
        .map(o => o.value);
    statusSeleccionados.forEach(s => params.append("status", s));

    params.append("order", ordenActual);

    return params.toString();
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
                <div class="ticket-id">Ticket #${escapeHtml(t.ticket_id)}</div>
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
                <div class="ticket-booking">
                    Fecha agendamiento: ${formatearFecha(t.ticket_booking_date)}
                </div>
            </div>
            <div class="ticket-right">
                <span class="ticket-chip">${escapeHtml(t.ticket_status)}</span>
                <span class="ticket-antiguedad ${nivelAntiguedad(t.ticket_status, t.ticket_status_changed_at)}">
                    ${tiempoTranscurrido(t.ticket_status_changed_at)}
                </span>
            </div>
        `;

        item.querySelector(".ticket-clienta").addEventListener("click", () => {
            abrirSelectorClienta((clienta) => asociarClienta(t.ticket_id, clienta));
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
    const fecha = document.getElementById("fechaAgendamiento").value;
    const hora = document.getElementById("horaAgendamiento").value;

    if (!fecha || !hora) {
        mostrarToast("Debe indicar fecha y hora de agendamiento.", true);
        return;
    }

    const bookingDate = `${fecha}T${hora}:00`;

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
        inicializarAgendamiento();

    } catch (error) {
        console.error("Error creando ticket:", error);
        mostrarToast(error.message || "No se pudo crear el ticket.", true);
    } finally {
        btn.disabled = false;
    }
}

function limpiarFiltroStatus() {
    const selectStatus = document.getElementById("filtroStatus");
    Array.from(selectStatus.options).forEach(o => { o.selected = false; });
    cargarLista();
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

document.addEventListener("DOMContentLoaded", () => {
    actualizarFechaCabecera();
    inicializarFiltros();
    inicializarAgendamiento();
    cargarLista();

    document.getElementById("btnRefrescar").addEventListener("click", cargarLista);
    document.getElementById("btnNuevoTicket").addEventListener("click", crearTicket);
    document.getElementById("btnAplicarFiltros").addEventListener("click", cargarLista);
    document.getElementById("btnLimpiarStatus").addEventListener("click", limpiarFiltroStatus);
    document.getElementById("btnOrden").addEventListener("click", alternarOrden);

    setInterval(cargarLista, REFRESCO_MS);
});
