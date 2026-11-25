const input = document.getElementById('kivor-input');
let text = document.getElementById('kivor-text');
const terminal = document.querySelector('.kivor-terminal');
const screen = document.querySelector('.kivor-screen');

// "esperando": solo se ve la marca KIVOR centrada + el cursor debajo
// de la V, a la espera de un clic/tap -recién ahí arranca el login.
let stage = "esperando";
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
            changePrompt("password ");
            input.focus();

        } else if (stage === "password") {

            const passwordValue = input.value;

            input.value = "";
            text.textContent = "";

            stage = "auth";
            mostrarMensajeCentral("Authenticating...");

            authenticate(loginValue, passwordValue);
        }
    }
});

// Primer clic: arranca el login (achica la marca, pide el usuario).
// Cualquier clic después de eso (salvo el botón de mostrar/ocultar
// password) solo mantiene el foco en el input invisible, igual que
// antes.
document.addEventListener('click', (e) => {

    if (stage === "esperando") {
        iniciarDesdeEspera();
        return;
    }

    if (e.target.id === "toggle-password") return;

    input.focus();
});

function iniciarDesdeEspera() {
    if (stage !== "esperando") return;

    document.getElementById("kivorMarca").classList.add("achicado");

    stage = "login";
    changePrompt("login ");
    loginEl.style.display = "flex";
    input.focus();
}

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

// Mensajes (Authenticating/Access granted/error) van en la MISMA
// posición central que login y password -antes se apilaban como
// líneas nuevas debajo (appendLine), lo que tenía sentido en el
// terminal alineado a la izquierda de antes, pero ya no calza con el
// diseño centrado de un solo renglón a la vez.
function mostrarMensajeCentral(texto) {
    const line = document.getElementById("kivor-login");
    line.innerHTML = "";

    const span = document.createElement("span");
    span.textContent = texto;
    line.appendChild(span);

    line.style.display = "flex";
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

// Solo la marca -las líneas "KIVOR SYSTEM TERMINAL v1.0" y
// "UNAUTHORIZED ACCESS PROHIBITED" se sacaron del flujo (se pidió
// eliminarlas del todo, no solo ocultarlas más adelante).
const bootText = `

K     K   IIIIII   V       V   OOOO    RRRRR
K    K      I       V     V   O    O   R    R
KKKK        I        V   V    O    O   RRRRR
K    K      I         V V     O    O   R   R
K     K   IIIIII       V       OOOO    R    R

`;

const bootEl = document.getElementById("kivor-boot");
const loginEl = document.getElementById("kivor-login");
const inputEl = document.getElementById("kivor-input");

// Ya no auto-avanza a login: solo revela la marca y se queda en
// "esperando" -el primer clic/tap (ver iniciarDesdeEspera) es lo que
// arranca el resto del flujo.
function typeBoot() {
    bootEl.textContent = bootText;
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

        mostrarMensajeCentral("Access granted");

        sessionStorage.setItem("access_token", data.access_token);

        setTimeout(() => {
            window.location.href = "cubo.html";
        }, 800);

    } catch (error) {
        resetToLogin("Usuario o contraseña incorrectos");
        console.error("LOGIN ERROR:", error);
    }
}

function resetToLogin(message) {
    mostrarMensajeCentral(message);

    setTimeout(() => {
        stage = "login";
        changePrompt("login ");

        input.value = "";
        text.textContent = "";
        loginEl.style.display = "flex";
        input.focus();
    }, 800);
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

    window.location.href = "login.html";
}
