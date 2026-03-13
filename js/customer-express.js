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

    document.getElementById("express-btn-next")
        .addEventListener("click", handleNext);

    document.getElementById("express-btn-back")
        .addEventListener("click", previousStep);

    document.getElementById("express-btn-save")
        .addEventListener("click", saveForm);

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

    hideAllScreens();

    document.getElementById("express-screen-intro").style.display = "block";

    document.getElementById("express-intro-text").innerText =
        t("msg_intro_customer_data");

    document.getElementById("express-btn-next").innerText =
        t("action_continue");

}

function showError(messageKey) {

    hideAllScreens();

    document.getElementById("express-screen-error").style.display = "block";

    document.getElementById("express-error-text").innerText =
        t(messageKey);

}

function showSuccess() {

    hideAllScreens();

    document.getElementById("express-screen-success").style.display = "block";

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

function handleNext() {

    // salir de intro
    if (currentStep === -1) {
        currentStep = 0;
        renderField();
        return;
    }

    saveCurrentField();

    if (currentStep < fields.length - 1) {
        nextStep();
    } else {
        showSaveButton();
    }

}

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
// SAVE CURRENT FIELD
// ===============================

function saveCurrentField() {

    const field = fields[currentStep];

    const input = document.getElementById("express-input");

    if (!input) return;

    formData[field.customer_capture_settings_field] = input.value.trim();

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

    updateButtons();

}

// ===============================
// RENDER INPUT
// ===============================

function renderInput(field) {

    const container = document.getElementById("express-field-container");

    container.innerHTML = "";

    const fieldName = field.customer_capture_settings_field;

    const input = document.createElement("input");

    input.id = "express-input";
    input.autofocus = true;
    input.value = formData[fieldName] || "";

    // Tipo de input según campo
    if (fieldName === "mobile") {
        input.type = "tel";
        input.inputMode = "numeric";
        input.placeholder = "+569XXXXXXXX";
    }

    else if (fieldName === "email") {
        input.type = "email";
        input.inputMode = "email";
        input.placeholder = "email@email.com";
    }

    else if (fieldName === "birth_date") {
        input.type = "text";
        input.inputMode = "numeric";
        input.placeholder = "DD MM AAAA";
        input.maxLength = 10;
    }

    else if (fieldName === "identifier") {
        input.type = "text";
        input.placeholder = "12345678-9";
    }

    else {
        input.type = "text";
    }

    // limpiar error al escribir (igual que login)
    input.addEventListener("input", clearFieldError);

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
// BUTTON CONTROL
// ===============================

function updateButtons() {

    const backBtn = document.getElementById("express-btn-back");
    const nextBtn = document.getElementById("express-btn-next");
    const saveBtn = document.getElementById("express-btn-save");

    backBtn.style.display = currentStep > 0 ? "inline-block" : "none";

    if (currentStep === fields.length - 1) {

        nextBtn.style.display = "none";
        saveBtn.style.display = "inline-block";

    } else {

        nextBtn.style.display = "inline-block";
        saveBtn.style.display = "none";

    }

}

// ===============================
// SHOW SAVE BUTTON
// ===============================

function showSaveButton() {

    document.getElementById("express-btn-next").style.display = "none";

    document.getElementById("express-btn-save").style.display = "inline-block";

}

// ===============================
// SAVE FORM
// ===============================

async function saveForm() {

    saveCurrentField();

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
