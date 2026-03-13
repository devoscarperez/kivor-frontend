// ===============================
// KIVOR CUSTOMER EXPRESS FORM
// ===============================

let token = null;
let fields = [];
let currentStep = -1;
let formData = {};

// ===============================
// INIT
// ===============================

document.addEventListener("DOMContentLoaded", async () => {

    token = getTokenFromUrl();

    if (!token) {
        showError("msg_invalid_link");
        return;
    }

    await loadFormConfig();

    showIntro();

});

// ===============================
// TOKEN FROM URL
// ===============================

function getTokenFromUrl() {

    const path = window.location.pathname;
    const parts = path.split("/");

    return parts[parts.length - 1];

}

// ===============================
// LOAD FORM CONFIG
// ===============================

async function loadFormConfig() {

    try {

        const response = await fetch(`/customers-express/${token}`);

        if (!response.ok) {
            handleServerError(await response.json());
            return;
        }

        const data = await response.json();

        fields = data.fields;

    } catch (error) {

        showError("msg_connection_lost");

    }

}

// ===============================
// SCREENS
// ===============================

function showIntro() {

    document.getElementById("express-intro-text").innerText =
        t("msg_intro_customer_data");

    document.getElementById("express-btn-next").innerText =
        t("action_continue");

}

function showError(messageKey) {

    hideAllScreens();

    const screen = document.getElementById("express-screen-error");

    screen.style.display = "block";

    document.getElementById("express-error-text").innerText =
        t(messageKey);

}

function showSuccess() {

    hideAllScreens();

    const screen = document.getElementById("express-screen-success");

    screen.style.display = "block";

    document.getElementById("express-success-text").innerText =
        t("msg_success_saved");

}

// ===============================
// SCREEN CONTROL
// ===============================

function hideAllScreens() {

    document.querySelectorAll(".express-screen").forEach(el => {
        el.style.display = "none";
    });

}

// ===============================
// STEP NAVIGATION
// ===============================

function nextStep() {

    currentStep++;

    renderField();

}

function previousStep() {

    if (currentStep > 0) {
        currentStep--;
    }

    renderField();

}

// ===============================
// RENDER FIELD
// ===============================

function renderField() {

    hideAllScreens();

    document.getElementById("express-screen-form").style.display = "block";

    const field = fields[currentStep];

    renderInput(field);

    updateProgress();

}

// ===============================
// RENDER INPUT
// ===============================

function renderInput(field) {

    const container = document.getElementById("express-field-container");

    container.innerHTML = "";

    const input = document.createElement("input");

    input.type = "text";

    input.id = "express-input";

    input.autofocus = true;

    input.value = formData[field.customer_capture_settings_field] || "";

    container.appendChild(input);

}

// ===============================
// UPDATE PROGRESS
// ===============================

function updateProgress() {

    const progress = document.getElementById("express-progress");

    progress.innerText =
        t("step_label") + " " +
        (currentStep + 1) + " " +
        t("step_of") + " " +
        fields.length;

}

// ===============================
// SAVE FORM
// ===============================

async function saveForm() {

    try {

        const response = await fetch(`/customers-express/${token}`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(formData)

        });

        if (!response.ok) {
            handleServerError(await response.json());
            return;
        }

        showSuccess();

    } catch (error) {

        showError("msg_connection_lost");

    }

}

// ===============================
// SERVER ERROR HANDLER
// ===============================

function handleServerError(error) {

    if (error.detail === "invalid_link") {
        showError("msg_invalid_link");
    }

    if (error.detail === "expired_link") {
        showError("msg_expired_link");
    }

    if (error.detail === "form_completed") {
        showError("msg_form_completed");
    }

}
