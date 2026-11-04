let clientaSeleccionada = null;
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

function renderChipClienta() {
    const contenedor = document.getElementById("clientaContenedor");

    if (!clientaSeleccionada) {
        contenedor.innerHTML = `
            <button id="btnClientaAgenda" class="ticket-clienta clienta-vacia">+ Seleccionar clienta</button>
        `;
        document.getElementById("btnClientaAgenda").addEventListener("click", () => {
            abrirSelectorClienta((clienta) => seleccionarClienta(clienta));
        });
        return;
    }

    const nombre = clientaSeleccionada.customer_full_name || clientaSeleccionada.customer_nickname || "(sin nombre)";

    contenedor.innerHTML = `
        <span class="chip-clienta">
            ${escapeHtml(nombre)}
            <button id="btnQuitarClientaAgenda" aria-label="Quitar clienta">×</button>
        </span>
    `;
    document.getElementById("btnQuitarClientaAgenda").addEventListener("click", () => {
        clientaSeleccionada = null;
        renderChipClienta();
        cargarAgenda();
    });
}

function seleccionarClienta(clienta) {
    clientaSeleccionada = clienta;
    renderChipClienta();
    cargarAgenda();
}

async function cargarAgenda() {
    const vacia = document.getElementById("agendaVacia");
    const tabla = document.getElementById("tablaAgenda");
    const filas = document.getElementById("filasAgenda");

    if (!clientaSeleccionada) {
        tabla.classList.add("hidden");
        vacia.classList.remove("hidden");
        vacia.textContent = "Selecciona una clienta y una fecha para ver sus atenciones.";
        return;
    }

    const fecha = document.getElementById("fechaAgenda").value;
    if (!fecha) return;

    try {
        const response = await fetch(
            `${API_BASE}/customer/${clientaSeleccionada.customer_id}/agenda?date=${fecha}`,
            { headers: authHeaders() }
        );

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo cargar la agenda.");
            throw new Error(mensaje);
        }

        const atenciones = await response.json();
        renderAgenda(atenciones || []);

    } catch (error) {
        console.error("Error cargando agenda:", error);
        mostrarToast(error.message || "No se pudo cargar la agenda.", true);
    }
}

function renderAgenda(atenciones) {
    const vacia = document.getElementById("agendaVacia");
    const tabla = document.getElementById("tablaAgenda");
    const filas = document.getElementById("filasAgenda");

    if (!atenciones.length) {
        tabla.classList.add("hidden");
        vacia.classList.remove("hidden");
        vacia.textContent = "No hay atenciones programadas para esta clienta en esta fecha.";
        return;
    }

    vacia.classList.add("hidden");
    tabla.classList.remove("hidden");

    filas.innerHTML = atenciones.map((a, indice) => {
        const hora = horaLocalHHMM(new Date(a.booking_date));
        const nombre = a.professional_name || a.professional_nickname || "-";

        return `
            <tr>
                <td>${indice + 1}</td>
                <td>${escapeHtml(nombre)}</td>
                <td>${hora}</td>
                <td><a href="ticket-profesionales.html?ticket_id=${a.ticket_id}">#${a.ticket_id}</a></td>
            </tr>
        `;
    }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("fechaAgenda").value = fechaLocalISO(new Date());

    renderChipClienta();
    cargarAgenda();

    document.getElementById("btnRefrescarAgenda").addEventListener("click", cargarAgenda);
    document.getElementById("fechaAgenda").addEventListener("change", cargarAgenda);
});
