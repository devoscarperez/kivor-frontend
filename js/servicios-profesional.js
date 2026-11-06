let agendaSpActual = [];
let serviciosDisponibles = [];
let contextoServicioEnEdicion = null;
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

function horaLocalHHMM(fecha) {
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    return `${horas}:${minutos}`;
}

function fechaLocalISO(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function formatearPrecio(valor) {
    const numero = Math.round(Number(valor) || 0);
    return `$${numero.toLocaleString("es-CL")}`;
}

async function cargarAgendaHoy() {
    try {
        const hoy = fechaLocalISO(new Date());
        const response = await fetch(`${API_BASE}/professional/me/agenda-hoy?date=${hoy}`, {
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo cargar tu agenda de hoy.");
            throw new Error(mensaje);
        }

        agendaSpActual = await response.json();
        renderAgendaHoy(agendaSpActual);

    } catch (error) {
        console.error("Error cargando agenda:", error);
        mostrarToast(error.message || "No se pudo cargar tu agenda de hoy.", true);
    }
}

function renderAgendaHoy(items) {
    const contenedor = document.getElementById("listaAgendaSp");
    const vacia = document.getElementById("agendaSpVacia");

    contenedor.innerHTML = "";

    if (!items.length) {
        vacia.classList.remove("hidden");
        return;
    }

    vacia.classList.add("hidden");

    items.forEach(item => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-agenda-sp";

        const nombre = item.customer_full_name || item.customer_nickname || "(sin nombre)";
        const hora = item.booking_date ? horaLocalHHMM(new Date(item.booking_date)) : "-";

        const lineasServicios = item.products.length
            ? item.products.map(p => `
                <div class="servicio-sp-linea">
                    <span>${escapeHtml(p.product_name)}</span>
                    <span class="servicio-sp-precio">${formatearPrecio(p.unit_price)}</span>
                </div>
            `).join("")
            : `<div class="servicio-sp-sin-servicios">Sin servicios asignados aún.</div>`;

        tarjeta.innerHTML = `
            <div class="agenda-sp-header">
                <span class="agenda-sp-clienta">${escapeHtml(nombre)}</span>
                <span class="agenda-sp-meta">
                    ${hora} ·
                    <a href="ticket-profesionales.html?ticket_id=${item.ticket_id}">Ticket #${item.ticket_id}</a>
                </span>
            </div>
            <div class="lista-servicios-sp">${lineasServicios}</div>
            <button class="btn-asignar-servicios" data-tpc-id="${item.ticket_professional_customer_id}" data-tp-id="${item.ticket_professional_id}" data-ticket-id="${item.ticket_id}">
                Asignar Servicios
            </button>
        `;

        tarjeta.querySelector(".btn-asignar-servicios").addEventListener("click", () => {
            abrirPopupServicio(item);
        });

        contenedor.appendChild(tarjeta);
    });
}

function limpiarSelect(select, placeholder) {
    select.innerHTML = `<option value="">${placeholder}</option>`;
}

function llenarSelect(select, valores) {
    valores.forEach(valor => {
        const opcion = document.createElement("option");
        opcion.value = valor;
        opcion.textContent = valor;
        select.appendChild(opcion);
    });
}

async function abrirPopupServicio(item) {
    contextoServicioEnEdicion = {
        ticketId: item.ticket_id,
        ticketProfessionalId: item.ticket_professional_id,
        ticketProfessionalCustomerId: item.ticket_professional_customer_id,
    };

    const selectFamilia = document.getElementById("servicioFamilia");
    const selectNivel2 = document.getElementById("servicioNivel2");
    const selectNivel3 = document.getElementById("servicioNivel3");
    const selectNivel4 = document.getElementById("servicioNivel4");

    limpiarSelect(selectFamilia, "Selecciona...");
    limpiarSelect(selectNivel2, "Selecciona...");
    limpiarSelect(selectNivel3, "Selecciona...");
    limpiarSelect(selectNivel4, "Selecciona...");
    selectNivel2.disabled = true;
    selectNivel3.disabled = true;
    selectNivel4.disabled = true;
    serviciosDisponibles = [];
    document.getElementById("servicioAgregar").disabled = true;

    document.getElementById("servicioModal").classList.add("activa");
    document.body.style.overflow = "hidden";

    try {
        const opciones = await obtenerOpcionesServicio();
        llenarSelect(selectFamilia, opciones.familias);
    } catch (error) {
        console.error("Error cargando familias:", error);
        mostrarToast(error.message || "No se pudieron cargar los servicios.", true);
    }
}

function cerrarPopupServicio() {
    document.getElementById("servicioModal").classList.remove("activa");
    document.body.style.overflow = "";
    contextoServicioEnEdicion = null;

    const sheet = document.querySelector("#servicioModal .cs-sheet");
    sheet.style.left = "";
    sheet.style.top = "";
    sheet.style.right = "";
    sheet.style.bottom = "";
    sheet.style.transform = "";
    sheet.style.transition = "";
}

let servicioDragState = null;

function iniciarArrastreServicio(event) {
    if (event.target.closest("#servicioClose")) return;

    const sheet = document.querySelector("#servicioModal .cs-sheet");
    const rect = sheet.getBoundingClientRect();

    sheet.style.transition = "none";
    sheet.style.transform = "none";
    sheet.style.right = "auto";
    sheet.style.bottom = "auto";
    sheet.style.left = `${rect.left}px`;
    sheet.style.top = `${rect.top}px`;

    servicioDragState = {
        sheet,
        startX: event.clientX,
        startY: event.clientY,
        baseLeft: rect.left,
        baseTop: rect.top
    };

    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", moverServicio);
    document.addEventListener("pointerup", soltarServicio);
}

function moverServicio(event) {
    if (!servicioDragState) return;
    const dx = event.clientX - servicioDragState.startX;
    const dy = event.clientY - servicioDragState.startY;
    servicioDragState.sheet.style.left = `${servicioDragState.baseLeft + dx}px`;
    servicioDragState.sheet.style.top = `${servicioDragState.baseTop + dy}px`;
}

function soltarServicio() {
    if (servicioDragState) servicioDragState.sheet.style.transition = "";
    servicioDragState = null;
    document.body.style.userSelect = "";
    document.removeEventListener("pointermove", moverServicio);
    document.removeEventListener("pointerup", soltarServicio);
}

async function obtenerOpcionesServicio() {
    const familia = document.getElementById("servicioFamilia").value;
    const nivel2 = document.getElementById("servicioNivel2").value;
    const nivel3 = document.getElementById("servicioNivel3").value;

    const params = new URLSearchParams();
    if (familia) params.append("familia", familia);
    if (nivel2) params.append("nivel_2", nivel2);
    if (nivel3) params.append("nivel_3", nivel3);

    const response = await fetch(`${API_BASE}/precios-servicios/opciones?${params.toString()}`, {
        headers: authHeaders()
    });

    if (response.status === 401) {
        window.location.href = "login.html";
        throw new Error("Sesión expirada");
    }

    if (!response.ok) {
        const mensaje = await extraerMensajeError(response, "No se pudieron cargar los servicios.");
        throw new Error(mensaje);
    }

    return response.json();
}

async function onCambioFamilia() {
    const selectNivel2 = document.getElementById("servicioNivel2");
    const selectNivel3 = document.getElementById("servicioNivel3");
    const selectNivel4 = document.getElementById("servicioNivel4");

    limpiarSelect(selectNivel2, "Selecciona...");
    limpiarSelect(selectNivel3, "Selecciona...");
    limpiarSelect(selectNivel4, "Selecciona...");
    selectNivel3.disabled = true;
    selectNivel4.disabled = true;
    serviciosDisponibles = [];
    document.getElementById("servicioAgregar").disabled = true;

    const familia = document.getElementById("servicioFamilia").value;
    if (!familia) {
        selectNivel2.disabled = true;
        return;
    }

    try {
        const opciones = await obtenerOpcionesServicio();
        llenarSelect(selectNivel2, opciones.niveles_2);
        selectNivel2.disabled = false;
    } catch (error) {
        console.error("Error cargando nivel 2:", error);
        mostrarToast(error.message || "No se pudieron cargar los servicios.", true);
    }
}

async function onCambioNivel2() {
    const selectNivel3 = document.getElementById("servicioNivel3");
    const selectNivel4 = document.getElementById("servicioNivel4");

    limpiarSelect(selectNivel3, "Selecciona...");
    limpiarSelect(selectNivel4, "Selecciona...");
    selectNivel4.disabled = true;
    serviciosDisponibles = [];
    document.getElementById("servicioAgregar").disabled = true;

    const nivel2 = document.getElementById("servicioNivel2").value;
    if (!nivel2) {
        selectNivel3.disabled = true;
        return;
    }

    try {
        const opciones = await obtenerOpcionesServicio();
        llenarSelect(selectNivel3, opciones.niveles_3);
        selectNivel3.disabled = false;
    } catch (error) {
        console.error("Error cargando nivel 3:", error);
        mostrarToast(error.message || "No se pudieron cargar los servicios.", true);
    }
}

async function onCambioNivel3() {
    const selectNivel4 = document.getElementById("servicioNivel4");

    limpiarSelect(selectNivel4, "Selecciona...");
    serviciosDisponibles = [];
    document.getElementById("servicioAgregar").disabled = true;

    const nivel3 = document.getElementById("servicioNivel3").value;
    if (!nivel3) {
        selectNivel4.disabled = true;
        return;
    }

    try {
        const opciones = await obtenerOpcionesServicio();
        serviciosDisponibles = opciones.servicios;

        serviciosDisponibles.forEach(servicio => {
            const opcion = document.createElement("option");
            opcion.value = servicio.service_master_id;
            opcion.textContent = servicio.nivel_4 || "(sin nivel 4 - usar este servicio)";
            selectNivel4.appendChild(opcion);
        });

        selectNivel4.disabled = false;
    } catch (error) {
        console.error("Error cargando nivel 4:", error);
        mostrarToast(error.message || "No se pudieron cargar los servicios.", true);
    }
}

function onCambioNivel4() {
    const seleccionado = document.getElementById("servicioNivel4").value;
    document.getElementById("servicioAgregar").disabled = !seleccionado;
}

async function agregarServicio() {
    if (!contextoServicioEnEdicion) return;

    const serviceMasterId = Number(document.getElementById("servicioNivel4").value);
    const servicio = serviciosDisponibles.find(s => s.service_master_id === serviceMasterId);
    if (!servicio) return;

    const { ticketId, ticketProfessionalId, ticketProfessionalCustomerId } = contextoServicioEnEdicion;

    try {
        const response = await fetch(
            `${API_BASE}/ticket/${ticketId}/professionals/${ticketProfessionalId}/customers/${ticketProfessionalCustomerId}/products`,
            {
                method: "POST",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({
                    product_id: servicio.service_master_id,
                    product_name: servicio.clave,
                    unit_price: servicio.precio_lista,
                    professional_unit_price: servicio.precio_profesional,
                    quantity: 1,
                })
            }
        );

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const mensaje = await extraerMensajeError(response, "No se pudo agregar el servicio.");
            throw new Error(mensaje);
        }

        await cargarAgendaHoy();
        mostrarToast("Servicio agregado");

        const selectNivel4 = document.getElementById("servicioNivel4");
        selectNivel4.value = "";
        document.getElementById("servicioAgregar").disabled = true;

    } catch (error) {
        console.error("Error agregando servicio:", error);
        mostrarToast(error.message || "No se pudo agregar el servicio.", true);
    }
}

async function cargarSaludoProfesional() {
    try {
        const response = await fetch(`${API_BASE}/me`, { headers: authHeaders() });
        if (!response.ok) return;

        const data = await response.json();
        const titulo = document.getElementById("tituloSp");
        if (!titulo) return;

        titulo.textContent = data.professional_name
            ? `¡Hola, ${data.professional_name}! Hoy tienes estos servicios`
            : "¡Hola! Hoy tienes estos servicios";

    } catch (error) {
        console.error("Error cargando saludo:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarAgendaHoy();
    cargarSaludoProfesional();

    document.getElementById("btnRefrescarSp").addEventListener("click", cargarAgendaHoy);

    document.getElementById("servicioClose").addEventListener("click", cerrarPopupServicio);
    document.getElementById("servicioBackdrop").addEventListener("click", cerrarPopupServicio);
    document.getElementById("servicioAgregar").addEventListener("click", agregarServicio);
    document.querySelector("#servicioModal .cs-sheet-header").addEventListener("pointerdown", iniciarArrastreServicio);

    document.getElementById("servicioFamilia").addEventListener("change", onCambioFamilia);
    document.getElementById("servicioNivel2").addEventListener("change", onCambioNivel2);
    document.getElementById("servicioNivel3").addEventListener("change", onCambioNivel3);
    document.getElementById("servicioNivel4").addEventListener("change", onCambioNivel4);
});
