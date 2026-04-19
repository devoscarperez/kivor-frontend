// ===== KIVOR LANGUAGE SYSTEM =====

const translations = {
es: {
  username: "Usuario",
  password: "Clave",
  login: "Entrar",
  login_button: "Continuar",
  back: "Volver",
  invalid_user: "Usuario no válido",
  invalid_credentials: "Credenciales incorrectas",
  tagline: "Gestiona tu salón como empresa",
  btn_username: "Continuar",
  label_validating: "Validando...",

  // NUEVAS CLAVES
  action_continue: "Continuar",
  action_save: "Guardar",
  action_retry: "Intentar nuevamente",
  action_back: "Volver",

  field_first_name: "Nombre",
  field_last_name: "Apellido",
  field_nickname: "Nickname",
  field_mobile: "Celular",
  field_identifier_type: "Tipo de identificación",
  field_identifier: "Identificación",
  field_email: "Correo electrónico",
  field_birth_date: "Fecha de cumpleaños",

  msg_intro_customer_data: "Para poder agendar tu atención necesitamos registrar algunos datos. Este formulario toma menos de un minuto.",
  msg_success_saved: "¡Gracias! Tus datos fueron registrados correctamente.",
  msg_privacy_notice: "Tus datos se utilizarán únicamente para gestionar tu atención y contacto con el salón.",

  error_required_field: "Este campo es obligatorio",
  error_invalid_email: "Correo electrónico no válido",
  error_invalid_phone: "Número de celular no válido",
  error_invalid_identifier: "Identificación no válida",
  error_invalid_rut: "RUT no válido",

  // ===== USERS FLOW =====
  msg_confirm_create_user: "¿Crear usuario? (s/n)",
  msg_processing: "Procesando...",
  msg_error_generic: "Error al crear usuario",
  msg_user_created: "Usuario creado correctamente",
  msg_operation_cancelled: "Operación cancelada",
  msg_username_exists: "El usuario ya existe",

  // ===== USER FIELDS =====
  field_user_name: "Usuario",
  field_user_password_hash: "Clave",
  field_user_first_name: "Nombre",
  field_user_last_name: "Apellido",
  field_user_nick_name: "Alias",
  field_user_group_id: "Grupo",

  step_label: "Paso",
  step_of: "de"
},

en: {
  username: "User",
  password: "Password",
  login: "Login",
  login_button: "Continue",
  back: "Back",
  invalid_user: "Invalid user",
  invalid_credentials: "Invalid credentials",
  tagline: "Manage your salon like a business",
  btn_username: "Continue",
  label_validating: "Validating...",

  // NUEVAS CLAVES
  action_continue: "Continue",
  action_save: "Save",
  action_retry: "Try again",
  action_back: "Back",

  field_first_name: "First name",
  field_last_name: "Last name",
  field_nickname: "Nickname",
  field_mobile: "Mobile phone",
  field_identifier_type: "Identification type",
  field_identifier: "Identification",
  field_email: "Email",
  field_birth_date: "Birth date",

  msg_intro_customer_data: "To schedule your appointment we need to register some basic information. This form takes less than one minute.",
  msg_success_saved: "Thank you! Your information has been registered successfully.",
  msg_privacy_notice: "Your data will only be used to manage your appointment and contact with the salon.",

  error_required_field: "This field is required",
  error_invalid_email: "Invalid email address",
  error_invalid_phone: "Invalid phone number",
  error_invalid_identifier: "Invalid identification",
  error_invalid_rut: "Invalid RUT",

  // ===== USERS FLOW =====
  msg_confirm_create_user: "Create user? (y/n)",
  msg_processing: "Processing...",
  msg_error_generic: "Error creating user",
  msg_user_created: "User created successfully",
  msg_operation_cancelled: "Operation cancelled",
  msg_username_exists: "User already exists",

  // ===== USER FIELDS =====
  field_user_name: "User",
  field_user_password: "Password",
  field_user_firstname: "First name",
  field_user_lastname: "Last name",
  field_user_nickname: "Nickname",
  field_user_group_id: "Group",

  

  step_label: "Step",
  step_of: "of"
}
};

// 🔥 Idioma actual (mañana solo cambias esto)
let currentLang = "es";

function t(key) {
  return translations[currentLang][key] || key;
}
