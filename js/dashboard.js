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

    const menus = await response.json();

    const container = document.getElementById("menu");
    container.innerHTML = "";

    // Construir mapa por id
    const menuMap = {};
    menus.forEach(m => {
        m.children = [];
        menuMap[m.menu_id] = m;
    });

    // Construir jerarquía
    let rootItems = [];

    menus.forEach(m => {
        if (m.menu_parent_id) {
            if (menuMap[m.menu_parent_id]) {
                menuMap[m.menu_parent_id].children.push(m);
            }
        } else {
            rootItems.push(m);
        }
    });

    // Renderizar árbol
    rootItems.forEach(root => {
        container.appendChild(renderMenuItem(root));
    });
}

function renderMenuItem(menu) {

    const item = document.createElement("div");
    item.classList.add("menu-item");
    item.textContent = menu.menu_name;

    if (menu.children.length > 0) {

        const subContainer = document.createElement("div");
        subContainer.classList.add("submenu");
        subContainer.style.display = "none";

        menu.children.forEach(child => {
            subContainer.appendChild(renderMenuItem(child));
        });

        item.onclick = () => {
            subContainer.style.display =
                subContainer.style.display === "none" ? "block" : "none";
        };

        const wrapper = document.createElement("div");
        wrapper.appendChild(item);
        wrapper.appendChild(subContainer);

        return wrapper;

    } else {
        item.onclick = () => {
            if (menu.menu_path) {
                window.location.href = menu.menu_path;
            }
        };
        return item;
    }
}

cargarMenu();
