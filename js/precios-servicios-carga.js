document.addEventListener("DOMContentLoaded", () => {
    initAnios();
    bindPreciosUploadEvents();
});


function initAnios() {
    const anioSelect = document.getElementById("anio");
    const currentYear = new Date().getFullYear();

    anioSelect.innerHTML = `<option value="">Seleccione</option>`;

    for (let year = currentYear + 1; year >= currentYear - 5; year--) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        anioSelect.appendChild(option);
    }
}


function bindPreciosUploadEvents() {
    const form = document.getElementById("preciosUploadForm");
    const fileInput = document.getElementById("archivoPrecios");

    fileInput.addEventListener("change", handleFileSelected);
    form.addEventListener("submit", handlePreUploadConfirm);

    document
        .getElementById("btnCancelConfirm")
        .addEventListener("click", closeConfirmModal);

    document
        .getElementById("btnConfirmUpload")
        .addEventListener("click", uploadPrecios);
}


function handleFileSelected() {
    const fileInput = document.getElementById("archivoPrecios");
    const selectedFileBox = document.getElementById("selectedFileBox");

    if (!fileInput.files.length) {
        selectedFileBox.classList.add("hidden");
        selectedFileBox.innerHTML = "";
        return;
    }

    const file = fileInput.files[0];

    selectedFileBox.classList.remove("hidden");
    selectedFileBox.innerHTML = `
        Archivo seleccionado: <strong>${file.name}</strong>
    `;
}


function handlePreUploadConfirm(event) {
    event.preventDefault();

    const anio = document.getElementById("anio").value;
    const mes = document.getElementById("mes").value;
    const modo = document.getElementById("modo").value;
    const fileInput = document.getElementById("archivoPrecios");

    if (!anio || !mes || !modo || !fileInput.files.length) {
        showResult("Debe seleccionar año, mes, tipo de carga y archivo.", true);
        return;
    }

    const vigencia = `${mes}${anio}`;
    const mesTexto = getMesTexto(mes);

    if (modo === "full") {
        document.getElementById("confirmText").innerHTML = `
            Esta acción eliminará <strong>TODOS</strong> los precios existentes
            de la vigencia <strong>${vigencia} (${mesTexto} ${anio})</strong>
            y cargará completos los datos de la hoja <strong>${vigencia}</strong>
            del archivo seleccionado.
            <br><br>
            ¿Desea continuar?
        `;
    } else {
        document.getElementById("confirmText").innerHTML = `
            Esta acción reemplazará solo los servicios incluidos en la hoja
            <strong>${vigencia}</strong> del archivo seleccionado, dentro de la
            vigencia <strong>${vigencia} (${mesTexto} ${anio})</strong>, sin
            afectar el resto de los precios de esa vigencia.
            <br><br>
            ¿Desea continuar?
        `;
    }

    openConfirmModal();
}


async function uploadPrecios() {
    closeConfirmModal();

    const btn = document.getElementById("btnCargarPrecios");
    const anio = document.getElementById("anio").value;
    const mes = document.getElementById("mes").value;
    const modo = document.getElementById("modo").value;
    const fileInput = document.getElementById("archivoPrecios");

    const formData = new FormData();
    formData.append("anio", anio);
    formData.append("mes", mes);
    formData.append("modo", modo);
    formData.append("file", fileInput.files[0]);

    try {
        btn.disabled = true;
        btn.textContent = "Cargando...";

        const result = await cargarPreciosServicios(formData);

        showResult(`
            <strong>Carga realizada correctamente.</strong><br>
            Vigencia: ${result.vigencia}<br>
            Tipo de carga: ${result.modo}<br>
            Registros eliminados: ${result.rows_deleted}<br>
            Registros insertados: ${result.rows_inserted}
        `, false);

    } catch (error) {
        showResult(error.message || "Error al cargar precios.", true);

    } finally {
        btn.disabled = false;
        btn.textContent = "Cargar precios";
    }
}


function openConfirmModal() {
    document.getElementById("confirmModal").classList.remove("hidden");
}


function closeConfirmModal() {
    document.getElementById("confirmModal").classList.add("hidden");
}


function showResult(message, isError = false) {
    const resultBox = document.getElementById("preciosResult");

    resultBox.classList.remove("hidden");
    resultBox.classList.toggle("error", isError);
    resultBox.innerHTML = message;
}


function getMesTexto(mes) {
    const meses = {
        "ENE": "Enero",
        "FEB": "Febrero",
        "MAR": "Marzo",
        "ABR": "Abril",
        "MAY": "Mayo",
        "JUN": "Junio",
        "JUL": "Julio",
        "AGO": "Agosto",
        "SEP": "Septiembre",
        "OCT": "Octubre",
        "NOV": "Noviembre",
        "DIC": "Diciembre"
    };

    return meses[String(mes).toUpperCase()] || "";
}
