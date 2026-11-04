const params = new URLSearchParams(window.location.search);
const TICKET_ID = params.get("ticket_id");

let ticketActual = null;
let profesionalesActuales = [];
let toastTimeout = null;

function authHeaders() {
    const t = sessionStorage.getItem("access_token");
    return { "Authorization": `Bearer ${t}` };
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

function formatearFecha(valor) {
    if (!valor) return "-";
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return "-";
    return fecha.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short", hour12: false });
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

async function cargarTicket() {
    try {
        const response = await fetch(`${API_BASE}/ticket/${TICKET_ID}`, {
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo cargar el ticket.");
            throw new Error(mensaje);
        }

        ticketActual = await response.json();
        renderCabecera(ticketActual);

    } catch (error) {
        console.error("Error cargando ticket:", error);
        mostrarToast(error.message || "No se pudo cargar el ticket.", true);
    }
}

function renderCabecera(t) {
    const nombreClienta = t.customer_full_name || t.customer_nickname || "Sin clienta titular asignada";

    document.getElementById("cabeceraTicket").innerHTML = `
        <strong>Ticket #${escapeHtml(t.ticket_id)}</strong> · <strong>${escapeHtml(t.ticket_status)}</strong><br>
        Titular: <strong>${escapeHtml(nombreClienta)}</strong>
    `;
}

async function cargarProfesionales() {
    try {
        const response = await fetch(`${API_BASE}/ticket/${TICKET_ID}/professionals`, {
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudieron cargar las profesionales.");
            throw new Error(mensaje);
        }

        profesionalesActuales = await response.json();
        renderProfesionales(profesionalesActuales);

    } catch (error) {
        console.error("Error cargando profesionales:", error);
        mostrarToast(error.message || "No se pudieron cargar las profesionales.", true);
    }
}

function renderProfesionales(lista) {
    const contenedor = document.getElementById("listaProfesionales");
    const vacio = document.getElementById("sinProfesionales");

    contenedor.innerHTML = "";

    if (!lista.length) {
        vacio.classList.remove("hidden");
        return;
    }

    vacio.classList.add("hidden");

    lista.forEach(p => {
        const bloque = document.createElement("div");
        bloque.className = "bloque-profesional";

        const chips = p.customers.map(c => `
            <div class="clienta-item">
                <span class="chip-clienta">
                    ${escapeHtml(c.customer_full_name || c.customer_nickname)}
                    <button data-quitar-clienta="${c.ticket_professional_customer_id}" data-tp-id="${p.ticket_professional_id}" aria-label="Quitar clienta">×</button>
                </span>
                <button class="ticket-booking" data-tpc-booking="${c.ticket_professional_customer_id}" data-tp-id="${p.ticket_professional_id}">
                    ${formatearFecha(c.ticket_professional_customer_booking_date)}
                </button>
            </div>
        `).join("");

        bloque.innerHTML = `
            <div class="bloque-profesional-header">
                <span class="bloque-profesional-nombre">${escapeHtml(p.professional_name || p.professional_nickname)}</span>
                <button class="btn-quitar-profesional" data-quitar-profesional="${p.ticket_professional_id}" aria-label="Quitar profesional">×</button>
            </div>
            <div class="clientas-profesional">
                ${chips}
                <span class="acciones-clienta-profesional">
                    <button class="btn-usar-titular" data-usar-titular="${p.ticket_professional_id}">Usar titular</button>
                    <button class="btn-agregar-clienta" data-agregar-clienta="${p.ticket_professional_id}">+ Agregar clienta</button>
                </span>
            </div>
        `;

        contenedor.appendChild(bloque);
    });

    contenedor.querySelectorAll("[data-quitar-profesional]").forEach(btn => {
        btn.addEventListener("click", () => quitarProfesional(Number(btn.dataset.quitarProfesional)));
    });

    contenedor.querySelectorAll("[data-usar-titular]").forEach(btn => {
        btn.addEventListener("click", () => usarTitular(Number(btn.dataset.usarTitular)));
    });

    contenedor.querySelectorAll("[data-agregar-clienta]").forEach(btn => {
        const ticketProfessionalId = Number(btn.dataset.agregarClienta);
        btn.addEventListener("click", () => {
            abrirSelectorClienta((clienta) => agregarClienta(ticketProfessionalId, clienta));
        });
    });

    contenedor.querySelectorAll("[data-quitar-clienta]").forEach(btn => {
        const ticketProfessionalCustomerId = Number(btn.dataset.quitarClienta);
        const ticketProfessionalId = Number(btn.dataset.tpId);
        btn.addEventListener("click", () => quitarClienta(ticketProfessionalId, ticketProfessionalCustomerId));
    });

    contenedor.querySelectorAll("[data-tpc-booking]").forEach(btn => {
        const ticketProfessionalCustomerId = Number(btn.dataset.tpcBooking);
        const ticketProfessionalId = Number(btn.dataset.tpId);
        btn.addEventListener("click", () => {
            abrirPopupAgendamientoClienta(ticketProfessionalId, ticketProfessionalCustomerId);
        });
    });
}

async function agregarProfesional(profesional) {
    try {
        const response = await fetch(`${API_BASE}/ticket/${TICKET_ID}/professionals`, {
            method: "POST",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ professional_id: profesional.professional_id })
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo agregar la profesional.");
            throw new Error(mensaje);
        }

        await cargarProfesionales();
        mostrarToast(`${profesional.professional_name || profesional.professional_nickname} agregada`);

    } catch (error) {
        console.error("Error agregando profesional:", error);
        mostrarToast(error.message || "No se pudo agregar la profesional.", true);
    }
}

async function quitarProfesional(ticketProfessionalId) {
    if (!confirm("¿Quitar esta profesional del ticket? También se quitan sus clientas asignadas.")) return;

    try {
        const response = await fetch(`${API_BASE}/ticket/${TICKET_ID}/professionals/${ticketProfessionalId}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo quitar la profesional.");
            throw new Error(mensaje);
        }

        await cargarProfesionales();
        mostrarToast("Profesional quitada");

    } catch (error) {
        console.error("Error quitando profesional:", error);
        mostrarToast(error.message || "No se pudo quitar la profesional.", true);
    }
}

async function agregarClienta(ticketProfessionalId, clienta) {
    try {
        const ahora = new Date();
        const bookingDate = `${fechaLocalISO(ahora)}T${horaLocalHHMM(ahora)}:00`;

        const response = await fetch(`${API_BASE}/ticket/${TICKET_ID}/professionals/${ticketProfessionalId}/customers`, {
            method: "POST",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ customer_id: clienta.customer_id, booking_date: bookingDate })
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo agregar la clienta.");
            throw new Error(mensaje);
        }

        await cargarProfesionales();
        mostrarToast("Clienta agregada");

    } catch (error) {
        console.error("Error agregando clienta:", error);
        mostrarToast(error.message || "No se pudo agregar la clienta.", true);
    }
}

async function usarTitular(ticketProfessionalId) {
    if (!ticketActual || !ticketActual.ticket_customer_id) {
        mostrarToast("El ticket no tiene clienta titular asignada.", true);
        return;
    }

    await agregarClienta(ticketProfessionalId, { customer_id: ticketActual.ticket_customer_id });
}

async function quitarClienta(ticketProfessionalId, ticketProfessionalCustomerId) {
    try {
        const response = await fetch(
            `${API_BASE}/ticket/${TICKET_ID}/professionals/${ticketProfessionalId}/customers/${ticketProfessionalCustomerId}`,
            { method: "DELETE", headers: authHeaders() }
        );

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo quitar la clienta.");
            throw new Error(mensaje);
        }

        await cargarProfesionales();
        mostrarToast("Clienta quitada");

    } catch (error) {
        console.error("Error quitando clienta:", error);
        mostrarToast(error.message || "No se pudo quitar la clienta.", true);
    }
}

let tpcContextoEnEdicion = null;

function abrirPopupAgendamientoClienta(ticketProfessionalId, ticketProfessionalCustomerId) {
    tpcContextoEnEdicion = { ticketProfessionalId, ticketProfessionalCustomerId };

    const profesional = profesionalesActuales.find(p => p.ticket_professional_id === ticketProfessionalId);
    const clienta = profesional
        ? profesional.customers.find(c => c.ticket_professional_customer_id === ticketProfessionalCustomerId)
        : null;

    const fecha = clienta && clienta.ticket_professional_customer_booking_date
        ? new Date(clienta.ticket_professional_customer_booking_date)
        : new Date();

    document.getElementById("tpcBookingFecha").value = fechaLocalISO(fecha);
    document.getElementById("tpcBookingHora").value = horaLocalHHMM(fecha);

    document.getElementById("tpcBookingModal").classList.add("activa");
    document.body.style.overflow = "hidden";
}

function cerrarPopupAgendamientoClienta() {
    document.getElementById("tpcBookingModal").classList.remove("activa");
    document.body.style.overflow = "";
    tpcContextoEnEdicion = null;
}

async function guardarAgendamientoClienta() {
    if (!tpcContextoEnEdicion) return;

    const fecha = document.getElementById("tpcBookingFecha").value;
    const hora = document.getElementById("tpcBookingHora").value;
    if (!fecha || !hora) return;

    const { ticketProfessionalId, ticketProfessionalCustomerId } = tpcContextoEnEdicion;
    const bookingDate = `${fecha}T${hora}:00`;

    try {
        const response = await fetch(
            `${API_BASE}/ticket/${TICKET_ID}/professionals/${ticketProfessionalId}/customers/${ticketProfessionalCustomerId}/booking-date`,
            {
                method: "PATCH",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ booking_date: bookingDate })
            }
        );

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo actualizar la fecha de agendamiento.");
            throw new Error(mensaje);
        }

        const actualizado = await response.json();

        const profesional = profesionalesActuales.find(p => p.ticket_professional_id === ticketProfessionalId);
        const clienta = profesional
            ? profesional.customers.find(c => c.ticket_professional_customer_id === ticketProfessionalCustomerId)
            : null;
        if (clienta) {
            clienta.ticket_professional_customer_booking_date = actualizado.ticket_professional_customer_booking_date;
        }

        renderProfesionales(profesionalesActuales);
        mostrarToast("Fecha de agendamiento actualizada");
        cerrarPopupAgendamientoClienta();

    } catch (error) {
        console.error("Error actualizando agendamiento:", error);
        mostrarToast(error.message || "No se pudo actualizar la fecha de agendamiento.", true);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!TICKET_ID) {
        mostrarToast("No se indicó el ticket. Volviendo a la lista...", true);
        setTimeout(() => { window.location.href = "ticket.html"; }, 1500);
        return;
    }

    cargarTicket();
    cargarProfesionales();

    document.getElementById("btnRefrescarTp").addEventListener("click", () => {
        cargarTicket();
        cargarProfesionales();
    });

    document.getElementById("btnAgregarProfesional").addEventListener("click", () => {
        abrirSelectorProfesionales((profesional) => agregarProfesional(profesional));
    });

    document.getElementById("tpcBookingClose").addEventListener("click", cerrarPopupAgendamientoClienta);
    document.getElementById("tpcBookingBackdrop").addEventListener("click", cerrarPopupAgendamientoClienta);
    document.getElementById("tpcBookingGuardar").addEventListener("click", guardarAgendamientoClienta);
});
