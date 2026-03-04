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

btnUsername.disabled = true;
btnLogin.disabled = true;

const togglePassword = document.getElementById("toggle-password");
const passwordInput = document.getElementById("password");

if (togglePassword) {

  togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "🙈";
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "👁";
    }

  });

}

/* =====================
   PASO 1: VALIDAR USUARIO
===================== */

// usernameInput.addEventListener("input", () => limpiarError("username"));
// passwordInput.addEventListener("input", () => limpiarError("password"));

btnUsername.addEventListener("click", validarUsuario);
usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") validarUsuario();
});

usernameInput.addEventListener("input", () => {
    limpiarError("username");
    btnUsername.disabled = usernameInput.value.trim() === "";
});

passwordInput.addEventListener("input", () => {
    limpiarError("password");
    btnLogin.disabled = passwordInput.value.trim() === "";
});




async function validarUsuario() {

   limpiarError("username");  // 🔥 limpiar antes de validar

   const username = usernameInput.value.trim().toLowerCase();
   if (!username) return;

   try {

        btnUsername.disabled = true;
        btnUsername.textContent = "Validando...";
      
        // 🔹 AQUÍ CAMBIA: ahora llama a /login-username
        const response = await fetch(`${API_BASE}/login-username`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        });
      
        if (!response.ok) {
            // alert("Usuario no válido");
           btnUsername.disabled = false;
           btnUsername.textContent = t("login");
           mostrarError("username", t("invalid_user"));
            return;
        }
              
        currentUsername = username;
        displayUsername.textContent = username;

        btnUsername.textContent = t("login");
      
        screenUsername.classList.remove("active");
        screenPassword.classList.add("active");
      
        btnLogin.disabled = true;
        passwordInput.value = "";
      
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

    limpiarError("password");  // 🔥 limpiar antes de validar
   
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
           // alert("Clave incorrecta");
           mostrarError("password", t("invalid_credentials"));
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
    btnLogin.disabled = true;
    screenPassword.classList.remove("active");
    screenUsername.classList.add("active");
   
    // 🔥 Re-evaluar estado del botón usuario
    btnUsername.disabled = usernameInput.value.trim() === "";

    usernameInput.focus();
});


function mostrarError(campo, mensaje) {
    const input = document.getElementById(campo);
    const error = document.getElementById(`${campo}-error`);

    input.classList.add("input-invalid");
    error.textContent = mensaje;
    error.classList.add("active");
}

function limpiarError(campo) {
    const input = document.getElementById(campo);
    const error = document.getElementById(`${campo}-error`);

    input.classList.remove("input-invalid");
    error.textContent = "";
    error.classList.remove("active");
}

function applyTranslations() {
    document.getElementById("label-username").textContent = t("username");
    document.getElementById("label-password").textContent = t("password");
    document.getElementById("btn-username").textContent = t("btn_username");
    document.getElementById("btn-login").textContent = t("login");
    document.getElementById("btn-back").textContent = t("back");
    document.getElementById("brand-tagline").textContent = t("tagline");
}

applyTranslations();
