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
