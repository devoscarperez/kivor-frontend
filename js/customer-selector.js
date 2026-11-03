/* =========================
Selector de clienta - componente genérico reutilizable.
Uso: abrirSelectorClienta((clienta) => { ... });
Requiere: API_BASE (js/api.js) y css/customer-selector.css cargados.
========================= */

const CUSTOMER_SELECTOR_DEBOUNCE_MS = 300;
const CUSTOMER_SEARCH_MIN_CHARS = 2;

let _customerSelectorCallback = null;
let _customerSearchTimeout = null;
let _customerSearchResultados = [];

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
                        placeholder="Buscar clienta por nombre, apodo o teléfono..."
                    >
                    <button id="customerSelectorClose" class="cs-close" aria-label="Cerrar">✕</button>
                </header>
                <div id="customerSelectorResultados" class="cs-resultados"></div>
            </div>
        </div>
    `;
    document.body.appendChild(contenedor.firstElementChild);

    document.getElementById("customerSelectorBackdrop").addEventListener("click", cerrarSelectorClienta);
    document.getElementById("customerSelectorClose").addEventListener("click", cerrarSelectorClienta);
    document.getElementById("customerSelectorInput").addEventListener("input", _onCustomerSearchInput);
}

function abrirSelectorClienta(onSeleccionar) {
    _ensureCustomerSelectorDom();
    _customerSelectorCallback = onSeleccionar;

    const input = document.getElementById("customerSelectorInput");
    input.value = "";
    document.getElementById("customerSelectorResultados").innerHTML =
        `<div class="cs-vacio">${_mensajeMinimoCS()}</div>`;

    document.getElementById("customerSelectorModal").classList.add("activa");
    document.body.style.overflow = "hidden";
    setTimeout(() => input.focus(), 100);
}

function cerrarSelectorClienta() {
    const modal = document.getElementById("customerSelectorModal");
    if (modal) modal.classList.remove("activa");
    document.body.style.overflow = "";
    _customerSelectorCallback = null;
}

function _onCustomerSearchInput(event) {
    const termino = event.target.value.trim();
    clearTimeout(_customerSearchTimeout);

    if (termino.length < CUSTOMER_SEARCH_MIN_CHARS) {
        document.getElementById("customerSelectorResultados").innerHTML =
            `<div class="cs-vacio">${_mensajeMinimoCS()}</div>`;
        return;
    }

    _customerSearchTimeout = setTimeout(() => _buscarClientas(termino), CUSTOMER_SELECTOR_DEBOUNCE_MS);
}

async function _buscarClientas(termino) {
    const resultados = document.getElementById("customerSelectorResultados");
    resultados.innerHTML = `<div class="cs-vacio">Buscando...</div>`;

    try {
        const response = await fetch(`${API_BASE}/customer/search?q=${encodeURIComponent(termino)}`, {
            headers: _authHeadersCS()
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        const clientas = await response.json();
        _renderResultadosClienta(clientas || []);

    } catch (error) {
        console.error("Error buscando clientas:", error);
        resultados.innerHTML = `<div class="cs-vacio">Error al buscar. Intenta de nuevo.</div>`;
    }
}

function _renderResultadosClienta(clientas) {
    _customerSearchResultados = clientas;
    const resultados = document.getElementById("customerSelectorResultados");

    if (!clientas.length) {
        resultados.innerHTML = `<div class="cs-vacio">No se encontraron clientas.</div>`;
        return;
    }

    resultados.innerHTML = clientas.map(c => `
        <button class="cs-resultado" data-id="${c.customer_id}">
            <span class="cs-resultado-nombre">${_escapeHtmlCS(c.customer_full_name || c.customer_nickname || "(sin nombre)")}</span>
            <span class="cs-resultado-meta">${_escapeHtmlCS(c.customer_mobile || "")}</span>
        </button>
    `).join("");

    resultados.querySelectorAll(".cs-resultado").forEach(boton => {
        boton.addEventListener("click", () => {
            const clienta = _customerSearchResultados.find(c => String(c.customer_id) === boton.dataset.id);
            const callback = _customerSelectorCallback;
            cerrarSelectorClienta();
            if (callback && clienta) callback(clienta);
        });
    });
}
