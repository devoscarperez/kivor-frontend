document.addEventListener("DOMContentLoaded", async () => {

    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    const selectFamily = document.getElementById("family");
    const selectLevel2 = document.getElementById("level2");

    // ===== CARGAR FAMILIAS =====
    try {
        const response = await fetch(`${API_BASE}/familias`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Error al cargar familias");

        const familias = await response.json();

        familias.forEach(f => {
            const option = document.createElement("option");
            option.value = f;
            option.textContent = f;
            selectFamily.appendChild(option);
        });

    } catch (error) {
        console.error(error);
    }

    // ===== CARGAR NIVEL2 CUANDO CAMBIA FAMILIA =====
    selectFamily.addEventListener("change", async () => {

        const token = sessionStorage.getItem("access_token");
        const family = selectFamily.value;

        selectLevel2.innerHTML = '<option value="">Seleccionar...</option>';
        selectLevel2.disabled = true;

        if (!family) return;

        try {
            const response = await fetch(`${API_BASE}/niveles2?family=${family}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Error cargando nivel2");

            const niveles = await response.json();

            if (niveles.length === 0) return;

            niveles.forEach(n => {
                const option = document.createElement("option");
                option.value = n;
                option.textContent = n;
                selectLevel2.appendChild(option);
            });

            selectLevel2.disabled = false;

        } catch (error) {
            console.error(error);
        }

    });

});
