export function createInputText(id) {
    const input = document.getElementById(id);
    const error = document.getElementById(`${id}-error`);

    function setError(message) {
        if (input) input.classList.add("input-invalid");
        if (error) {
            error.textContent = message;
            error.classList.add("active");
        }
    }

    function clearError() {
        if (input) input.classList.remove("input-invalid");
        if (error) {
            error.textContent = "";
            error.classList.remove("active");
        }
    }

    return {
        input,
        setError,
        clearError
    };
}
