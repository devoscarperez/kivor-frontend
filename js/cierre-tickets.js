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

async function cargarCierreTickets() {
    try {
        const response = await fetch(`${API_BASE}/ticket`, {
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudieron cargar los tickets.");
            throw new Error(mensaje);
        }

        const tickets = await response.json();
        renderCierreTickets(tickets || []);

    } catch (error) {
        console.error("Error cargando tickets:", error);
        mostrarToast(error.message || "No se pudieron cargar los tickets.", true);
    }
}

function renderCierreTickets(tickets) {
    const contenedor = document.getElementById("listaCierreTickets");
    const vacia = document.getElementById("listaCtVacia");

    contenedor.innerHTML = "";

    if (!tickets.length) {
        vacia.classList.remove("hidden");
        return;
    }

    vacia.classList.add("hidden");

    tickets.forEach(t => {
        const nombre = t.customer_full_name || t.customer_nickname || "(sin clienta titular)";

        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-ct";

        tarjeta.innerHTML = `
            <div class="tarjeta-ct-info">
                <span class="tarjeta-ct-clienta">${escapeHtml(nombre)}</span>
                <span class="tarjeta-ct-meta">Ticket #${t.ticket_id} · ${formatearFecha(t.ticket_booking_date)}</span>
            </div>
            <button class="btn-generar-pdf" data-ticket-id="${t.ticket_id}">Generar PDF</button>
        `;

        tarjeta.querySelector(".btn-generar-pdf").addEventListener("click", (event) => {
            generarPdf(t.ticket_id, event.currentTarget);
        });

        contenedor.appendChild(tarjeta);
    });
}

async function generarPdf(ticketId, boton) {
    boton.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/ticket/${ticketId}/voucher`, {
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo generar el PDF.");
            throw new Error(mensaje);
        }

        const disposition = response.headers.get("content-disposition") || "";
        const match = disposition.match(/filename="?([^"]+)"?/);
        const nombreArchivo = match ? match[1] : `ticket_${ticketId}.pdf`;

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = nombreArchivo;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);

        mostrarToast("PDF generado");

    } catch (error) {
        console.error("Error generando PDF:", error);
        mostrarToast(error.message || "No se pudo generar el PDF.", true);
    } finally {
        boton.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarCierreTickets();
    document.getElementById("btnRefrescarCt").addEventListener("click", cargarCierreTickets);
});
