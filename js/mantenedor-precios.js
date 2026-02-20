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
const selectLevel3 = document.getElementById("level3");

selectLevel2.addEventListener("change", async () => {

    const token = sessionStorage.getItem("access_token");
    const family = selectFamily.value;
    const level2 = selectLevel2.value;

    console.log("Nivel2 cambió:", level2);


    // Reset nivel3
    selectLevel3.innerHTML = '<option value="">Seleccionar...</option>';
    selectLevel3.disabled = true;

    if (!level2) return;

    try {
        const response = await fetch(
            `${API_BASE}/niveles3?family=${encodeURIComponent(family)}&level2=${encodeURIComponent(level2)}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) throw new Error("Error cargando nivel3");

        const niveles = await response.json();

        if (niveles.length === 0) return;

        niveles.forEach(n => {
            const option = document.createElement("option");
            option.value = n;
            option.textContent = n;
            selectLevel3.appendChild(option);
        });

        selectLevel3.disabled = false;

    } catch (error) {
        console.error(error);
    }

const selectLevel4 = document.getElementById("level4");

selectLevel3.addEventListener("change", async () => {

    const family = selectFamily.value;
    const level2 = selectLevel2.value;
    const level3 = selectLevel3.value;

    selectLevel4.innerHTML = '<option value="">Seleccionar...</option>';
    selectLevel4.disabled = true;

    if (!level3) return;

    try {
        const response = await fetch(
            `${API_BASE}/niveles4?family=${encodeURIComponent(family)}&level2=${encodeURIComponent(level2)}&level3=${encodeURIComponent(level3)}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) throw new Error("Error cargando nivel4");

        const niveles = await response.json();

        niveles.forEach(n => {
            const option = document.createElement("option");
            option.value = n;
            option.textContent = n;
            selectLevel4.appendChild(option);
        });

        selectLevel4.disabled = false;

    } catch (error) {
        console.error(error);
    }

});    
});
    
        
    });

});




