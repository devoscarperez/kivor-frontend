// Elementos
const input = document.getElementById("kivor-input");
const button = document.getElementById("kivor-button");
const error = document.getElementById("kivor-error");

const input = document.getElementById('kivor-input');
const text = document.getElementById('kivor-text');

input.addEventListener('input', () => {
    text.textContent = input.value;
});

/* mantener foco siempre */
document.addEventListener('click', () => {
    input.focus();
});

// Función de validación
function validateInput() {
    const value = input.value.trim();

    // Si está vacío
    if (value === "") {
        showError("Campo requerido");
        return false;
    }

    // Si es válido
    clearError();
    return true;
}

// Mostrar error
function showError(message) {
    error.textContent = message;
    input.classList.add("error");
    input.focus();
}

// Limpiar error
function clearError() {
    error.textContent = "";
    input.classList.remove("error");
}

// Evento botón
button.addEventListener("click", () => {
    validateInput();
});

// Evento ENTER
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        validateInput();
    }
});
