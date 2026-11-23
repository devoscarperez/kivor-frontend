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

        if (!response.ok || !Array.isArray(tickets)) {
            throw new Error(tickets?.detail || "Respuesta inesperada del servidor.");
        }

        ticketsDelDia = tickets;
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
            <div class="stub-status grupo-${grupo}" id="stubStatus" data-status="${escapeHtmlM(t.ticket_status)}">
                <span class="status-vertical">${escapeHtmlM(statusTexto)}</span>
            </div>
            <div class="stub"><span class="number">${numero}</span></div>
            <div class="ticket-flip-stage">
                <div class="ticket-flip" id="ticketFlip">
                    <div class="cara cara-frente">
                        <div class="name-wrap" id="nameWrap" data-nombre-real="${escapeHtmlM(t.customer_full_name || t.customer_nickname || "")}">
                            <h1 class="name" id="nombreTitular">${nombreClienta}</h1>
                            <div class="nombre-buscador" id="nombreBuscador">
                                <input type="text" class="nombre-buscador-input" id="nombreBuscadorInput" placeholder="Buscar clienta por nombre...">
                                <div class="nombre-buscador-resultados" id="nombreBuscadorResultados"></div>
                            </div>
                            <span class="atenciones-contador" id="atencionesContador"></span>
                        </div>
                        <div class="frame">
                            <div class="main">
                                <div class="rule"></div>
                                <div class="details">
                                    <div class="atenciones-lista" id="atencionesLista"><div class="ficha-vacio">—</div></div>
                                </div>
                                <div class="rule"></div>
                                <div class="ticket-footer">
                                    <span class="abono-footer"><span class="label">Abono</span><strong>${formatearMontoM(t.ticket_booking_deposit)}</strong></span>
                                    <span class="antiguedad">${tiempoTranscurridoM(t.primera_atencion || t.ticket_created_at)}</span>
                                    <!-- Cre/Act deshabilitado por ahora, no hace falta mostrarlo:
                                    <span class="ticket-fechas">Cre: ${formatearFechaM(t.ticket_created_at)} · Act: ${formatearFechaM(t.ticket_updated_at)}</span>
                                    -->
                                    <span class="ticket-contador">${contador}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="cara cara-dorso" id="caraDorso">
                        <div class="dorso-placeholder">Atenciones<br>(en construcción)</div>
                    </div>
                </div>
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

    // Orden cronológico por booking_date, del más antiguo al más
    // reciente. Las que no tienen fecha quedan al final, no rompen
    // el orden de las que sí tienen.
    atenciones.sort((a, b) => {
        if (!a.fecha && !b.fecha) return 0;
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return new Date(a.fecha) - new Date(b.fecha);
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
    // 0.8 en vez de 1.04 = ~30% más grande, para que ocupe de verdad
    // su espacio en vez de quedar flotando.
    const stubStatus = document.querySelector(".ticket .stub-status");
    const statusTexto = document.querySelector(".ticket .status-vertical");
    if (stubStatus && statusTexto) {
        const altoStatus = stubStatus.clientHeight;
        const largo = statusTexto.textContent.length || 1;
        statusTexto.style.fontSize = `${Math.floor(altoStatus / (largo * 0.8))}px`;
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

    // El talón nuevo siempre nace cerrado -evita que quede un "abierto"
    // colgado si el usuario navega a otro ticket sin cerrar el cajón.
    statusAbierto = false;
    statusOriginal = null;
    ultimoTapStatus = 0;

    nombreAbierto = false;
    ultimoTapNombre = 0;
    ultimoTapAtenciones = 0;

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

// El cajón del status: doble-tap para abrir (se despega del ticket),
// arrastre vertical mientras está abierto para ciclar el estado, y un
// tap simple para cerrarlo -cerrar es lo que guarda el cambio de
// verdad, igual que guardar algo al volver a meter el cajón.
const DOBLE_TAP_MS = 350;
const UMBRAL_TAP_PX = 12;
const UMBRAL_CICLO_PX = 40;

let statusAbierto = false;
let statusOriginal = null;
let ultimoTapStatus = 0;

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

        if (Math.abs(deltaY) < UMBRAL_TAP_PX) {
            manejarTapStatus();
        } else if (statusAbierto && Math.abs(deltaY) > UMBRAL_CICLO_PX) {
            cambiarStatusVisual(deltaY < 0 ? 1 : -1);
        }

        inicioY = null;
        enStub = false;
    }, { passive: true });
}

function manejarTapStatus() {
    const ahora = Date.now();

    if (!statusAbierto) {
        if (ahora - ultimoTapStatus < DOBLE_TAP_MS) {
            abrirCajonStatus();
            ultimoTapStatus = 0;
        } else {
            ultimoTapStatus = ahora;
        }
    } else {
        cerrarCajonStatus();
    }
}

function abrirCajonStatus() {
    const stub = document.getElementById("stubStatus");
    if (!stub) return;

    statusAbierto = true;
    statusOriginal = stub.dataset.status;
    stub.classList.add("abierto");
}

function cerrarCajonStatus() {
    const stub = document.getElementById("stubStatus");
    if (!stub) return;

    statusAbierto = false;
    stub.classList.remove("abierto");

    const nuevoStatus = stub.dataset.status;
    if (nuevoStatus !== statusOriginal) {
        guardarStatusM(nuevoStatus, statusOriginal);
    }
}

// Tocar afuera del talón mientras está abierto cancela sin guardar
// -descarta cualquier cambio probado con el arrastre y cierra. Mismo
// criterio que el cajón del nombre: tocar afuera siempre cancela,
// tocar el elemento mismo siempre confirma.
function cancelarCajonStatus() {
    const stub = document.getElementById("stubStatus");
    if (!stub) return;

    statusAbierto = false;
    stub.classList.remove("abierto");
    aplicarStatusVisual(statusOriginal);
}

function inicializarCierreAfueraStatus() {
    const slot = document.getElementById("ticketmSlot");

    slot.addEventListener("click", (e) => {
        if (!statusAbierto) return;
        if (e.target.closest(".stub-status")) return;
        cancelarCajonStatus();
    });
}

function cambiarStatusVisual(direccion) {
    const stub = document.getElementById("stubStatus");
    if (!stub) return;

    const actual = stub.dataset.status;
    const indiceActualStatus = ORDEN_STATUS.indexOf(actual);
    const nuevoIndice = Math.min(ORDEN_STATUS.length - 1, Math.max(0, indiceActualStatus + direccion));
    if (nuevoIndice === indiceActualStatus) return;

    const nuevoStatus = ORDEN_STATUS[nuevoIndice];
    aplicarStatusVisual(nuevoStatus);
}

function aplicarStatusVisual(status) {
    const stub = document.getElementById("stubStatus");
    if (!stub) return;

    const grupo = STATUS_GRUPO_M[status] || "neutral";
    stub.dataset.status = status;
    stub.className = `stub-status grupo-${grupo}${stub.classList.contains("abierto") ? " abierto" : ""}`;
    stub.querySelector(".status-vertical").textContent = STATUS_ES[status] || status;
    ajustarNumeroTicket();
}

async function guardarStatusM(nuevoStatus, statusAnterior) {
    const actual = ticketsDelDia[indiceActual];
    if (!actual) return;

    try {
        const response = await fetch(`${API_BASE}/ticket/${actual.ticket_id}/status`, {
            method: "PATCH",
            headers: { ...authHeadersM(), "Content-Type": "application/json" },
            body: JSON.stringify({ status: nuevoStatus })
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado?.detail || "No se pudo cambiar el estado.");
        }

        actual.ticket_status = resultado.ticket_status;
        actual.ticket_status_changed_at = resultado.ticket_status_changed_at;
        actual.ticket_updated_at = resultado.ticket_updated_at;

        mostrarToastM("Estado actualizado");

    } catch (error) {
        console.error("Error cambiando status:", error);
        aplicarStatusVisual(statusAnterior);
        mostrarToastM(error.message || "No se pudo cambiar el estado.", true);
    }
}

let toastMTimeout = null;

function mostrarToastM(texto, esError = false) {
    const toast = document.getElementById("toastM");
    if (!toast) return;

    toast.textContent = texto;
    toast.classList.toggle("toast-error", esError);
    toast.classList.add("visible");

    if (toastMTimeout) clearTimeout(toastMTimeout);
    toastMTimeout = setTimeout(() => toast.classList.remove("visible"), 3500);
}

// El cajón del nombre: doble-tap lo abre (se levanta hacia arriba, el
// nombre se convierte en buscador). Elegir un resultado guarda y
// cierra en el mismo gesto -no hace falta un tap aparte para
// confirmar, porque elegir ya es una acción final, a diferencia del
// arrastre de status. Tocar afuera del cajón cancela sin guardar.
const NOMBRE_BUSQUEDA_DEBOUNCE_MS = 300;
const NOMBRE_BUSQUEDA_MIN_CHARS = 2;

let nombreAbierto = false;
let nombreBusquedaTimeout = null;
let ultimoTapNombre = 0;

function inicializarCajonNombre() {
    const slot = document.getElementById("ticketmSlot");

    slot.addEventListener("click", (e) => {
        const wrap = e.target.closest(".name-wrap");

        if (!nombreAbierto) {
            if (wrap) manejarTapNombre();
            return;
        }

        // Abierto: clic en un resultado selecciona; clic en cualquier
        // otro lado (incluido el propio campo) no cierra -el campo
        // necesita poder tocarse para escribir/mover el cursor.
        const resultado = e.target.closest(".nombre-resultado");
        if (resultado) {
            seleccionarClienta(resultado.dataset.customerId, resultado.dataset.nombre);
        } else if (!wrap) {
            cerrarCajonNombre(false);
        }
    });
}

function manejarTapNombre() {
    const ahora = Date.now();

    if (ahora - ultimoTapNombre < DOBLE_TAP_MS) {
        abrirCajonNombre();
        ultimoTapNombre = 0;
    } else {
        ultimoTapNombre = ahora;
    }
}

function abrirCajonNombre() {
    const wrap = document.getElementById("nameWrap");
    const input = document.getElementById("nombreBuscadorInput");
    if (!wrap || !input) return;

    nombreAbierto = true;
    wrap.classList.add("abierto");

    const nombreReal = wrap.dataset.nombreReal || "";
    input.value = nombreReal;
    document.getElementById("nombreBuscadorResultados").innerHTML = "";

    setTimeout(() => {
        input.focus();
        input.select();
    }, 50);

    ajustarNumeroTicket();
}

function cerrarCajonNombre(huboSeleccion) {
    const wrap = document.getElementById("nameWrap");
    if (!wrap) return;

    nombreAbierto = false;
    wrap.classList.remove("abierto");

    if (!huboSeleccion) {
        document.getElementById("nombreBuscadorInput").value = "";
        document.getElementById("nombreBuscadorResultados").innerHTML = "";
    }

    ajustarNumeroTicket();
}

function inicializarBusquedaNombre() {
    const slot = document.getElementById("ticketmSlot");

    slot.addEventListener("input", (e) => {
        if (!e.target.matches("#nombreBuscadorInput")) return;

        const termino = e.target.value.trim();
        clearTimeout(nombreBusquedaTimeout);

        if (termino.length < NOMBRE_BUSQUEDA_MIN_CHARS) {
            document.getElementById("nombreBuscadorResultados").innerHTML = "";
            return;
        }

        nombreBusquedaTimeout = setTimeout(() => buscarClientas(termino), NOMBRE_BUSQUEDA_DEBOUNCE_MS);
    });
}

async function buscarClientas(termino) {
    const resultados = document.getElementById("nombreBuscadorResultados");
    resultados.innerHTML = `<div class="nombre-resultado-vacio">Buscando...</div>`;

    try {
        const response = await fetch(`${API_BASE}/customer/search?q=${encodeURIComponent(termino)}`, {
            headers: authHeadersM()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const items = await response.json();
        renderResultadosNombre(items || []);

    } catch (error) {
        console.error("Error buscando clientas:", error);
        resultados.innerHTML = `<div class="nombre-resultado-vacio">Error al buscar. Intenta de nuevo.</div>`;
    }
}

function renderResultadosNombre(items) {
    const resultados = document.getElementById("nombreBuscadorResultados");

    if (!items.length) {
        resultados.innerHTML = `<div class="nombre-resultado-vacio">No se encontraron clientas.</div>`;
        ajustarNumeroTicket();
        return;
    }

    resultados.innerHTML = items.map(c => {
        const nombre = c.customer_full_name || c.customer_nickname || "(sin nombre)";
        return `
            <div class="nombre-resultado" data-customer-id="${c.customer_id}" data-nombre="${escapeHtmlM(nombre)}">
                <span class="nombre-resultado-nombre">${escapeHtmlM(nombre)}</span>
                <span class="nombre-resultado-meta">${escapeHtmlM(c.customer_mobile || "")}</span>
            </div>
        `;
    }).join("");

    ajustarNumeroTicket();
}

async function seleccionarClienta(customerId, nombre) {
    const actual = ticketsDelDia[indiceActual];
    if (!actual) return;

    try {
        const response = await fetch(`${API_BASE}/ticket/${actual.ticket_id}/customer`, {
            method: "PATCH",
            headers: { ...authHeadersM(), "Content-Type": "application/json" },
            body: JSON.stringify({ customer_id: Number(customerId) })
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado?.detail || "No se pudo asociar la clienta.");
        }

        actual.ticket_customer_id = resultado.ticket_customer_id;
        actual.customer_full_name = nombre;
        actual.customer_nickname = nombre;

        document.getElementById("nombreTitular").textContent = nombre;
        document.getElementById("nameWrap").dataset.nombreReal = nombre;

        cerrarCajonNombre(true);
        mostrarToastM("Clienta actualizada");

    } catch (error) {
        console.error("Error asociando clienta:", error);
        cerrarCajonNombre(false);
        mostrarToastM(error.message || "No se pudo asociar la clienta.", true);
    }
}

// El secreto de las atenciones: doble-tap en el contador gira el
// ticket 180° -el status y el número quedan fijos (viven afuera de
// .ticket-flip) como ancla visual; el resto pasa a ser 100% espacio
// de atenciones en el dorso. Por ahora el dorso es un placeholder;
// el contenido real (lista editable + agregar) viene en una
// siguiente pasada, ya con el mecanismo del giro probado.
let ultimoTapAtenciones = 0;

function inicializarGiroAtenciones() {
    const slot = document.getElementById("ticketmSlot");

    slot.addEventListener("touchend", (e) => {
        if (!e.target.closest(".atenciones-contador")) return;

        const ahora = Date.now();
        if (ahora - ultimoTapAtenciones < DOBLE_TAP_MS) {
            alternarGiroTicket();
            ultimoTapAtenciones = 0;
        } else {
            ultimoTapAtenciones = ahora;
        }
    }, { passive: true });
}

function inicializarCierreAfueraGiro() {
    document.addEventListener("click", (e) => {
        const flip = document.getElementById("ticketFlip");
        if (!flip || !flip.classList.contains("girado")) return;
        if (e.target.closest(".ticket")) return;

        flip.classList.remove("girado");
    });
}

function alternarGiroTicket() {
    const flip = document.getElementById("ticketFlip");
    if (flip) flip.classList.toggle("girado");
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
inicializarCierreAfueraStatus();
inicializarCajonNombre();
inicializarBusquedaNombre();
inicializarGiroAtenciones();
inicializarCierreAfueraGiro();
cargarTicketsDelDia();

window.addEventListener("resize", ajustarNumeroTicket);
