const REFRESCO_MS = 20000;

let conversacionActiva = null;

function authHeaders() {
    const t = sessionStorage.getItem("access_token");
    return { "Authorization": `Bearer ${t}` };
}

function estadoVentana(windowExpiresAt) {
    if (!windowExpiresAt) return "vencida";

    const expira = new Date(windowExpiresAt).getTime();
    const ahora = Date.now();
    const horasRestantes = (expira - ahora) / (1000 * 60 * 60);

    if (horasRestantes <= 0) return "vencida";
    if (horasRestantes <= 2) return "por-vencer";
    return "abierta";
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

async function cargarLista() {
    try {
        const response = await fetch(`${API_BASE}/whatsapp-inbox`, {
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const conversaciones = await response.json();
        renderLista(conversaciones || []);

    } catch (error) {
        console.error("Error cargando bandeja:", error);
    }
}

function renderLista(conversaciones) {
    const contenedor = document.getElementById("listaConversaciones");
    const vacia = document.getElementById("listaVacia");

    contenedor.innerHTML = "";

    if (!conversaciones.length) {
        vacia.classList.remove("hidden");
        return;
    }

    vacia.classList.add("hidden");

    conversaciones.forEach(c => {
        const item = document.createElement("div");
        item.className = "item-conversacion";
        if (conversacionActiva === c.phone) item.classList.add("activo");

        item.onclick = () => seleccionarConversacion(c.phone);

        const estado = estadoVentana(c.window_expires_at);

        item.innerHTML = `
            <div class="item-conversacion-top">
                <span class="item-conversacion-nombre">
                    <span class="semaforo ${estado}"></span>${escapeHtml(c.whatsapp_name || c.customer_name || c.phone)}
                </span>
                <span class="item-conversacion-meta">${formatearFecha(c.updated_at)}</span>
            </div>
            <div class="item-conversacion-mensaje">${escapeHtml(c.last_customer_message) || "(sin mensaje)"}</div>
        `;

        contenedor.appendChild(item);
    });
}

async function seleccionarConversacion(phone) {
    conversacionActiva = phone;

    try {
        const response = await fetch(`${API_BASE}/whatsapp-inbox/${encodeURIComponent(phone)}`, {
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("No se pudo cargar la ficha");
        }

        const ficha = await response.json();
        renderFicha(ficha);
        cargarLista();

    } catch (error) {
        console.error("Error cargando ficha:", error);
    }
}

function renderFicha(f) {
    const vacia = document.getElementById("fichaVacia");
    const contenido = document.getElementById("fichaContenido");

    vacia.classList.add("hidden");
    contenido.classList.remove("hidden");

    const servicios = (f.summary_json && f.summary_json.services) || [];
    const serviciosHtml = servicios.length
        ? `<ul>${servicios.map(s => `<li>${escapeHtml(s.family || "")}${s.detail ? " - " + escapeHtml(s.detail) : ""}</li>`).join("")}</ul>`
        : `<span class="valor">${escapeHtml(f.service_family) || "-"}${f.service_detail ? " - " + escapeHtml(f.service_detail) : ""}</span>`;

    const phoneAttr = escapeHtml(f.phone);

    contenido.innerHTML = `
        <div class="ficha-header">
            <div>
                <h2>${escapeHtml(f.whatsapp_name || f.customer_name || "Clienta")}</h2>
                <div class="telefono">${phoneAttr}</div>
            </div>
            <span class="ficha-estado">${escapeHtml(f.state)} / ${escapeHtml(f.control_state)}</span>
        </div>

        <div class="ficha-campos">
            <div class="ficha-campo">
                <span class="label">Intención</span>
                <span class="valor">${escapeHtml(f.intent) || "-"}</span>
            </div>
            <div class="ficha-campo">
                <span class="label">Día preferido</span>
                <span class="valor">${escapeHtml(f.preferred_day) || "-"}</span>
            </div>
            <div class="ficha-campo">
                <span class="label">Horario preferido</span>
                <span class="valor">${escapeHtml(f.preferred_time) || "-"}</span>
            </div>
            <div class="ficha-campo">
                <span class="label">Profesional preferida</span>
                <span class="valor">${escapeHtml(f.preferred_professional) || "-"}</span>
            </div>
            <div class="ficha-campo">
                <span class="label">Asignada a</span>
                <span class="valor">${escapeHtml(f.assigned_to) || "Sin asignar"}</span>
            </div>
            <div class="ficha-campo">
                <span class="label">Ventana WhatsApp (24h)</span>
                <span class="valor">${formatearFecha(f.window_expires_at)}</span>
            </div>
        </div>

        <div class="ficha-servicios">
            <span class="label">Servicios</span>
            ${serviciosHtml}
        </div>

        <div class="ficha-acciones">
            <button class="btn-tomar" onclick="tomarConversacion('${phoneAttr}')">Tomar conversación</button>
            <button class="btn-cerrar" onclick="cerrarConversacion('${phoneAttr}')">Cerrar</button>
            <button class="btn-volver-bot" onclick="volverAlBot('${phoneAttr}')">Volver al bot</button>
        </div>
    `;
}

async function accionConversacion(phone, accion) {
    try {
        const response = await fetch(`${API_BASE}/whatsapp-inbox/${encodeURIComponent(phone)}/${accion}`, {
            method: "POST",
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(`No se pudo ejecutar la acción ${accion}`);
        }

        return true;

    } catch (error) {
        console.error("Error en acción de bandeja:", error);
        alert("No se pudo completar la acción. Intenta nuevamente.");
        return false;
    }
}

function limpiarFicha() {
    document.getElementById("fichaContenido").classList.add("hidden");
    document.getElementById("fichaVacia").classList.remove("hidden");
    conversacionActiva = null;
}

async function tomarConversacion(phone) {
    if (await accionConversacion(phone, "take")) {
        await seleccionarConversacion(phone);
    }
}

async function cerrarConversacion(phone) {
    if (!confirm("¿Cerrar esta conversación?")) return;
    if (await accionConversacion(phone, "close")) {
        limpiarFicha();
        cargarLista();
    }
}

async function volverAlBot(phone) {
    if (!confirm("¿Devolver esta conversación al bot?")) return;
    if (await accionConversacion(phone, "return-to-bot")) {
        limpiarFicha();
        cargarLista();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarLista();

    document.getElementById("btnRefrescar").addEventListener("click", cargarLista);

    setInterval(cargarLista, REFRESCO_MS);
});
