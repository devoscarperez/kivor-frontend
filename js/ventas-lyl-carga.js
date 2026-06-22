document.addEventListener("DOMContentLoaded", () => {
    initAnios();
    bindVentasUploadEvents();
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


function bindVentasUploadEvents() {
    const form = document.getElementById("ventasUploadForm");
    const fileInput = document.getElementById("archivoVentas");

    fileInput.addEventListener("change", handleFileSelected);
    form.addEventListener("submit", handlePreUploadConfirm);

    document
        .getElementById("btnCancelConfirm")
        .addEventListener("click", closeConfirmModal);

    document
        .getElementById("btnConfirmUpload")
        .addEventListener("click", uploadVentas);
}


function handleFileSelected() {
    const fileInput = document.getElementById("archivoVentas");
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
    const fileInput = document.getElementById("archivoVentas");

    if (!anio || !mes || !fileInput.files.length) {
        showResult("Debe seleccionar año, mes y archivo.", true);
        return;
    }

    const mesTexto = getMesTexto(mes);
    const anioMes = `${anio}-${String(mes).padStart(2, "0")}`;

    document.getElementById("confirmText").innerHTML = `
        Esta acción eliminará los registros existentes del período
        <strong>${anioMes} (${mesTexto})</strong> en la tabla staging
        y cargará los datos del archivo seleccionado.
        <br><br>
        ¿Desea continuar?
    `;

    openConfirmModal();
}


async function uploadVentas() {
    closeConfirmModal();

    const btn = document.getElementById("btnCargarVentas");
    const anio = document.getElementById("anio").value;
    const mes = document.getElementById("mes").value;
    const fileInput = document.getElementById("archivoVentas");

    const formData = new FormData();
    formData.append("anio", anio);
    formData.append("mes", mes);
    formData.append("file", fileInput.files[0]);

    try {
        btn.disabled = true;
        btn.textContent = "Cargando...";

        const result = await cargarVentasLYL(formData);

        showResult(`
            <strong>Carga realizada correctamente.</strong><br>
            Período: ${result.anio_mes}<br>
            Registros eliminados: ${result.rows_deleted}<br>
            Registros insertados: ${result.rows_inserted}
        `, false);

    } catch (error) {
        showResult(error.message || "Error al cargar ventas.", true);

    } finally {
        btn.disabled = false;
        btn.textContent = "Cargar ventas";
    }
}


function openConfirmModal() {
    document.getElementById("confirmModal").classList.remove("hidden");
}


function closeConfirmModal() {
    document.getElementById("confirmModal").classList.add("hidden");
}


function showResult(message, isError = false) {
    const resultBox = document.getElementById("ventasResult");

    resultBox.classList.remove("hidden");
    resultBox.classList.toggle("error", isError);
    resultBox.innerHTML = message;
}


function getMesTexto(mes) {
    const meses = {
        "1": "Enero",
        "2": "Febrero",
        "3": "Marzo",
        "4": "Abril",
        "5": "Mayo",
        "6": "Junio",
        "7": "Julio",
        "8": "Agosto",
        "9": "Septiembre",
        "10": "Octubre",
        "11": "Noviembre",
        "12": "Diciembre"
    };

    return meses[String(mes)] || "";
}
