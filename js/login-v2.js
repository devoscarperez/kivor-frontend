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
let mode = "login"; // login | users
let showPassword = false; // 🔥 control visual password

input.focus();
setTimeout(() => {
    input.focus();
}, 0);

/* escribir */
input.addEventListener('input', () => {

    const isPasswordState =
        currentState === "CREATE_USER_PASSWORD" ||
        currentState === "CREATE_USER_CONFIRM_PASSWORD" ||
        stage === "password";

    if (isPasswordState) {
        text.textContent = showPassword
            ? input.value
            : "*".repeat(input.value.length);
    } else {
        text.textContent = input.value;
    }

    updateNextButton();
});


/* ENTER */
input.addEventListener('keydown', (e) => {

    // 🔥 1. TOGGLE PASSWORD (PRIMERO)
    if (e.key === "F2") {

        const isPasswordState =
            currentState === "CREATE_USER_PASSWORD" ||
            currentState === "CREATE_USER_CONFIRM_PASSWORD" ||
            stage === "password";

        if (isPasswordState) {
            e.preventDefault();

            showPassword = !showPassword;

            // 🔥 SOLO REFRESCAR VISUAL (NO RESET)

            const isPasswordState =
                currentState === "CREATE_USER_PASSWORD" ||
                currentState === "CREATE_USER_CONFIRM_PASSWORD" ||
                stage === "password";
            
            if (isPasswordState) {
                text.textContent = showPassword
                    ? input.value
                    : "*".repeat(input.value.length);
            
                input.type = showPassword ? "text" : "password";
            }
        }

        return;
    }    
    
    // 🔥 SI ESTAMOS EN USERS → usar state engine
    if (mode === "users") {

        if (currentState) {

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                goBack();
                return;
            }

            if (e.key === "ArrowRight") {
                e.preventDefault();

                const value = input.value.trim();
                const isValid = validateAndStore(value);

                if (!isValid) return;

                goNext();
                return;
            }

            if (e.key === "Enter") {
                e.preventDefault();

                const value = input.value.trim();
                const isValid = validateAndStore(value);

                if (!isValid) return;

                goNext();
                return;
            }
        }

        return; // 🔥 BLOQUEA LOGIN
    }

    // 🔥 LOGIN NORMAL (lo que ya tienes)
    // 🔹 EXISTENTE: ENTER
    if (e.key === 'Enter') {
        if (stage === "login") {
            isProcessing = true;
            showProcessingMessage("Checking user...");
            loginValue = input.value.trim().toLowerCase();

            if (loginValue === "users create") {
                mode = "users";
                input.value = "";
                text.textContent = "";
                goToState("CREATE_USER_NICK_NAME");
                return;
            }
        
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
document.addEventListener('click', (e) => {

    // 🔥 NO interferir con el botón 👁
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

    const isPasswordPrompt =
        currentState === "CREATE_USER_PASSWORD" ||
        currentState === "CREATE_USER_CONFIRM_PASSWORD" ||
        stage === "password";

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

    // 👁 SOLO si es password
    if (isPasswordPrompt) {
        const btn = document.createElement("button");
        btn.id = "toggle-password";
        btn.type = "button";
        btn.textContent = showPassword ? "👁‍🗨" : "👁";

        line.appendChild(btn);
    }

    text = document.getElementById("kivor-text");
}

document.addEventListener("click", (e) => {

    if (e.target.id === "toggle-password") {

        const isPasswordState =
            currentState === "CREATE_USER_PASSWORD" ||
            currentState === "CREATE_USER_CONFIRM_PASSWORD" ||
            stage === "password";

        if (!isPasswordState) return;

        showPassword = !showPassword;

        // 🔥 refrescar visual SIN perder input
        const btn = document.getElementById("toggle-password");
        
        if (showPassword) {
            text.textContent = input.value;
            input.type = "text";
        
            if (btn) btn.textContent = "👁‍🗨"; // 👁 cerrado
        } else {
            text.textContent = "*".repeat(input.value.length);
            input.type = "password";
        
            if (btn) btn.textContent = "👁"; // 👁 abierto
        }
            }
        });

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

// ===============================
// KIVOR STATE ENGINE BASE
// ===============================

// Estado actual
let currentState = null;

// Historial de estados (para volver)
let stateHistory = [];

// Datos del flujo (draft)
let userDraft = {
    nick_name: "",
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    group_id: ""
};

// Configuración del flujo
const flowConfig = {
    steps: [
        "CREATE_USER_NICK_NAME",
        "CREATE_USER_FIRST_NAME",
        "CREATE_USER_LAST_NAME",
        "CREATE_USER_USERNAME",
        "CREATE_USER_PASSWORD",
        "CREATE_USER_CONFIRM_PASSWORD",
        "CREATE_USER_GROUP",
        "CREATE_USER_CONFIRMATION"
    ]
};

function goToState(newState, saveHistory = true) {
    if (saveHistory && currentState) {
        stateHistory.push(currentState);
    }

    currentState = newState;

    renderState();
}

function goBack() {

    if (currentState && flowConfig.steps.includes(currentState)) {
        const value = input.value.trim();
        validateAndStore(value); 
    }
    if (stateHistory.length === 0) return;

    currentState = stateHistory.pop();

    renderState(false);
}


function getProgress() {
    let completed = 0;

    if (userDraft.nick_name) completed++;
    if (userDraft.first_name) completed++;
    if (userDraft.last_name) completed++;
    if (userDraft.username) completed++;
    if (userDraft.password) completed++;
    if (userDraft.group_id) completed++;

    return completed;
}

function getStepIndex(state) {
    return flowConfig.steps.indexOf(state) + 1;
}

function renderState(showHistory = true) {

    clearSystemMessages();

    const stepIndex = getStepIndex(currentState);
    const totalSteps = flowConfig.steps.length;
    const progress = getProgress();

    // 🔥 CONTEXTO (ARRIBA)
    appendLine(`Paso ${stepIndex} de ${totalSteps} — ${progress} completados`, "system");

    // 🔥 INPUT (ABAJO)
    switch (currentState) {

        case "CREATE_USER_NICK_NAME":
            changePrompt(t("field_nick_name"));
            input.value = userDraft.nick_name || "";
            break;

        case "CREATE_USER_FIRST_NAME":
            changePrompt(t("field_first_name"));
            input.value = userDraft.first_name || "";
            break;

        case "CREATE_USER_LAST_NAME":
            changePrompt(t("field_last_name"));
            input.value = userDraft.last_name || "";
            break;

        case "CREATE_USER_USERNAME":
            changePrompt(t("field_username"));
            input.value = userDraft.username || "";
            break;

        case "CREATE_USER_PASSWORD":
            changePrompt(t("field_password"));
            input.value = userDraft.password || "";
            break;

        case "CREATE_USER_CONFIRM_PASSWORD":
            changePrompt(t("field_confirm_password"));
            input.value = userDraft.password_confirm || "";
            break;

        case "CREATE_USER_GROUP":
            changePrompt(t("field_group_id"));
            input.value = userDraft.group_id || "";
            break;

        case "CREATE_USER_CONFIRMATION":
            changePrompt(t("msg_confirm_create_user"));
            input.value = "";
            break;
        
    }

    const isPasswordState =
        currentState === "CREATE_USER_PASSWORD" ||
        currentState === "CREATE_USER_CONFIRM_PASSWORD" ||
        stage === "password";
    
    if (isPasswordState) {
        input.type = showPassword ? "text" : "password";
    } else {
        input.type = "text";
    }
    
    if (isPasswordState) {
        text.textContent = showPassword
            ? input.value
            : "*".repeat(input.value.length);
    } else {
        text.textContent = input.value;
    }
    input.focus();
}

function validateAndStore(value) {

    switch (currentState) {

        case "CREATE_USER_NICK_NAME":
            if (!value) {
                showTempMessage(t("error_required_field"));
                return false;
            }
            userDraft.nick_name = value;
            return true;
        
        case "CREATE_USER_FIRST_NAME":
            if (!value) {
                showTempMessage(t("error_required_field"));
                return false;
            }
            userDraft.first_name = value;
            return true;

        case "CREATE_USER_LAST_NAME":
            if (!value) {
                showTempMessage(t("error_required_field"));
                return false;
            }
            userDraft.last_name = value;
            return true;

        case "CREATE_USER_USERNAME":
            if (!value) {
                showTempMessage(t("error_username_required"));
                return false;
            }
            userDraft.username = value;
            return true;

        case "CREATE_USER_PASSWORD":
            if (!value) {
                showTempMessage(t("error_password_required"));
                return false;
            }
            userDraft.password = value;
            return true;

        case "CREATE_USER_CONFIRM_PASSWORD":
            if (value !== userDraft.password) {
                showTempMessage(t("msg_password_mismatch"));
                return false;
            }
        
            userDraft.password_confirm = value;
            return true;

        case "CREATE_USER_GROUP":
            if (!value) {
                showTempMessage(t("error_group_required"));
                return false;
            }
            userDraft.group_id = value;
            return true;
            
        case "CREATE_USER_CONFIRMATION":
            if (value.toLowerCase() === "n") {
                showTempMessage(t("msg_operation_cancelled"), "system");
                return false;
            }
        
            if (value.toLowerCase() === "s" || value.toLowerCase() === "y") {
                showTempMessage(t("msg_processing"), "system");
            
                createUser();
            
                return false;
            }
        
            showTempMessage(t("msg_confirm_create_user"), "system");
            return false;
    }

    return false;
}

function isCurrentValid(value) {

    switch (currentState) {

        case "CREATE_USER_NICK_NAME":
        case "CREATE_USER_FIRST_NAME":    
        case "CREATE_USER_LAST_NAME":
        case "CREATE_USER_USERNAME":
        case "CREATE_USER_PASSWORD":
        case "CREATE_USER_GROUP":
            return !!value;

        case "CREATE_USER_CONFIRM_PASSWORD":
            return value === userDraft.password;
    }

    return false;
}

function goNext() {

    const currentIndex = flowConfig.steps.indexOf(currentState);

    if (currentIndex === -1) return;

    const nextState = flowConfig.steps[currentIndex + 1];

    if (!nextState) {
        goToState("CREATE_USER_CONFIRMATION");
        return;
    }

    goToState(nextState);
}

document.getElementById("btn-back").addEventListener("click", () => {
    goBack();
});
document.getElementById("btn-next").addEventListener("click", () => {

    const value = input.value.trim();
    const isValid = validateAndStore(value);

    if (!isValid) return;

    goNext();
});


function updateNextButton() {

    const btnNext = document.getElementById("btn-next");
    const btnBack = document.getElementById("btn-back");

    if (!btnNext || !btnBack) return;

    // 🔹 CONTROL VOLVER
    btnBack.disabled = stateHistory.length === 0;

    // 🔹 CONTROL SIGUIENTE
    if (!currentState || !flowConfig.steps.includes(currentState)) {
        btnNext.disabled = true;
        return;
    }

    const currentIndex = flowConfig.steps.indexOf(currentState);
    const hasNext = currentIndex < flowConfig.steps.length - 1;

    const value = input.value.trim();
    const isValid = isCurrentValid(value);

    btnNext.disabled = !(hasNext && isValid);
}

async function createUser() {

    try {

        const response = await fetch(`${API_BASE}/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionStorage.getItem("access_token")}`
            },
            body: JSON.stringify({
                user_nickname: userDraft.nick_name,
                user_name: userDraft.username,
                user_password: userDraft.password,
                user_firstname: userDraft.first_name,
                user_lastname: userDraft.last_name,
                user_group_id: userDraft.group_id
            })
        });

      if (!response.ok) {
           const data = await response.json().catch(() => null);
        
           console.error("CREATE USER BACKEND ERROR:", data);
        
           if (data?.detail) {
               appendLine(data.detail, "system");
           } else {
               appendLine(t("msg_error_generic"), "system");
           }
           return;
      }

        appendLine(t("msg_user_created"), "system");

    } catch (error) {
        appendLine(t("msg_error_generic"), "system");
        console.error("CREATE USER ERROR:", error);
    }
}

function showTempMessage(message, duration = 1500) {

    clearSystemMessages();

    appendLine(message, "system");

    setTimeout(() => {
        clearSystemMessages();
    }, duration);
}
