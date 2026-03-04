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
  label_validating: "Validando..."
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
  label_validating: "Validating..."
}
};

// 🔥 Idioma actual (mañana solo cambias esto)
let currentLang = "es";

function t(key) {
  return translations[currentLang][key] || key;
}
