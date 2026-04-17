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
let loginValue = "";

input.focus();

/* escribir */
input.addEventListener('input', () => {
    text.textContent = input.value;
});

/* ENTER */
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (stage === "login") {
            loginValue = input.value.trim().toLowerCase();
        
            appendLine(`login: ${loginValue}`);
        
            input.value = "";
            text.textContent = "";
        
            validateUser(loginValue);
            } else if (stage === "password") {
                        const passwordValue = input.value;
                    
                        appendLine("password: ********");
                       
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

function appendLine(content) {
    const line = document.createElement('div');
    line.className = 'kivor-line';
    line.textContent = content;

    terminal.insertBefore(line, input);
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
            
            clearTerminal();
            
            appendLine(`login: ${username}`);
            appendLine("Invalid username");
            
            resetToLogin();
            return;
        }

        clearTerminal();

        appendLine(`login: ${username}`);
        
        changePrompt("password:");
        stage = "password";

    } catch (error) {
        clearTerminal();
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
        appendLine("");
        changePrompt("login:");
        stage = "login";
    }, 1000);
}

function clearTerminal() {
    return;
    const lines = terminal.querySelectorAll('.kivor-line');

    lines.forEach(line => {
        // mantener solo la línea activa (prompt)
        if (!line.contains(input)) {
            line.remove();
        }
    });
}

async function authenticate(username, password) {
    try {
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

        clearTerminal();
        appendLine("Access granted");

        sessionStorage.setItem("access_token", data.access_token);

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);

    } catch (error) {
        clearTerminal();
        appendLine("Invalid credentials");
        setTimeout(() => {
            changePrompt("login:");
            stage = "login";
        }, 800);

        console.error("LOGIN ERROR:", error);
    }
}
