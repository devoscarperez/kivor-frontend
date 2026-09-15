document.addEventListener("DOMContentLoaded", () => {
    bindPreciosUploadEvents();
});


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

    const fileInput = document.getElementById("archivoPrecios");

    if (!fileInput.files.length) {
        showResult("Debe seleccionar un archivo.", true);
        return;
    }

    document.getElementById("confirmText").innerHTML = `
        Esta acción eliminará <strong>TODOS</strong> los precios existentes
        en la tabla y cargará completos los datos disponibles en la hoja
        <strong>PRECIOS</strong> del archivo seleccionado.
        <br><br>
        ¿Desea continuar?
    `;

    openConfirmModal();
}


async function uploadPrecios() {
    closeConfirmModal();

    const btn = document.getElementById("btnCargarPrecios");
    const fileInput = document.getElementById("archivoPrecios");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
        btn.disabled = true;
        btn.textContent = "Cargando...";

        const result = await cargarPreciosServicios(formData);

        showResult(`
            <strong>Carga realizada correctamente.</strong><br>
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
