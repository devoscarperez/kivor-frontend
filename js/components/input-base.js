export function createInputBase({ id }) {

    const input = document.getElementById(id);
    const error = document.getElementById(`${id}-error`);

    function setError(message) {
        input.classList.add("input-invalid");
        error.textContent = message;
        error.classList.add("active");
    }

    function clearError() {
        input.classList.remove("input-invalid");
        error.textContent = "";
        error.classList.remove("active");
    }

    return {
        input,
        setError,
        clearError
    };
}
