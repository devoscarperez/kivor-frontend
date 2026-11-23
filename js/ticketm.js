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
                        <div class="dorso-lista" id="dorsoLista"></div>
                        <div class="dorso-agregar">
                            <button type="button" class="dorso-agregar-toggle" id="dorsoAgregarToggle">+ Agregar atención</button>
                            <div class="dorso-agregar-form" id="dorsoAgregarForm" hidden>
                                <div class="dorso-campo">
                                    <span class="dorso-campo-label">Clienta</span>
                                    <div id="dorsoClienteCampo">
                                        <button type="button" class="dorso-usar-titular" id="dorsoUsarTitular">Usar titular</button>
                                        <input type="text" class="dorso-buscador-input" id="dorsoClienteInput" placeholder="o buscar clienta...">
                                        <div class="dorso-buscador-resultados" id="dorsoClienteResultados"></div>
                                    </div>
                                </div>
                                <div class="dorso-campo">
                                    <span class="dorso-campo-label">Profesional</span>
                                    <div id="dorsoProfesionalCampo">
                                        <input type="text" class="dorso-buscador-input" id="dorsoProfesionalInput" placeholder="Buscar profesional...">
                                        <div class="dorso-buscador-resultados" id="dorsoProfesionalResultados"></div>
                                    </div>
                                </div>
                                <div class="dorso-campo dorso-campo-fecha">
                                    <input type="date" id="dorsoFechaInput">
                                    <input type="time" id="dorsoHoraInput">
                                </div>
                                <button type="button" class="dorso-confirmar" id="dorsoConfirmarBtn" disabled>Confirmar</button>
                            </div>
                        </div>
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
                tpId: p.ticket_professional_id,
                tpcId: c.ticket_professional_customer_id,
                clienta: c.customer_full_name || c.customer_nickname || "Sin clienta",
                profesional: nombreProfesional,
                fecha: c.ticket_professional_customer_booking_date,
                fechaFin: c.ticket_professional_customer_booking_end_date
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
        renderDorso();
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
    renderDorso();
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

// Las dos caras del giro casi nunca miden lo mismo (el dorso tiene
// lista + formulario de agregar, el frente no) -con ambas en
// position:absolute (necesario para el 3D del giro) .ticket-flip no
// tiene alto propio a menos que se lo demos. Se mide el alto real de
// la cara que corresponda mostrar y se aplica como alto explícito,
// igual que el resto del ticket: nunca se recorta ni se superpone,
// solo que acá hace falta un empujón de JS porque position:absolute
// no participa del alto automático del padre. Tope de 70% del alto
// de pantalla -más allá de eso, scroll interno en vez de seguir
// creciendo.
function ajustarAltoGiro() {
    const flip = document.getElementById("ticketFlip");
    if (!flip) return;

    const girado = flip.classList.contains("girado");
    const activa = girado ? flip.querySelector(".cara-dorso") : flip.querySelector(".cara-frente");
    if (!activa) return;

    let altoReal;
    if (girado) {
        // cara-dorso es position:absolute;inset:0 -eso ata su propio
        // alto al que .ticket-flip YA tenía (bottom:0 la estira hasta
        // igualar al padre sin importar cuánto necesite su contenido
        // real), así que medirla "tal cual" nunca refleja una
        // necesidad más chica, solo ve overflow si el contenido ya no
        // entra en lo que había antes -mismo principio que el bug de
        // margin-top:auto encontrado antes al construir el dorso,
        // en otra forma. Se suelta bottom un instante (deja solo
        // top:0) para que el contenido real determine el alto, se
        // mide con offsetHeight (incluye el borde propio de
        // cara-dorso, que es justo lo que .ticket-flip necesita para
        // no recortarla por esos 4px), y se restaura.
        const bottomPrevio = activa.style.bottom;
        activa.style.bottom = "auto";
        altoReal = activa.offsetHeight;
        activa.style.bottom = bottomPrevio;
    } else {
        altoReal = activa.offsetHeight;
    }

    const maxAlto = window.innerHeight * 0.7;
    flip.style.height = `${Math.min(altoReal, maxAlto)}px`;
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
    ajustarAltoGiro();

    // El talón nuevo siempre nace cerrado -evita que quede un "abierto"
    // colgado si el usuario navega a otro ticket sin cerrar el cajón.
    statusAbierto = false;
    statusOriginal = null;
    ultimoTapStatus = 0;

    nombreAbierto = false;
    ultimoTapNombre = 0;
    ultimoTapAtenciones = 0;
    dorsoSeleccion = { clienteId: null, clienteNombre: "", profesionalId: null, profesionalNombre: "" };

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
// de atenciones en el dorso.
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

        // e.composedPath() (no e.target.closest) a propósito: al
        // seleccionar una clienta/profesional de los resultados, ese
        // mismo click ya disparó antes el handler de selección (en
        // #ticketmSlot, más cerca del target, dispara primero en la
        // fase de bubble) que reemplaza el innerHTML del campo -el
        // nodo donde ocurrió el click queda huérfano del documento.
        // Para cuando este handler (en document, dispara después)
        // corre, e.target.closest(".ticket") ya no encuentra nada
        // porque el nodo no tiene padres -cerraba el giro justo al
        // seleccionar. composedPath() captura la cadena de
        // ancestros tal como era AL MOMENTO del click, antes de que
        // cualquier handler mude el DOM.
        const dentroDelTicket = e.composedPath().some(
            (el) => el.classList && el.classList.contains("ticket")
        );
        if (dentroDelTicket) return;

        flip.classList.remove("girado");
    });
}

function alternarGiroTicket() {
    const flip = document.getElementById("ticketFlip");
    if (!flip) return;

    flip.classList.toggle("girado");
    ajustarAltoGiro();
}

// Contenido real del dorso: lista editable de atenciones + agregar
// una nueva. "Cambio de hora" edita solo booking_end_date -mismo
// criterio ya validado en ticket-profesionales.html: el agendamiento
// original (booking_date) no se toca desde acá. Agregar es un solo
// paso (clienta + profesional + fecha/hora juntos, según lo
// definido) aunque internamente sean 2 llamadas encadenadas.
let dorsoSeleccion = { clienteId: null, clienteNombre: "", profesionalId: null, profesionalNombre: "" };
let dorsoClienteBusquedaTimeout = null;
let dorsoProfesionalBusquedaTimeout = null;

function renderDorso() {
    const lista = document.getElementById("dorsoLista");
    if (!lista) return;

    if (!atencionesActuales.length) {
        lista.innerHTML = `<div class="dorso-vacio">Sin atenciones todavía.</div>`;
        ajustarAltoGiro();
        return;
    }

    lista.innerHTML = atencionesActuales.map(a => {
        const huboCambio = a.fechaFin && a.fecha
            && new Date(a.fechaFin).getTime() !== new Date(a.fecha).getTime();
        const textoFecha = huboCambio
            ? `${formatearFechaM(a.fecha)} → ${formatearFechaM(a.fechaFin)}`
            : formatearFechaM(a.fecha);
        const fechaEditor = a.fechaFin || a.fecha;

        return `
            <div class="dorso-fila">
                <div class="dorso-fila-info" data-editar-hora="${a.tpcId}">
                    <span class="dorso-fila-clienta">${escapeHtmlM(a.clienta)}</span>
                    <span class="dorso-fila-sep">–</span>
                    <span class="dorso-fila-profesional">${escapeHtmlM(a.profesional)}</span>
                    <span class="dorso-fila-fecha">${textoFecha}</span>
                </div>
                <button type="button" class="dorso-fila-eliminar" data-eliminar-atencion="${a.tpcId}" aria-label="Eliminar atención">×</button>
            </div>
            <div class="dorso-fila-editor" id="dorsoEditor${a.tpcId}" hidden>
                <input type="date" class="dorso-editor-fecha" id="dorsoEditorFecha${a.tpcId}" value="${fechaEditor ? fechaLocalISOM(new Date(fechaEditor)) : ""}">
                <input type="time" class="dorso-editor-hora" id="dorsoEditorHora${a.tpcId}" value="${fechaEditor ? horaLocalHHMMM(new Date(fechaEditor)) : ""}">
                <button type="button" class="dorso-editor-guardar" data-guardar-hora="${a.tpcId}" data-tp-id="${a.tpId}">Guardar hora</button>
            </div>
        `;
    }).join("");

    ajustarAltoGiro();
}

function horaLocalHHMMM(fecha) {
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    return `${horas}:${minutos}`;
}

function inicializarDorsoLista() {
    const slot = document.getElementById("ticketmSlot");

    slot.addEventListener("click", (e) => {
        const fila = e.target.closest("[data-editar-hora]");
        if (fila) {
            const tpcId = fila.dataset.editarHora;
            const editor = document.getElementById(`dorsoEditor${tpcId}`);
            if (editor) editor.hidden = !editor.hidden;
            ajustarAltoGiro();
            return;
        }

        const eliminar = e.target.closest("[data-eliminar-atencion]");
        if (eliminar) {
            eliminarAtencion(eliminar.dataset.eliminarAtencion);
            return;
        }

        const guardar = e.target.closest("[data-guardar-hora]");
        if (guardar) {
            guardarHoraAtencion(guardar.dataset.guardarHora, guardar.dataset.tpId);
        }
    });
}

async function guardarHoraAtencion(tpcId, tpId) {
    const actual = ticketsDelDia[indiceActual];
    const fecha = document.getElementById(`dorsoEditorFecha${tpcId}`).value;
    const hora = document.getElementById(`dorsoEditorHora${tpcId}`).value;
    if (!actual || !fecha || !hora) return;

    const bookingEndDate = `${fecha}T${hora}:00`;

    try {
        const response = await fetch(
            `${API_BASE}/ticket/${actual.ticket_id}/professionals/${tpId}/customers/${tpcId}/booking-end-date`,
            {
                method: "PATCH",
                headers: { ...authHeadersM(), "Content-Type": "application/json" },
                body: JSON.stringify({ booking_end_date: bookingEndDate })
            }
        );

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const resultado = await response.json().catch(() => null);
            throw new Error(resultado?.detail || "No se pudo actualizar la hora.");
        }

        await cargarAtenciones(actual.ticket_id);
        mostrarToastM("Hora actualizada");

    } catch (error) {
        console.error("Error actualizando hora:", error);
        mostrarToastM(error.message || "No se pudo actualizar la hora.", true);
    }
}

async function eliminarAtencion(tpcId) {
    const actual = ticketsDelDia[indiceActual];
    const atencion = atencionesActuales.find(a => String(a.tpcId) === String(tpcId));
    if (!actual || !atencion) return;

    if (!confirm(`¿Quitar la atención de ${atencion.clienta}?`)) return;

    try {
        const response = await fetch(
            `${API_BASE}/ticket/${actual.ticket_id}/professionals/${atencion.tpId}/customers/${tpcId}`,
            { method: "DELETE", headers: authHeadersM() }
        );

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            const resultado = await response.json().catch(() => null);
            throw new Error(resultado?.detail || "No se pudo quitar la atención.");
        }

        await cargarAtenciones(actual.ticket_id);
        mostrarToastM("Atención quitada");

    } catch (error) {
        console.error("Error quitando atención:", error);
        mostrarToastM(error.message || "No se pudo quitar la atención.", true);
    }
}

function dorsoActualizarBotonConfirmar() {
    const boton = document.getElementById("dorsoConfirmarBtn");
    const fecha = document.getElementById("dorsoFechaInput").value;
    const hora = document.getElementById("dorsoHoraInput").value;
    boton.disabled = !(dorsoSeleccion.clienteId && dorsoSeleccion.profesionalId && fecha && hora);
}

function dorsoSeleccionarCliente(id, nombre) {
    dorsoSeleccion.clienteId = id;
    dorsoSeleccion.clienteNombre = nombre;

    const campo = document.getElementById("dorsoClienteCampo");
    campo.innerHTML = `<span class="dorso-seleccion">${escapeHtmlM(nombre)} <button type="button" data-limpiar-cliente>cambiar</button></span>`;
    dorsoActualizarBotonConfirmar();
    ajustarAltoGiro();
}

function dorsoLimpiarCliente() {
    dorsoSeleccion.clienteId = null;
    dorsoSeleccion.clienteNombre = "";

    const campo = document.getElementById("dorsoClienteCampo");
    campo.innerHTML = `
        <button type="button" class="dorso-usar-titular" id="dorsoUsarTitular">Usar titular</button>
        <input type="text" class="dorso-buscador-input" id="dorsoClienteInput" placeholder="o buscar clienta...">
        <div class="dorso-buscador-resultados" id="dorsoClienteResultados"></div>
    `;
    dorsoActualizarBotonConfirmar();
    ajustarAltoGiro();
}

function dorsoSeleccionarProfesional(id, nombre) {
    dorsoSeleccion.profesionalId = id;
    dorsoSeleccion.profesionalNombre = nombre;

    const campo = document.getElementById("dorsoProfesionalCampo");
    campo.innerHTML = `<span class="dorso-seleccion">${escapeHtmlM(nombre)} <button type="button" data-limpiar-profesional>cambiar</button></span>`;
    dorsoActualizarBotonConfirmar();
    ajustarAltoGiro();
}

function dorsoLimpiarProfesional() {
    dorsoSeleccion.profesionalId = null;
    dorsoSeleccion.profesionalNombre = "";

    const campo = document.getElementById("dorsoProfesionalCampo");
    campo.innerHTML = `
        <input type="text" class="dorso-buscador-input" id="dorsoProfesionalInput" placeholder="Buscar profesional...">
        <div class="dorso-buscador-resultados" id="dorsoProfesionalResultados"></div>
    `;
    dorsoActualizarBotonConfirmar();
    ajustarAltoGiro();
}

// Cada vez que cambia el contenido de los resultados hay que volver
// a medir el alto del dorso (ajustarAltoGiro) -.ticket-flip tiene un
// alto explícito fijado en JS, no automático, así que una lista de
// resultados que aparece/crece/desaparece no se nota (queda
// recortada por el overflow del dorso, inalcanzable) a menos que se
// vuelva a medir. Esto se pasó por alto al construir la búsqueda; se
// detectó porque el buscador de profesional "no hacía nada" -en
// realidad sí buscaba, pero el resultado quedaba fuera del alto
// visible.
async function dorsoBuscarClientas(termino) {
    const resultados = document.getElementById("dorsoClienteResultados");
    if (!resultados) return;
    resultados.innerHTML = `<div class="nombre-resultado-vacio">Buscando...</div>`;
    ajustarAltoGiro();

    try {
        const response = await fetch(`${API_BASE}/customer/search?q=${encodeURIComponent(termino)}`, {
            headers: authHeadersM()
        });
        if (response.status === 401) { window.location.href = "login.html"; return; }
        const items = await response.json();

        if (!items || !items.length) {
            resultados.innerHTML = `<div class="nombre-resultado-vacio">No se encontraron clientas.</div>`;
            ajustarAltoGiro();
            return;
        }

        resultados.innerHTML = items.map(c => `
            <div class="nombre-resultado" data-dorso-cliente-id="${c.customer_id}" data-dorso-cliente-nombre="${escapeHtmlM(c.customer_full_name || c.customer_nickname || "")}">
                <span class="nombre-resultado-nombre">${escapeHtmlM(c.customer_full_name || c.customer_nickname || "")}</span>
                <span class="nombre-resultado-meta">${escapeHtmlM(c.customer_mobile || "")}</span>
            </div>
        `).join("");
        ajustarAltoGiro();

    } catch (error) {
        console.error("Error buscando clientas:", error);
        resultados.innerHTML = `<div class="nombre-resultado-vacio">Error al buscar.</div>`;
        ajustarAltoGiro();
    }
}

async function dorsoBuscarProfesionales(termino) {
    const resultados = document.getElementById("dorsoProfesionalResultados");
    if (!resultados) return;
    resultados.innerHTML = `<div class="nombre-resultado-vacio">Buscando...</div>`;
    ajustarAltoGiro();

    try {
        const response = await fetch(`${API_BASE}/professional/search?q=${encodeURIComponent(termino)}`, {
            headers: authHeadersM()
        });
        if (response.status === 401) { window.location.href = "login.html"; return; }
        const items = await response.json();

        if (!items || !items.length) {
            resultados.innerHTML = `<div class="nombre-resultado-vacio">No se encontraron profesionales.</div>`;
            ajustarAltoGiro();
            return;
        }

        resultados.innerHTML = items.map(p => `
            <div class="nombre-resultado" data-dorso-profesional-id="${p.professional_id}" data-dorso-profesional-nombre="${escapeHtmlM(p.professional_name || p.professional_nickname || "")}">
                <span class="nombre-resultado-nombre">${escapeHtmlM(p.professional_name || p.professional_nickname || "")}</span>
            </div>
        `).join("");
        ajustarAltoGiro();

    } catch (error) {
        console.error("Error buscando profesionales:", error);
        resultados.innerHTML = `<div class="nombre-resultado-vacio">Error al buscar.</div>`;
        ajustarAltoGiro();
    }
}

async function dorsoConfirmarAtencion() {
    const actual = ticketsDelDia[indiceActual];
    const fecha = document.getElementById("dorsoFechaInput").value;
    const hora = document.getElementById("dorsoHoraInput").value;
    if (!actual || !dorsoSeleccion.clienteId || !dorsoSeleccion.profesionalId || !fecha || !hora) return;

    const bookingDate = `${fecha}T${hora}:00`;

    try {
        const respProfesional = await fetch(`${API_BASE}/ticket/${actual.ticket_id}/professionals`, {
            method: "POST",
            headers: { ...authHeadersM(), "Content-Type": "application/json" },
            body: JSON.stringify({ professional_id: Number(dorsoSeleccion.profesionalId) })
        });
        if (respProfesional.status === 401) { window.location.href = "login.html"; return; }
        if (!respProfesional.ok) {
            const resultado = await respProfesional.json().catch(() => null);
            throw new Error(resultado?.detail || "No se pudo agregar la profesional.");
        }
        const profesionalCreado = await respProfesional.json();

        const respCliente = await fetch(
            `${API_BASE}/ticket/${actual.ticket_id}/professionals/${profesionalCreado.ticket_professional_id}/customers`,
            {
                method: "POST",
                headers: { ...authHeadersM(), "Content-Type": "application/json" },
                body: JSON.stringify({ customer_id: Number(dorsoSeleccion.clienteId), booking_date: bookingDate })
            }
        );
        if (respCliente.status === 401) { window.location.href = "login.html"; return; }
        if (!respCliente.ok) {
            const resultado = await respCliente.json().catch(() => null);
            throw new Error(resultado?.detail || "No se pudo agregar la atención.");
        }

        await cargarAtenciones(actual.ticket_id);
        dorsoCerrarFormularioAgregar();
        mostrarToastM("Atención agregada");

    } catch (error) {
        console.error("Error agregando atención:", error);
        mostrarToastM(error.message || "No se pudo agregar la atención.", true);
    }
}

function dorsoCerrarFormularioAgregar() {
    document.getElementById("dorsoAgregarForm").hidden = true;
    dorsoLimpiarCliente();
    dorsoLimpiarProfesional();
    document.getElementById("dorsoFechaInput").value = "";
    document.getElementById("dorsoHoraInput").value = "";
    ajustarAltoGiro();
}

function inicializarDorsoAgregar() {
    const slot = document.getElementById("ticketmSlot");

    slot.addEventListener("click", (e) => {
        if (e.target.closest("#dorsoAgregarToggle")) {
            const form = document.getElementById("dorsoAgregarForm");
            form.hidden = !form.hidden;
            ajustarAltoGiro();
            return;
        }

        if (e.target.closest("#dorsoUsarTitular")) {
            const actual = ticketsDelDia[indiceActual];
            if (!actual || !actual.ticket_customer_id) {
                mostrarToastM("El ticket no tiene clienta titular asignada.", true);
                return;
            }
            dorsoSeleccionarCliente(actual.ticket_customer_id, actual.customer_full_name || actual.customer_nickname || "Titular");
            return;
        }

        if (e.target.closest("[data-limpiar-cliente]")) {
            dorsoLimpiarCliente();
            return;
        }

        if (e.target.closest("[data-limpiar-profesional]")) {
            dorsoLimpiarProfesional();
            return;
        }

        const resultadoCliente = e.target.closest("[data-dorso-cliente-id]");
        if (resultadoCliente) {
            dorsoSeleccionarCliente(resultadoCliente.dataset.dorsoClienteId, resultadoCliente.dataset.dorsoClienteNombre);
            return;
        }

        const resultadoProfesional = e.target.closest("[data-dorso-profesional-id]");
        if (resultadoProfesional) {
            dorsoSeleccionarProfesional(resultadoProfesional.dataset.dorsoProfesionalId, resultadoProfesional.dataset.dorsoProfesionalNombre);
            return;
        }

        if (e.target.closest("#dorsoConfirmarBtn")) {
            dorsoConfirmarAtencion();
        }
    });

    slot.addEventListener("input", (e) => {
        if (e.target.matches("#dorsoClienteInput")) {
            const termino = e.target.value.trim();
            clearTimeout(dorsoClienteBusquedaTimeout);
            if (termino.length < NOMBRE_BUSQUEDA_MIN_CHARS) {
                document.getElementById("dorsoClienteResultados").innerHTML = "";
                return;
            }
            dorsoClienteBusquedaTimeout = setTimeout(() => dorsoBuscarClientas(termino), NOMBRE_BUSQUEDA_DEBOUNCE_MS);
            return;
        }

        if (e.target.matches("#dorsoProfesionalInput")) {
            const termino = e.target.value.trim();
            clearTimeout(dorsoProfesionalBusquedaTimeout);
            if (termino.length < NOMBRE_BUSQUEDA_MIN_CHARS) {
                document.getElementById("dorsoProfesionalResultados").innerHTML = "";
                return;
            }
            dorsoProfesionalBusquedaTimeout = setTimeout(() => dorsoBuscarProfesionales(termino), NOMBRE_BUSQUEDA_DEBOUNCE_MS);
            return;
        }

        if (e.target.matches("#dorsoFechaInput, #dorsoHoraInput")) {
            dorsoActualizarBotonConfirmar();
        }
    });
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
inicializarDorsoLista();
inicializarDorsoAgregar();
cargarTicketsDelDia();

window.addEventListener("resize", ajustarNumeroTicket);
