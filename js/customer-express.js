// ===============================
// KIVOR CUSTOMER EXPRESS FORM
// ===============================


let fields = [];
let identifierTypes = [];
let currentStep = -1;
let formData = {};
let token = null;


const STORAGE_KEY = "kivor_customer_express_draft";

// ===============================
// INIT
// ===============================

document.addEventListener("DOMContentLoaded", async () => {

    if (!API_BASE) {    
        console.error("API_BASE not defined");
        showError("msg_connection_lost");
        return;
    }

    token = getTokenFromUrl();

    if (!token) {
        showError("msg_invalid_link");
        return;
    }
    console.log("TOKEN:", token);

    async function loadCustomerExpress() {

    try {

        const response = await fetch(`https://kivor-dev.onrender.com/customers-express/${token}`);

        console.log("STATUS:", response.status);

        const data = await response.json();

        console.log("DATA:", data);

        } catch (error) {
            console.error("ERROR:", error);
        }
    }    

    // 🔥 ejecutar
    loadCustomerExpress();
    loadDraft();

    const nextBtn = document.getElementById("express-btn-next");
    const backBtn = document.getElementById("express-btn-back");
    const saveBtn = document.getElementById("express-btn-save");

    if (nextBtn) nextBtn.addEventListener("click", handleNext);
    if (backBtn) backBtn.addEventListener("click", previousStep);
    if (saveBtn) saveBtn.addEventListener("click", saveForm);

    await loadFormConfig();

});

// ===============================
// TOKEN FROM URL
// ===============================

function getTokenFromUrl() {

    const params = new URLSearchParams(window.location.search);

    return params.get("token");

}

// ===============================
// LOAD FORM CONFIG
// ===============================

async function loadFormConfig() {

    try {

        const response = await fetch(`${API_BASE}/customers-express/${token}`);

        if (!response.ok) {
            handleServerError(await response.json());
            return;
        }

        const data = await response.json();

        fields = data.fields || [];
        identifierTypes = data.identifier_types || [];


        if (fields.length === 0) {
            showError("msg_invalid_link");
            return;
        }

        const lastStep = getLastCompletedStep();

        if (Object.keys(formData).length > 0) {

            currentStep = lastStep;
            renderField();

        } else {

            showIntro();

        }

    } catch (error) {

        console.error(error);
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

    const privacy = document.getElementById("express-privacy-text");

    if (privacy) {
        privacy.innerText = t("msg_privacy_notice");
    }

    document.getElementById("express-btn-next").innerText =
        t("action_continue");

    document.getElementById("express-btn-back").innerText =
        t("action_back");   // ← ESTA ES LA LÍNEA QUE FALTABA

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

    // ocultar botones
    document.getElementById("express-actions").style.display = "none";

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

    if (currentStep === -1) {
        currentStep = 0;
        renderField();
        return;
    }

    if (!validateCurrentField()) return;

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
        renderField();
    }

}

// ===============================
// LOCAL STORAGE
// ===============================

function saveDraft() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(formData)
    );

}

function loadDraft() {

    const draft = localStorage.getItem(STORAGE_KEY);

    if (!draft) return;

    try {
        formData = JSON.parse(draft);
    } catch {
        formData = {};
    }

}

function getLastCompletedStep() {

    for (let i = 0; i < fields.length; i++) {

        const fieldName = fields[i].customer_capture_settings_field;

        if (!formData[fieldName]) {
            return i;
        }

    }

    return fields.length - 1;

}

// ===============================
// SAVE CURRENT FIELD
// ===============================

function saveCurrentField() {

    const field = fields[currentStep];

    const input = document.getElementById("express-input");

    if (!input) return;

    formData[field.customer_capture_settings_field] =
        input.value.trim();

    saveDraft();

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

    console.log("FIELD:", field); // 👈 AQUÍ
    
    const container = document.getElementById("express-field-container");

    container.innerHTML = "";

    // 🔹 nombre original (BD)
    const fieldName = field.customer_capture_settings_field;

    // 🔹 nombre limpio (sin prefijo técnico)
    const cleanFieldName = fieldName.replace("customers_", "");

    const label = document.getElementById("express-field-label");

    // 🔹 label dinámico (BD → i18n → fallback limpio)
    let labelText = field.customer_capture_settings_label 
        || t("field_" + cleanFieldName) 
        || cleanFieldName;

    if (field.customer_capture_settings_is_required) {
        labelText += " *";
    }

    label.innerText = labelText;

    let input;

    // ===============================
    // SELECT PARA IDENTIFIER TYPE
    // ===============================

    if (fieldName === "identifier_type") {

        input = document.createElement("select");
        input.id = "express-input";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Seleccione";
        input.appendChild(defaultOption);

        identifierTypes.forEach(type => {

            const option = document.createElement("option");

            option.value = type.identifier_type_settings_code;
            option.textContent = type.identifier_type_settings_label;

            if (formData[fieldName] === option.value) {
                option.selected = true;
            }

            input.appendChild(option);

        });

    }

    // ===============================
    // INPUT NORMAL (LO QUE YA TENÍAS)
    // ===============================

    else {

        input = document.createElement("input");

        input.id = "express-input";
        input.value = formData[fieldName] || "";

        // 🔥 tipo dinámico desde BD
        const inputType = field.customer_capture_settings_input_type;
        
        if (inputType  === "tel") {
            input.type = "tel";
            input.inputMode = "numeric";
            input.placeholder = "+56 9 1234 5678";
        }
        else if (inputType === "email") {
            input.type = "email";
            input.placeholder = "email@email.com";
        }
        else if (inputType === "date") {
            input.type = "text";
            input.inputMode = "numeric";
            input.placeholder = "DD MM AAAA";
            input.maxLength = 10;
        }
        else if (inputType === "identifier") {
            input.type = "text";
            input.placeholder = "12345678-9";
        }
        else {
            input.type = "text";
        }

        input.addEventListener("input", (e) => {

            clearFieldError();

            e.target.value = formatFieldValue(
                fieldName,
                e.target.value
            );

        });

        input.addEventListener("keydown", (e) => {

            if (e.key === "Enter") {

                e.preventDefault();

                if (!validateCurrentField()) return;

                saveCurrentField();

                if (currentStep < fields.length - 1) {
                    nextStep();
                } else {
                    saveForm();
                }

            }

        });

    }

    container.appendChild(input);

    input.focus();

}


// ===============================
// PROGRESS
// ===============================

function updateProgress() {

    const progress = document.getElementById("express-progress");

    progress.innerText =
        `${t("step_label")} ${currentStep + 1} ${t("step_of")} ${fields.length}`;

}

// ===============================
// BUTTONS
// ===============================

function updateButtons() {

    const backBtn = document.getElementById("express-btn-back");
    const nextBtn = document.getElementById("express-btn-next");
    const saveBtn = document.getElementById("express-btn-save");

    backBtn.style.display = currentStep > 0 ? "inline-block" : "none";

    if (currentStep === fields.length - 1) {

        nextBtn.style.display = "none";
        saveBtn.style.display = "inline-block";

        saveBtn.innerText = t("action_save");   // ← ESTA LÍNEA FALTABA

    } else {

        nextBtn.style.display = "inline-block";
        saveBtn.style.display = "none";

        nextBtn.innerText = t("action_continue");

    }

}

function showSaveButton() {

    document.getElementById("express-btn-next").style.display = "none";
    document.getElementById("express-btn-save").style.display = "inline-block";

}

// ===============================
// SAVE FORM
// ===============================

async function saveForm() {

    saveCurrentField();

    const saveBtn = document.getElementById("express-btn-save");

    saveBtn.disabled = true;
    saveBtn.innerText = t("label_validating");

    try {

        const response = await fetch(`${API_BASE}/customers-express/${token}`, {

            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)

        });

        if (!response.ok) {

            handleServerError(await response.json());

            saveBtn.disabled = false;
            saveBtn.innerText = t("action_save");

            return;

        }

        localStorage.removeItem(STORAGE_KEY);

        showSuccess();

    } catch {

        showError("msg_connection_lost");

        saveBtn.disabled = false;
        saveBtn.innerText = t("action_save");

    }

}

// ===============================
// SERVER ERRORS
// ===============================

function handleServerError(error) {

    if (!error || !error.detail) {
        showError("msg_connection_lost");
        return;
    }

    if (error.detail === "invalid_link") {
        showError("msg_invalid_link");
        return;
    }

    if (error.detail === "expired_link") {
        showError("msg_expired_link");
        return;
    }

    if (error.detail === "form_completed") {
        showError("msg_form_completed");
        return;
    }

    if (error.detail === "invalid_email") {
        showFieldError("error_invalid_email");
        return;
    }

    if (error.detail === "invalid_rut") {
        showFieldError("error_invalid_rut");
        return;
    }

    if (error.detail === "invalid_identifier") {
        showFieldError("error_invalid_identifier");
        return;
    }

    if (error.detail === "invalid_birth_date") {
        showFieldError("error_required_field");
        return;
    }

    if (error.detail.startsWith("missing_field:")) {
        showFieldError("error_required_field");
        return;
    }

    showError("msg_connection_lost");

}

// ===============================
// FIELD ERRORS
// ===============================

function showFieldError(messageKey) {

    const input = document.getElementById("express-input");
    const error = document.getElementById("express-error");

    input.classList.add("input-invalid");

    error.innerText = t(messageKey);
    error.classList.add("active");

}

function clearFieldError() {

    const input = document.getElementById("express-input");
    const error = document.getElementById("express-error");

    input.classList.remove("input-invalid");

    error.innerText = "";
    error.classList.remove("active");

}

// ===============================
// FORMAT FIELD
// ===============================

function formatFieldValue(fieldName, value) {

    if (fieldName === "mobile") {

        value = value.replace(/\D/g, "");

        if (value.startsWith("56")) return "+" + value;

        if (value.length === 9) return "+56" + value;

        return "+" + value;

    }

    if (fieldName === "identifier") {

        value = value.replace(/[^0-9kK]/g, "");

        if (value.length > 1) {

            const body = value.slice(0, -1);
            const dv = value.slice(-1);

            return body + "-" + dv;

        }

        return value;

    }

    if (fieldName === "birth_date") {

        value = value.replace(/\D/g, "");

        if (value.length > 2)
            value = value.slice(0,2) + " " + value.slice(2);

        if (value.length > 5)
            value = value.slice(0,5) + " " + value.slice(5);

        return value.slice(0,10);

    }

    return value;

}

// ===============================
// VALIDATION
// ===============================

function validateCurrentField() {

    const field = fields[currentStep];
    const fieldName = field.customer_capture_settings_field;
    const required = field.customer_capture_settings_is_required;

    const input = document.getElementById("express-input");
    const value = input.value.trim();

    if (required && !value) {
        showFieldError("error_required_field");
        return false;
    }

    if (fieldName === "email" && value && !value.includes("@")) {
        showFieldError("error_invalid_email");
        return false;
    }

    if (fieldName === "mobile" && value.length < 8) {
        showFieldError("error_invalid_phone");
        return false;
    }

    if (fieldName === "identifier" && value && !value.includes("-")) {
        showFieldError("error_invalid_identifier");
        return false;
    }

    return true;

}
