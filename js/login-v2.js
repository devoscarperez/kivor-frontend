const input = document.getElementById('kivor-input');
let text = document.getElementById('kivor-text');
const terminal = document.querySelector('.kivor-terminal');
const screen = document.querySelector('.kivor-screen');

/*
setTimeout(() => {
    screen.classList.add('on');
}, 900); 
*/

let stage = "login";
let isProcessing = false;
let loginValue = "";

input.focus();

/* escribir */
input.addEventListener('input', () => {
    if (stage === "password") {
        text.textContent = "*".repeat(input.value.length);
    } else {
        text.textContent = input.value;
    }
});

/* ENTER */
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (stage === "login") {
            isProcessing = true;
            showProcessingMessage("Checking user...");
            loginValue = input.value.trim().toLowerCase();
        
            input.value = "";
            text.textContent = "";
        
            validateUser(loginValue);
            } else if (stage === "password") {
                        isProcessing = true;
                        showProcessingMessage("Authenticating...");
                        const passwordValue = input.value;
                    
                        input.value = "";
                        text.textContent = "";
                        
                        authenticate(loginValue, passwordValue);
                   }
    }
});

/* mantener foco */
document.addEventListener('click', () => {
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

    terminal.insertBefore(line, input);
}

function showProcessingMessage(message = "Validating...") {
    clearSystemMessages();
    appendLine(message, "system");
}

function changePrompt(newPrompt) {
    const line = document.getElementById("kivor-login");

    line.innerHTML = `
        <span>${newPrompt}</span>
        <span id="kivor-text"></span>
        <span id="kivor-caret" class="kivor-caret"></span>
    `;

    // 🔥 RE-ASIGNAR referencia (CLAVE)
    text = document.getElementById("kivor-text");
}


const bootText = `

K     K   IIIIII   V       V   OOOO    RRRRR
K    K      I       V     V   O    O   R    R
KKKK        I        V   V    O    O   RRRRR
K    K      I         V V     O    O   R   R
K     K   IIIIII       V       OOOO    R    R

KIVOR SYSTEM TERMINAL v1.0
MEMORY CHECK ............. OK
CPU INIT ................. OK
I/O CHANNELS ............. OK

UNAUTHORIZED ACCESS PROHIBITED


`;

const bootEl = document.getElementById("kivor-boot");
const loginEl = document.getElementById("kivor-login");
const inputEl = document.getElementById("kivor-input");

let i = 0;

function typeBoot() {
    // 💥 mostrar TODO de una vez
    bootEl.textContent = bootText;

    setTimeout(() => {
        loginEl.style.display = "flex";
        inputEl.focus();
    }, 300);
}

async function validateUser(username) {
    try {
        await delay(400);
        const response = await fetch(`${API_BASE}/login-username`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            let msg = "Usuario no encontrado";

            try {
                const data = await response.json();
                if (data.detail) msg = data.detail;
            } catch {}
            
            clearSystemMessages();
            
            appendLine("Invalid username", "system");
            
            resetToLogin();
            return;
        }


        clearSystemMessages();
        
        input.value = "";
        text.textContent = "";
        
        changePrompt("password:");
        stage = "password";
        input.focus();

    } catch (error) {
        appendLine("Connection error");
        
        setTimeout(() => {
            changePrompt("login:");
            stage = "login";
        
            input.value = "";
            text.textContent = "";
        
            input.focus(); // 🔥 CLAVE
        }, 800);
        
        console.error(error);
    }
}

function resetToLogin() {
    setTimeout(() => {
        clearSystemMessages();
        changePrompt("login:");
        stage = "login";

        input.value = "";
        text.textContent = "";
        input.focus();
    }, 1000);
}


async function authenticate(username, password) {
    try {
        await delay(400);
        const response = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
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
        clearSystemMessages();
        appendLine("Invalid credentials", "system");
        
        setTimeout(() => {
            clearSystemMessages();
        
            changePrompt("login:");
            stage = "login";
        
            input.value = "";
            text.textContent = "";
            input.focus();
        }, 800);

        console.error("LOGIN ERROR:", error);
    }
}

function clearSystemMessages() {
    const messages = document.querySelectorAll('.kivor-system');
    messages.forEach(m => m.remove());
}function clearSystemMessages() {
    const messages = document.querySelectorAll('.kivor-system');
    messages.forEach(m => m.remove());
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
