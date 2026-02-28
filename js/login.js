const API_BASE = "https://kivor.onrender.com";

const screenUsername = document.getElementById("screen-username");
const screenPassword = document.getElementById("screen-password");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const displayUsername = document.getElementById("display-username");

const btnUsername = document.getElementById("btn-username");
const btnBack = document.getElementById("btn-back");
const btnLogin = document.getElementById("btn-login");

let currentUsername = "";

/* =====================
   PASO 1: VALIDAR USUARIO
===================== */

btnUsername.addEventListener("click", validarUsuario);
usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") validarUsuario();
});

async function validarUsuario() {

    const username = usernameInput.value.trim();
    if (!username) return;

    try {

        // 🔹 AQUÍ CAMBIA: ahora llama a /login-username
        const response = await fetch(`${API_BASE}/login-username`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            alert("Usuario no válido");
            return;
        }

        currentUsername = username;
        displayUsername.textContent = username;

        screenUsername.classList.remove("active");
        screenPassword.classList.add("active");

        passwordInput.focus();

    } catch (error) {
        alert("Error de conexión");
    }
}

/* =====================
   PASO 2: LOGIN FINAL
===================== */

btnLogin.addEventListener("click", loginFinal);
passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") loginFinal();
});

async function loginFinal() {

    const password = passwordInput.value;
    if (!password) return;

    try {

        const response = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: currentUsername,
                password: password
            })
        });

        if (!response.ok) {
            alert("Clave incorrecta");
            return;
        }

        const data = await response.json();

        // Guardamos el token
        sessionStorage.setItem("access_token", data.access_token);

        // Redirigir al dashboard
        window.location.href = "dashboard.html";

    } catch (error) {
        alert("Error de conexión");
    }
}

/* =====================
   VOLVER ATRÁS
===================== */

btnBack.addEventListener("click", () => {
    passwordInput.value = "";
    screenPassword.classList.remove("active");
    screenUsername.classList.add("active");
});
