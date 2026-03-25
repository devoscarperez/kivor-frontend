import { createInputRut } from "./components/input-rut.js";
const screenUsername = document.getElementById("screen-username");
const screenPassword = document.getElementById("screen-password");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const displayUsername = document.getElementById("display-username");

const btnUsername = document.getElementById("btn-username");
const btnBack = document.getElementById("btn-back");
const btnLogin = document.getElementById("btn-login");
const rutComponent = createInputRut("username");

let currentUsername = "";

btnUsername.disabled = true;
btnLogin.disabled = true;

const togglePassword = document.getElementById("toggle-password");

/* =====================
   TOGGLE PASSWORD
===================== */

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
   INPUT HANDLERS
===================== */

usernameInput.addEventListener("input", () => {
    rutComponent.clearError();
    btnUsername.disabled = usernameInput.value.trim() === "";
});

passwordInput.addEventListener("input", () => {
    limpiarError("password");
    btnLogin.disabled = passwordInput.value.trim() === "";
});

btnUsername.addEventListener("click", validarUsuario);

usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") validarUsuario();
});

/* =====================
   PASO 1: VALIDAR USUARIO
===================== */

async function validarUsuario() {

   await window.APP_READY;
   rutComponent.clearError();

   const username = usernameInput.value.trim().toLowerCase();
   if (!username) return;

   try {

        btnUsername.disabled = true;
        btnUsername.textContent = t("label_validating");

        const response = await fetch(`${API_BASE}/login-username`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {

            let msg = t("invalid_user");

            try {
                const data = await response.json();
                if (data.detail) msg = data.detail;
            } catch {}

            rutComponent.setError(msg);

            btnUsername.disabled = false;
            btnUsername.textContent = t("btn_username");
            return;
        }

        currentUsername = username;
        displayUsername.textContent = username;

        screenUsername.classList.remove("active");
        screenPassword.classList.add("active");

        passwordInput.value = "";
        btnLogin.disabled = true;

        passwordInput.focus();

    } catch (error) {

        console.error("Error login-username:", error);
        alert("No se pudo conectar con el servidor");

        btnUsername.disabled = false;
        btnUsername.textContent = t("btn_username");
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

    await window.APP_READY;
    limpiarError("password");

    const password = passwordInput.value;
    if (!password) return;

    try {

        btnLogin.disabled = true;

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

            let msg = t("invalid_credentials");

            try {
                const data = await response.json();
                if (data.detail) msg = data.detail;
            } catch {}

            mostrarError("password", msg);
            btnLogin.disabled = false;
            return;
        }

        const data = await response.json();

        sessionStorage.setItem("access_token", data.access_token);

        window.location.href = "dashboard.html";

    } catch (error) {

        console.error("Login error:", error);
        alert("No se pudo conectar con el servidor");

        btnLogin.disabled = false;
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

    btnUsername.textContent = t("btn_username");

    btnUsername.disabled = usernameInput.value.trim() === "";

    usernameInput.focus();

});

/* =====================
   UI HELPERS
===================== */

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

/* =====================
   TRANSLATIONS
===================== */

function applyTranslations() {

    document.getElementById("label-username").textContent = t("username");
    document.getElementById("label-password").textContent = t("password");
    document.getElementById("btn-username").textContent = t("btn_username");
    document.getElementById("btn-login").textContent = t("login");
    document.getElementById("btn-back").textContent = t("back");
    document.getElementById("brand-tagline").textContent = t("tagline");

}

applyTranslations();
