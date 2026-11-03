/* =========================
Selector de entidades - componente genérico reutilizable (hoja inferior
con búsqueda en vivo). Soporta selección única (clienta) y selección
múltiple que no se cierra entre cada elección (profesionales).

Uso:
  abrirSelectorClienta((clienta) => { ... });
  abrirSelectorProfesionales((profesional) => { ... });

Requiere: API_BASE (js/api.js) y css/customer-selector.css cargados.
========================= */

const CUSTOMER_SELECTOR_DEBOUNCE_MS = 300;
const CUSTOMER_SEARCH_MIN_CHARS = 2;

const _CS_CONFIG_CLIENTA = {
    endpoint: "/customer/search",
    placeholder: "Buscar clienta por nombre, apodo o teléfono...",
    multiSelect: false,
    idField: "customer_id",
    mapItem: (c) => ({
        titulo: c.customer_full_name || c.customer_nickname || "(sin nombre)",
        meta: c.customer_mobile || "",
    }),
};

const _CS_CONFIG_PROFESIONAL = {
    endpoint: "/professional/search",
    placeholder: "Buscar profesional por nombre o apodo...",
    multiSelect: true,
    idField: "professional_id",
    mapItem: (p) => ({
        titulo: p.professional_name || p.professional_nickname || "(sin nombre)",
        meta: p.professional_nickname && p.professional_nickname !== p.professional_name
            ? p.professional_nickname
            : "",
    }),
};

let _csConfig = _CS_CONFIG_CLIENTA;
let _csCallback = null;
let _csSearchTimeout = null;
let _csResultados = [];

function _authHeadersCS() {
    const t = sessionStorage.getItem("access_token");
    return { "Authorization": `Bearer ${t}` };
}

function _escapeHtmlCS(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function _mensajeMinimoCS() {
    return `Escribe al menos ${CUSTOMER_SEARCH_MIN_CHARS} letras para buscar.`;
}

function _ensureCustomerSelectorDom() {
    if (document.getElementById("customerSelectorModal")) return;

    const contenedor = document.createElement("div");
    contenedor.innerHTML = `
        <div id="customerSelectorModal" class="cs-modal">
            <div id="customerSelectorBackdrop" class="cs-backdrop"></div>
            <div class="cs-sheet">
                <div class="cs-sheet-handle"></div>
                <header class="cs-sheet-header">
                    <input
                        type="text"
                        id="customerSelectorInput"
                        class="cs-input"
                    >
                    <button id="customerSelectorListo" class="cs-listo hidden">Listo</button>
                    <button id="customerSelectorClose" class="cs-close" aria-label="Cerrar">✕</button>
                </header>
                <div id="customerSelectorResultados" class="cs-resultados"></div>
            </div>
        </div>
    `;
    document.body.appendChild(contenedor.firstElementChild);

    document.getElementById("customerSelectorBackdrop").addEventListener("click", cerrarSelectorClienta);
    document.getElementById("customerSelectorClose").addEventListener("click", cerrarSelectorClienta);
    document.getElementById("customerSelectorListo").addEventListener("click", cerrarSelectorClienta);
    document.getElementById("customerSelectorInput").addEventListener("input", _onCustomerSearchInput);
}

function _abrirSelector(config, callback) {
    _ensureCustomerSelectorDom();
    _csConfig = config;
    _csCallback = callback;

    const input = document.getElementById("customerSelectorInput");
    input.value = "";
    input.placeholder = config.placeholder;

    document.getElementById("customerSelectorListo").classList.toggle("hidden", !config.multiSelect);
    document.getElementById("customerSelectorResultados").innerHTML =
        `<div class="cs-vacio">${_mensajeMinimoCS()}</div>`;

    document.getElementById("customerSelectorModal").classList.add("activa");
    document.body.style.overflow = "hidden";
    setTimeout(() => input.focus(), 100);
}

function abrirSelectorClienta(onSeleccionar) {
    _abrirSelector(_CS_CONFIG_CLIENTA, onSeleccionar);
}

function abrirSelectorProfesionales(onAgregar) {
    _abrirSelector(_CS_CONFIG_PROFESIONAL, onAgregar);
}

function cerrarSelectorClienta() {
    const modal = document.getElementById("customerSelectorModal");
    if (modal) modal.classList.remove("activa");
    document.body.style.overflow = "";
    _csCallback = null;
}

function _onCustomerSearchInput(event) {
    const termino = event.target.value.trim();
    clearTimeout(_csSearchTimeout);

    if (termino.length < CUSTOMER_SEARCH_MIN_CHARS) {
        document.getElementById("customerSelectorResultados").innerHTML =
            `<div class="cs-vacio">${_mensajeMinimoCS()}</div>`;
        return;
    }

    _csSearchTimeout = setTimeout(() => _buscarEntidades(termino), CUSTOMER_SELECTOR_DEBOUNCE_MS);
}

async function _buscarEntidades(termino) {
    const resultados = document.getElementById("customerSelectorResultados");
    resultados.innerHTML = `<div class="cs-vacio">Buscando...</div>`;

    try {
        const response = await fetch(`${API_BASE}${_csConfig.endpoint}?q=${encodeURIComponent(termino)}`, {
            headers: _authHeadersCS()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const items = await response.json();
        _renderResultadosCS(items || []);

    } catch (error) {
        console.error("Error buscando:", error);
        resultados.innerHTML = `<div class="cs-vacio">Error al buscar. Intenta de nuevo.</div>`;
    }
}

function _renderResultadosCS(items) {
    _csResultados = items;
    const resultados = document.getElementById("customerSelectorResultados");

    if (!items.length) {
        resultados.innerHTML = `<div class="cs-vacio">No se encontraron resultados.</div>`;
        return;
    }

    resultados.innerHTML = items.map(item => {
        const { titulo, meta } = _csConfig.mapItem(item);
        const id = item[_csConfig.idField];
        return `
            <button class="cs-resultado" data-id="${id}">
                <span class="cs-resultado-nombre">${_escapeHtmlCS(titulo)}</span>
                <span class="cs-resultado-meta">${_escapeHtmlCS(meta)}</span>
            </button>
        `;
    }).join("");

    resultados.querySelectorAll(".cs-resultado").forEach(boton => {
        boton.addEventListener("click", () => {
            const item = _csResultados.find(i => String(i[_csConfig.idField]) === boton.dataset.id);
            if (!item) return;

            if (_csConfig.multiSelect) {
                if (_csCallback) _csCallback(item);
                boton.classList.add("cs-resultado-agregado");
            } else {
                const callback = _csCallback;
                cerrarSelectorClienta();
                if (callback) callback(item);
            }
        });
    });
}
