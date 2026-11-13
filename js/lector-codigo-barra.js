let lectorLcb;
let ultimoCodigoLcb = "";
let ultimaLecturaLcb = 0;

document.getElementById("btnIniciarLcb").addEventListener("click", iniciarLectorLcb);

async function iniciarLectorLcb() {
    if (lectorLcb) return;

    lectorLcb = new Html5Qrcode("reader", {
        formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.CODE_128
        ]
    });

    try {
        await lectorLcb.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 280, height: 140 } },
            onCodigoDetectadoLcb
        );
    } catch (error) {
        lectorLcb = null;
        alert("No se pudo abrir la cámara: " + error);
    }
}

function onCodigoDetectadoLcb(codigo) {
    const ahora = Date.now();

    if (codigo === ultimoCodigoLcb && ahora - ultimaLecturaLcb < 2000) return;

    ultimoCodigoLcb = codigo;
    ultimaLecturaLcb = ahora;

    const horaLectura = new Date();
    const inicioMedicion = performance.now();

    document.getElementById("resultadoLcb").textContent = "Código leído: " + codigo + " — guardando...";

    guardarLecturaLcb(codigo, horaLectura, inicioMedicion);
}

async function guardarLecturaLcb(codigo, horaLectura, inicioMedicion) {
    try {
        const response = await apiFetch(`${API_BASE}/barcode-scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                codigo: codigo,
                hora_lectura_cliente: horaLectura.toISOString()
            })
        });

        const duracionMs = Math.round(performance.now() - inicioMedicion);

        if (!response || !response.ok) {
            document.getElementById("resultadoLcb").textContent =
                "Código: " + codigo + " — error al guardar";
            return;
        }

        await response.json();

        document.getElementById("resultadoLcb").textContent =
            "Código: " + codigo + " — guardado en " + duracionMs + " ms";

        agregarHistorialLcb(codigo, horaLectura, duracionMs);

    } catch (error) {
        console.error("Error guardando lectura:", error);
        document.getElementById("resultadoLcb").textContent =
            "Código: " + codigo + " — error al guardar";
    }
}

function agregarHistorialLcb(codigo, horaLectura, duracionMs) {
    const lista = document.getElementById("listaHistorialLcb");

    const item = document.createElement("div");
    item.classList.add("lcb-historial-item");
    item.innerHTML = `
        <span class="lcb-historial-codigo">${codigo}</span>
        <span class="lcb-historial-hora">${horaLectura.toLocaleTimeString()}</span>
        <span class="lcb-historial-duracion">${duracionMs} ms</span>
    `;

    lista.prepend(item);
}
