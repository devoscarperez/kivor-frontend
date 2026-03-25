import { createInputBase } from "./input-base.js";

export function createInputRut(id) {

    const base = createInputBase({ id });
    const input = base.input;

    input.addEventListener("input", () => {

        let value = input.value.replace(/[^\dkK]/g, "");

        if (value.length > 1) {
            value = value.slice(0, -1)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                + "-" + value.slice(-1);
        }

        input.value = value;

        validarRut();
    });

    function validarRut() {

        const rut = input.value.replace(/\./g, "").replace("-", "");
        if (rut.length < 2) return;

        const cuerpo = rut.slice(0, -1);
        const dv = rut.slice(-1).toUpperCase();

        let suma = 0;
        let multiplo = 2;

        for (let i = cuerpo.length - 1; i >= 0; i--) {
            suma += multiplo * parseInt(cuerpo.charAt(i));
            multiplo = multiplo < 7 ? multiplo + 1 : 2;
        }

        const dvEsperado = 11 - (suma % 11);
        const dvFinal = dvEsperado === 11 ? "0" :
                        dvEsperado === 10 ? "K" :
                        dvEsperado.toString();

        if (dv !== dvFinal) {
            base.setError("RUT inválido");
        } else {
            base.clearError();
        }
    }

    return base;
}
