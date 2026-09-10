const REFRESCO_MS = 20000;
const DIAS_SEMANA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

let conversacionActiva = null;
let fichaActual = null;
let fichaAbierta = false;

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

const ETIQUETA_VENTANA = {
    "abierta": "Vigente",
    "por-vencer": "Por vencer",
    "vencida": "Vencida",
};

function estadoConversacion(c) {
    if (c.assigned_to) return "en-curso";
    if (estadoVentana(c.window_expires_at) === "vencida") return "abandonada";
    return "ficha-lista";
}

const ETIQUETA_ESTADO = {
    "ficha-lista": "Ficha lista",
    "en-curso": "En curso",
    "abandonada": "Abandonada",
};

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

function diaAbreviado(valor) {
    if (!valor) return "-";
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return "-";
    const dia = DIAS_SEMANA[fecha.getDay()];
    return dia.charAt(0).toUpperCase() + dia.slice(1);
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

function inicial(valor) {
    if (!valor) return "?";
    return String(valor).trim().charAt(0) || "?";
}

/* =========================
Copiar al portapapeles
========================= */

let toastTimeout = null;

function mostrarToast(texto) {
    const toast = document.getElementById("toast");
    toast.textContent = texto;
    toast.classList.add("visible");

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("visible"), 1600);
}

async function copiarTexto(texto, etiqueta) {
    if (!texto) {
        mostrarToast("No hay datos para copiar");
        return;
    }

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(texto);
        } else {
            const textarea = document.createElement("textarea");
            textarea.value = texto;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }
        mostrarToast(etiqueta ? `${etiqueta} copiado` : "Copiado");
    } catch (error) {
        console.error("Error copiando al portapapeles:", error);
        mostrarToast("No se pudo copiar");
    }
}

function textoServicios(f) {
    const servicios = (f.summary_json && f.summary_json.services) || [];
    if (servicios.length) {
        return servicios.map(s => `${s.family || ""}${s.detail ? " - " + s.detail : ""}`).join(", ");
    }
    if (f.service_family) {
        return `${f.service_family}${f.service_detail ? " - " + f.service_detail : ""}`;
    }
    return "servicio a confirmar";
}

function construirTextoFichaCompleta(f) {
    const lineas = [
        `Clienta: ${f.whatsapp_name || f.customer_name || "-"}`,
        `Teléfono: ${f.phone || "-"}`,
        `Intención: ${f.intent || "-"}`,
        `Día preferido: ${f.preferred_day || "-"}`,
        `Horario preferido: ${f.preferred_time || "-"}`,
        `Profesional preferida: ${f.preferred_professional || "-"}`,
        `Asignada a: ${f.assigned_to || "Sin asignar"}`,
        `Ventana WhatsApp (24h): ${formatearFecha(f.window_expires_at)}`,
        `Servicios:\n${textoServicios(f).split(", ").map(s => `- ${s}`).join("\n")}`,
    ];

    if (f.notes) lineas.push(`Notas: ${f.notes}`);

    return lineas.join("\n");
}

function construirTextoAgenda(f) {
    const nombre = f.whatsapp_name || f.customer_name || "Clienta";
    const dia = f.preferred_day || "día a confirmar";
    const hora = f.preferred_time || "hora a confirmar";
    return `${nombre} - ${f.phone} · ${dia} ${hora} · ${textoServicios(f)}`;
}

/* =========================
Lista de conversaciones
========================= */

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
        const estado = estadoConversacion(c);
        const ventana = estadoVentana(c.window_expires_at);

        item.className = `tarjeta tarjeta-${estado}`;
        item.onclick = () => abrirFicha(c.phone);

        const nombre = c.whatsapp_name || c.customer_name || c.phone;
        const chipTexto = estado === "en-curso" && c.assigned_to
            ? `En curso · ${c.assigned_to}`
            : ETIQUETA_ESTADO[estado];

        item.innerHTML = `
            <span class="tarjeta-chip">${escapeHtml(chipTexto)}</span>
            <div class="tarjeta-top">
                <div class="avatar">${escapeHtml(inicial(nombre))}</div>
                <div class="tarjeta-info">
                    <div class="tarjeta-nombre-tel">${escapeHtml(nombre)} - ${escapeHtml(c.phone)}</div>
                    <div class="tarjeta-meta">
                        <span>Inició: ${diaAbreviado(c.created_at)}</span>
                        <span>${tiempoTranscurrido(c.created_at)}</span>
                    </div>
                    <div class="tarjeta-ventana ${ventana}">Ventana: ${ETIQUETA_VENTANA[ventana]}</div>
                </div>
            </div>
            <div class="tarjeta-mensaje">${escapeHtml(c.last_customer_message) || "(sin mensaje)"}</div>
        `;

        contenedor.appendChild(item);
    });
}

/* =========================
Ficha ampliada (hoja emergente)
========================= */

function abrirModal() {
    document.getElementById("fichaModal").classList.add("activa");
    document.body.style.overflow = "hidden";
    fichaAbierta = true;
}

function cerrarModal() {
    document.getElementById("fichaModal").classList.remove("activa");
    document.body.style.overflow = "";
    fichaAbierta = false;
    conversacionActiva = null;
    fichaActual = null;
}

async function abrirFicha(phone) {
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
        fichaActual = ficha;
        renderFicha(ficha);
        abrirModal();

    } catch (error) {
        console.error("Error cargando ficha:", error);
        mostrarToast("No se pudo cargar la ficha");
    }
}

const CAMPOS_FICHA = [
    { key: "intent", label: "Intención" },
    { key: "preferred_day", label: "Día preferido" },
    { key: "preferred_time", label: "Horario preferido" },
    { key: "preferred_professional", label: "Profesional preferida" },
    { key: "assigned_to", label: "Asignada a", vacio: "Sin asignar" },
];

function renderFicha(f) {
    document.getElementById("fichaNombre").textContent = f.whatsapp_name || f.customer_name || "Clienta";
    document.getElementById("fichaEstado").textContent = `${f.state || ""} / ${f.control_state || ""}`;

    const servicios = (f.summary_json && f.summary_json.services) || [];
    const serviciosHtml = servicios.length
        ? `<ul>${servicios.map(s => `<li>${escapeHtml(s.family || "")}${s.detail ? " - " + escapeHtml(s.detail) : ""}</li>`).join("")}</ul>`
        : `<span class="valor">${escapeHtml(f.service_family) || "-"}${f.service_detail ? " - " + escapeHtml(f.service_detail) : ""}</span>`;

    const camposHtml = CAMPOS_FICHA.map(campo => `
        <div class="campo-fila" data-campo="${campo.key}">
            <div class="campo-texto">
                <span class="label">${campo.label}</span>
                <span class="valor">${escapeHtml(f[campo.key]) || escapeHtml(campo.vacio) || "-"}</span>
            </div>
            <button class="btn-copiar" data-copiar="${campo.key}" aria-label="Copiar ${campo.label}">📋</button>
        </div>
    `).join("");

    const ventanaHtml = `
        <div class="campo-fila" data-campo="window_expires_at">
            <div class="campo-texto">
                <span class="label">Ventana WhatsApp (24h)</span>
                <span class="valor">${formatearFecha(f.window_expires_at)}</span>
            </div>
            <button class="btn-copiar" data-copiar="window_expires_at" aria-label="Copiar ventana WhatsApp">📋</button>
        </div>
    `;

    const notasHtml = f.notes ? `
        <div class="campo-fila" data-campo="notes">
            <div class="campo-texto">
                <span class="label">Notas</span>
                <span class="valor">${escapeHtml(f.notes)}</span>
            </div>
            <button class="btn-copiar" data-copiar="notes" aria-label="Copiar notas">📋</button>
        </div>
    ` : "";

    document.getElementById("fichaContenido").innerHTML = `
        <div class="ficha-copiar-fila">
            <button id="btnCopiarTodo">📋 Copiar ficha completa</button>
            <button id="btnCopiarAgenda">📅 Copiar para agenda</button>
        </div>

        <div class="ficha-telefono-row">
            <span class="telefono">${escapeHtml(f.phone)}</span>
            <button class="btn-copiar" data-copiar="phone" aria-label="Copiar teléfono">📋</button>
        </div>

        <div class="campo-copiar">
            <div class="campo-fila" data-campo="nombre">
                <div class="campo-texto">
                    <span class="label">Nombre</span>
                    <span class="valor">${escapeHtml(f.whatsapp_name || f.customer_name) || "-"}</span>
                </div>
                <button class="btn-copiar" data-copiar="nombre" aria-label="Copiar nombre">📋</button>
            </div>
            ${camposHtml}
            ${ventanaHtml}
            ${notasHtml}
        </div>

        <div class="ficha-servicios">
            <span class="label">Servicios</span>
            ${serviciosHtml}
        </div>
    `;

    document.getElementById("btnCopiarTodo").onclick = () => {
        copiarTexto(construirTextoFichaCompleta(fichaActual), "Ficha completa");
    };

    document.getElementById("btnCopiarAgenda").onclick = () => {
        copiarTexto(construirTextoAgenda(fichaActual), "Datos para agenda");
    };

    document.querySelectorAll("[data-copiar]").forEach(boton => {
        boton.onclick = () => {
            const campo = boton.dataset.copiar;
            let valor;
            let etiqueta;

            if (campo === "nombre") {
                valor = fichaActual.whatsapp_name || fichaActual.customer_name;
                etiqueta = "Nombre";
            } else if (campo === "window_expires_at") {
                valor = formatearFecha(fichaActual.window_expires_at);
                etiqueta = "Ventana WhatsApp";
            } else {
                valor = fichaActual[campo];
                const campoDef = CAMPOS_FICHA.find(c => c.key === campo);
                etiqueta = campoDef ? campoDef.label : campo;
            }

            copiarTexto(valor, etiqueta);
        };
    });
}

/* =========================
Acciones: tomar / cerrar / volver al bot
========================= */

async function accionConversacion(phone, accion) {
    try {
        const response = await fetch(`${API_BASE}/whatsapp-inbox/${encodeURIComponent(phone)}/${accion}`, {
            method: "POST",
            headers: authHeaders()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return false;
        }

        if (!response.ok) {
            throw new Error(`No se pudo ejecutar la acción ${accion}`);
        }

        return true;

    } catch (error) {
        console.error("Error en acción de bandeja:", error);
        mostrarToast("No se pudo completar la acción");
        return false;
    }
}

async function tomarConversacion() {
    if (!conversacionActiva) return;
    if (await accionConversacion(conversacionActiva, "take")) {
        await abrirFicha(conversacionActiva);
        mostrarToast("Conversación tomada");
        cargarLista();
    }
}

async function cerrarConversacion() {
    if (!conversacionActiva) return;
    if (!confirm("¿Cerrar esta conversación?")) return;
    if (await accionConversacion(conversacionActiva, "close")) {
        cerrarModal();
        cargarLista();
    }
}

async function volverAlBot() {
    if (!conversacionActiva) return;
    if (!confirm("¿Devolver esta conversación al bot?")) return;
    if (await accionConversacion(conversacionActiva, "return-to-bot")) {
        cerrarModal();
        cargarLista();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarLista();

    document.getElementById("btnRefrescar").addEventListener("click", cargarLista);
    document.getElementById("btnTomar").addEventListener("click", tomarConversacion);
    document.getElementById("btnCerrar").addEventListener("click", cerrarConversacion);
    document.getElementById("btnVolverBot").addEventListener("click", volverAlBot);
    document.getElementById("btnCerrarFicha").addEventListener("click", cerrarModal);
    document.getElementById("fichaBackdrop").addEventListener("click", cerrarModal);

    setInterval(() => {
        if (!fichaAbierta) cargarLista();
    }, REFRESCO_MS);
});
