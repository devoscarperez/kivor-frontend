document.addEventListener("DOMContentLoaded", async () => {

    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    const selectFamily = document.getElementById("family");

    try {
        const response = await fetch(`${API_BASE}/familias`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Error al cargar familias");
        }

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

});
