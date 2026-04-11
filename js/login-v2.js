const input = document.getElementById('kivor-input');
const text = document.getElementById('kivor-text');
const terminal = document.querySelector('.kivor-terminal');

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
            loginValue = input.value;

            appendLine(`login: ${loginValue}`);
            input.value = "";
            text.textContent = "";

            changePrompt("password:");

            stage = "password";
        } else {
            appendLine("password: ********");
            appendLine("Authenticating...");

            input.value = "";
            text.textContent = "";
        }
    }
});

/* mantener foco */
document.addEventListener('click', () => {
    input.focus();
});

/* helpers */

function appendLine(content) {
    const line = document.createElement('div');
    line.className = 'kivor-line';
    line.textContent = content;

    terminal.insertBefore(line, input);
}

function changePrompt(newPrompt) {
    const firstLine = terminal.querySelector('.kivor-line');
    firstLine.innerHTML = `
        <span>${newPrompt}</span>
        <span id="kivor-text"></span>
        <span id="kivor-caret" class="kivor-caret"></span>
    `;
}


const bootText = `

K   K  III  V   V  OOO   RRRR
K  K    I    V V  O   O  R   R
KKK     I     V   O   O  RRRR
K  K    I     V   O   O  R  R
K   K  III    V    OOO   R   R

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
    if (i < bootText.length) {
        bootEl.textContent += bootText[i];
        i++;
        setTimeout(typeBoot, 8);
    } else {
        setTimeout(() => {
            loginEl.style.display = "flex";
            inputEl.focus();
        
            // 🔥 activar CRT AQUÍ
            setTimeout(() => {
                if (window.startCRT) {
                    window.startCRT();
                }
            }, 300);
        
        }, 400);
    }
}

window.addEventListener("load", () => {
    setTimeout(typeBoot, 300);
});
