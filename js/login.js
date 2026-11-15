const input = document.getElementById('kivor-input');
let text = document.getElementById('kivor-text');
const terminal = document.querySelector('.kivor-terminal');
const screen = document.querySelector('.kivor-screen');

let stage = "login";
let loginValue = "";
let showPassword = false;

input.focus();
setTimeout(() => {
    input.focus();
}, 0);

/* escribir */
input.addEventListener('input', () => {

    if (stage === "password") {
        text.textContent = showPassword
            ? input.value
            : "*".repeat(input.value.length);
    } else {
        text.textContent = input.value;
    }
});

/* ENTER */
input.addEventListener('keydown', (e) => {

    if (e.key === "F2") {
        if (stage === "password") {
            e.preventDefault();

            showPassword = !showPassword;

            text.textContent = showPassword
                ? input.value
                : "*".repeat(input.value.length);

            input.type = showPassword ? "text" : "password";

            const btn = document.getElementById("toggle-password");
            if (btn) btn.textContent = showPassword ? "[OCULTAR]" : "[MOSTRAR]";
        }

        return;
    }

    if (e.key === 'Enter') {

        if (stage === "login") {
            loginValue = input.value.trim().toLowerCase();

            if (!loginValue) return;

            input.value = "";
            text.textContent = "";

            stage = "password";
            changePrompt("password:");
            input.focus();

        } else if (stage === "password") {

            const passwordValue = input.value;

            input.value = "";
            text.textContent = "";

            loginEl.style.display = "none";
            showProcessingMessage("Authenticating...");

            authenticate(loginValue, passwordValue);
        }
    }
});

/* mantener foco */
document.addEventListener('click', (e) => {

    if (e.target.id === "toggle-password") return;

    input.focus();
});

document.addEventListener("DOMContentLoaded", () => {
    const screen = document.querySelector(".kivor-screen");

    // estado inicial: apagado
    screen.classList.add("off");

    // forzar reflow
    screen.offsetHeight;

    // 🔥 1. aparece la línea
    setTimeout(() => {
        screen.classList.remove("off");

        // 🔥 2. esperar crecimiento de línea
        setTimeout(() => {

            // 💥 3. encender CRT (background verde)
            screen.classList.add("on");

            // 💥 4. mostrar contenido
            setTimeout(() => {
                typeBoot();
            }, 1800);

        }, 1000); // ← duración de la expansión de línea

    }, 200);
});


/* helpers */

function appendLine(content, type = "normal") {
    const line = document.createElement('div');

    line.className = type === "system"
        ? 'kivor-line kivor-system'
        : 'kivor-line';

    line.textContent = content;

    const inputWrapper = document.querySelector('.kivor-input-wrapper');
    terminal.insertBefore(line, inputWrapper);
}

function showProcessingMessage(message = "Validating...") {
    clearSystemMessages();
    appendLine(message, "system");
}

function changePrompt(newPrompt) {
    const line = document.getElementById("kivor-login");

    const isPasswordPrompt = stage === "password";

    // 🔥 limpiar completamente
    line.innerHTML = "";

    // 🔥 construir limpio
    const promptSpan = document.createElement("span");
    promptSpan.textContent = newPrompt;

    const textSpan = document.createElement("span");
    textSpan.id = "kivor-text";

    const caretSpan = document.createElement("span");
    caretSpan.id = "kivor-caret";
    caretSpan.className = "kivor-caret";

    line.appendChild(promptSpan);
    line.appendChild(textSpan);
    line.appendChild(caretSpan);

    // SOLO si es password
    if (isPasswordPrompt) {
        const btn = document.createElement("button");
        btn.id = "toggle-password";
        btn.type = "button";
        btn.textContent = showPassword ? "[OCULTAR]" : "[MOSTRAR]";

        line.appendChild(btn);
    }

    text = document.getElementById("kivor-text");
}

document.addEventListener("click", (e) => {

    if (e.target.id !== "toggle-password") return;
    if (stage !== "password") return;

    showPassword = !showPassword;

    const btn = document.getElementById("toggle-password");

    if (showPassword) {
        text.textContent = input.value;
        input.type = "text";

        if (btn) btn.textContent = "[OCULTAR]";
    } else {
        text.textContent = "*".repeat(input.value.length);
        input.type = "password";

        if (btn) btn.textContent = "[MOSTRAR]";
    }

    input.focus();
});

const bootText = `

K     K   IIIIII   V       V   OOOO    RRRRR
K    K      I       V     V   O    O   R    R
KKKK        I        V   V    O    O   RRRRR
K    K      I         V V     O    O   R   R
K     K   IIIIII       V       OOOO    R    R

KIVOR SYSTEM TERMINAL v1.0

UNAUTHORIZED ACCESS PROHIBITED


`;

const bootEl = document.getElementById("kivor-boot");
const loginEl = document.getElementById("kivor-login");
const inputEl = document.getElementById("kivor-input");

function typeBoot() {
    // 💥 mostrar TODO de una vez
    bootEl.textContent = bootText;

    setTimeout(() => {
        loginEl.style.display = "flex";
        inputEl.focus();
    }, 300);
}

async function authenticate(username, password) {
    try {
        await delay(400);
        const response = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Invalid credentials");
        }

        appendLine("Access granted");

        sessionStorage.setItem("access_token", data.access_token);

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);

    } catch (error) {
        resetToLogin("Usuario o contraseña incorrectos");
        console.error("LOGIN ERROR:", error);
    }
}

function resetToLogin(message) {
    clearSystemMessages();
    appendLine(message, "system");

    setTimeout(() => {
        clearSystemMessages();

        changePrompt("login:");
        stage = "login";

        input.value = "";
        text.textContent = "";
        loginEl.style.display = "flex";
        input.focus();
    }, 800);
}

function clearSystemMessages() {
    const messages = document.querySelectorAll('.kivor-system');
    messages.forEach(m => m.remove());
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function logout() {
    const token = sessionStorage.getItem("access_token");

    if (!token) return;

    try {
        await fetch(`${API_BASE}/logout`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error("Logout error:", error);
    }

    sessionStorage.removeItem("access_token");

    window.location.href = "index.html";
}
