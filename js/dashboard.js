const API_BASE = "https://kivor.onrender.com";
const token = sessionStorage.getItem("access_token");

if (!token) {
    window.location.href = "login.html";
}

async function cargarMenu() {

    const response = await fetch(`${API_BASE}/menu`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        sessionStorage.clear();
        window.location.href = "login.html";
        return;
    }

    const menus = await response.json();

    const container = document.getElementById("menu");

    menus.forEach(menu => {

        const item = document.createElement("div");
        item.classList.add("menu-item");
        item.innerText = menu.menu_name;

        item.onclick = () => {
            if (menu.menu_path) {
                window.location.href = menu.menu_path;
            }
        };

        container.appendChild(item);
    });
}

cargarMenu();
