const NUMERO_WHATSAPP = "56985963737";

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

let campoFechaCtActual = "booking";

function inicializarFiltrosCt() {
    const hoy = fechaLocalISO(new Date());
    document.getElementById("ctFechaDesde").value = hoy;
    document.getElementById("ctFechaHasta").value = hoy;
}

function alternarCampoFechaCt() {
    const btn = document.getElementById("ctBtnCampoFecha");
    campoFechaCtActual = campoFechaCtActual === "created" ? "booking" : "created";

    btn.dataset.campo = campoFechaCtActual;
    btn.textContent = campoFechaCtActual === "created" ? "📅 Creado" : "📅 Agendamiento";
}

function construirQueryStringCt() {
    const params = new URLSearchParams();

    const desde = document.getElementById("ctFechaDesde").value;
    const hasta = document.getElementById("ctFechaHasta").value;

    if (desde) params.append("date_from", desde);
    if (hasta) params.append("date_to", hasta);
    params.append("date_field", campoFechaCtActual);

    return params.toString();
}

async function cargarCierreTickets() {
    try {
        const response = await fetch(`${API_BASE}/ticket?${construirQueryStringCt()}`, {
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
    const vacia = document.getElementById("listaCtVacia");
    const seccionCompletados = document.getElementById("seccionCtCompletados");
    const seccionOtros = document.getElementById("seccionCtOtros");
    const contenedorCompletados = document.getElementById("listaCierreTicketsCompletados");
    const contenedorOtros = document.getElementById("listaCierreTicketsOtros");

    contenedorCompletados.innerHTML = "";
    contenedorOtros.innerHTML = "";

    if (!tickets.length) {
        vacia.classList.remove("hidden");
        seccionCompletados.classList.add("hidden");
        seccionOtros.classList.add("hidden");
        return;
    }

    vacia.classList.add("hidden");

    const completados = tickets.filter(t => t.ticket_status === "Completed");
    const otros = tickets.filter(t => t.ticket_status !== "Completed");

    seccionCompletados.classList.toggle("hidden", completados.length === 0);
    seccionOtros.classList.toggle("hidden", otros.length === 0);

    completados.forEach(t => contenedorCompletados.appendChild(crearTarjetaCt(t, true)));
    otros.forEach(t => contenedorOtros.appendChild(crearTarjetaCt(t, false)));
}

function crearTarjetaCt(t, esCompletado) {
    const nombre = t.customer_full_name || t.customer_nickname || "(sin clienta titular)";
    const yaEnviado = Boolean(t.whatsapp_sent);

    const tarjeta = document.createElement("div");
    tarjeta.className = esCompletado ? "tarjeta-ct status-info" : "tarjeta-ct";

    tarjeta.innerHTML = `
        <div class="tarjeta-ct-info">
            <span class="tarjeta-ct-clienta">${escapeHtml(nombre)}</span>
            <div class="tarjeta-ct-meta-row">
                <span class="tarjeta-ct-meta">Ticket #${t.ticket_id} · ${formatearFecha(t.ticket_booking_date)}</span>
                <span class="ticket-chip">${escapeHtml(t.ticket_status)}</span>
            </div>
        </div>
        <div class="tarjeta-ct-acciones">
            <button class="btn-generar-pdf" data-ticket-id="${t.ticket_id}">Generar PDF</button>
            <button class="btn-enviar-whatsapp ${yaEnviado ? "enviado" : ""}" data-ticket-id="${t.ticket_id}">Enviar por WhatsApp</button>
        </div>
    `;

    tarjeta.querySelector(".btn-generar-pdf").addEventListener("click", (event) => {
        generarPdf(t.ticket_id, event.currentTarget);
    });

    tarjeta.querySelector(".btn-enviar-whatsapp").addEventListener("click", (event) => {
        enviarPorWhatsapp(t.ticket_id, nombre, event.currentTarget);
    });

    return tarjeta;
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

async function enviarPorWhatsapp(ticketId, nombreClienta, boton) {
    boton.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/ticket/${ticketId}/voucher-imagen`, {
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo generar la imagen.");
            throw new Error(mensaje);
        }

        const blob = await response.blob();

        if (!navigator.clipboard || !window.ClipboardItem) {
            throw new Error("Este navegador no permite copiar imágenes al portapapeles.");
        }

        await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
        ]);

        const texto = encodeURIComponent(`Hola, te comparto el comprobante de atención de ${nombreClienta}, Ticket #${ticketId}.`);
        window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${texto}`, "_blank");

        boton.classList.add("enviado");
        registrarEnvioWhatsapp(ticketId);

        mostrarToast("Imagen copiada. Pega con Ctrl+V en la conversación de WhatsApp");

    } catch (error) {
        console.error("Error enviando por WhatsApp:", error);
        mostrarToast(error.message || "No se pudo preparar el envío por WhatsApp.", true);
    } finally {
        boton.disabled = false;
    }
}

async function registrarEnvioWhatsapp(ticketId) {
    try {
        const response = await fetch(`${API_BASE}/ticket/${ticketId}/whatsapp-sent`, {
            method: "POST",
            headers: authHeaders()
        });

        if (!response.ok) {
            console.error("No se pudo registrar el envio de WhatsApp para el ticket", ticketId);
        }
    } catch (error) {
        console.error("Error registrando envio de WhatsApp:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarFiltrosCt();
    cargarCierreTickets();

    document.getElementById("btnRefrescarCt").addEventListener("click", cargarCierreTickets);
    document.getElementById("ctBtnAplicarFiltros").addEventListener("click", cargarCierreTickets);
    document.getElementById("ctBtnCampoFecha").addEventListener("click", alternarCampoFechaCt);
});
