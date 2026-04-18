const token = sessionStorage.getItem("access_token");

if (!token) {
    window.location.href = "login.html";
}

async function validateSession() {
    try {
        const response = await fetch(`${API_BASE}/sessions`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Sesión inválida");
        }

    } catch (error) {
        sessionStorage.removeItem("access_token");
        window.location.href = "login.html";
    }
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

        item.classList.add("parent");
        
        item.onclick = () => {
        
            const siblings = item.parentElement.parentElement.querySelectorAll(".submenu");
            siblings.forEach(s => s.style.display = "none");
        
            const parents = item.parentElement.parentElement.querySelectorAll(".parent");
            parents.forEach(p => p.classList.remove("expanded"));
        
            subContainer.style.display = "block";
            item.classList.add("expanded");
        };

        const wrapper = document.createElement("div");
        wrapper.appendChild(item);
        wrapper.appendChild(subContainer);

        return wrapper;

    } else {
   item.onclick = () => {
        if (menu.menu_path) {

            // Quitar active de todos
            document.querySelectorAll(".menu-item")
                .forEach(m => m.classList.remove("active"));

            // Marcar el actual
            item.classList.add("active");

            window.location.href = menu.menu_path;
        }
        };
        return item;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await validateSession();
    cargarMenu();
    cargarSesiones();
});

async function cargarSesiones() {
    try {
        const response = await fetch(`${API_BASE}/sessions`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const sessions = await response.json();

        const container = document.getElementById("sessions-list");
        container.innerHTML = "";
        
        sessions.forEach(s => {
            const item = document.createElement("div");
            item.classList.add("session-item");
        
            item.innerHTML = `
                <div><strong>ID:</strong> ${s.session_id}</div>
                <div><strong>Inicio:</strong> ${new Date(s.created_at).toLocaleString()}</div>
                <div><strong>Expira:</strong> ${new Date(s.expires_at).toLocaleString()}</div>
                <button onclick="cerrarSesion('${s.session_id}')">Cerrar sesión</button>
            `;
        
            container.appendChild(item);
        });

    } catch (error) {
        console.error("Error cargando sesiones:", error);
    }
}


async function cerrarSesion(sessionId) {
    const confirmacion = confirm("¿Cerrar esta sesión?");

    if (!confirmacion) return;

    const currentSessionId = getCurrentSessionId();

    try {
        await fetch(`${API_BASE}/logout-session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ session_id: sessionId })
        });

        // 🔥 SI CIERRA SU PROPIA SESIÓN
        if (sessionId === currentSessionId) {
            sessionStorage.removeItem("access_token");
            window.location.href = "login.html";
            return;
        }

        // 🔁 recargar lista
        cargarSesiones();

    } catch (error) {
        console.error("Error cerrando sesión:", error);
    }
}

function getCurrentSessionId() {
    const token = sessionStorage.getItem("access_token");

    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.session_id;
    } catch (e) {
        return null;
    }
}
