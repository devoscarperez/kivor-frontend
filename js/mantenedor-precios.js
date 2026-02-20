document.addEventListener("DOMContentLoaded", async () => {

    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    const selectFamily = document.getElementById("family");
    const selectLevel2 = document.getElementById("level2");
    const selectLevel3 = document.getElementById("level3");
    const selectLevel4 = document.getElementById("level4");

    // ===== CARGAR FAMILIAS =====
    try {
        const response = await fetch(`${API_BASE}/familias`, {
            headers: { "Authorization": `Bearer ${token}` }
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

    // ===== NIVEL2 =====
    selectFamily.addEventListener("change", async () => {

        const family = selectFamily.value;

        resetSelect(selectLevel2);
        resetSelect(selectLevel3);
        resetSelect(selectLevel4);

        if (!family) return;

        try {
            const response = await fetch(
                `${API_BASE}/niveles2?family=${encodeURIComponent(family)}`,
                { headers: { "Authorization": `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error("Error cargando nivel2");

            const niveles = await response.json();

            niveles.forEach(n => {
                addOption(selectLevel2, n);
            });

            selectLevel2.disabled = false;

        } catch (error) {
            console.error(error);
        }
    });

    // ===== NIVEL3 =====
    selectLevel2.addEventListener("change", async () => {

        const family = selectFamily.value;
        const level2 = selectLevel2.value;

        resetSelect(selectLevel3);
        resetSelect(selectLevel4);

        if (!level2) return;

        try {
            const response = await fetch(
                `${API_BASE}/niveles3?family=${encodeURIComponent(family)}&level2=${encodeURIComponent(level2)}`,
                { headers: { "Authorization": `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error("Error cargando nivel3");

            const niveles = await response.json();

            niveles.forEach(n => {
                addOption(selectLevel3, n);
            });

            selectLevel3.disabled = false;

        } catch (error) {
            console.error(error);
        }
    });

    // ===== NIVEL4 =====
    selectLevel3.addEventListener("change", async () => {

        const family = selectFamily.value;
        const level2 = selectLevel2.value;
        const level3 = selectLevel3.value;

        resetSelect(selectLevel4);

        if (!level3) return;

        try {
            const response = await fetch(
                `${API_BASE}/niveles4?family=${encodeURIComponent(family)}&level2=${encodeURIComponent(level2)}&level3=${encodeURIComponent(level3)}`,
                { headers: { "Authorization": `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error("Error cargando nivel4");

            const niveles = await response.json();

            niveles.forEach(n => {
                addOption(selectLevel4, n);
            });

            selectLevel4.disabled = false;

        } catch (error) {
            console.error(error);
        }
    });

});

// ===== UTILIDADES =====

function resetSelect(select) {
    select.innerHTML = '<option value="">Seleccionar...</option>';
    select.disabled = true;
}

function addOption(select, value) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
}
