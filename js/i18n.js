// ===== KIVOR LANGUAGE SYSTEM =====

const translations = {
  es: {
    username: "Usuario",
    password: "Clave",
    login: "Entrar",
    login_button: "Continue",
    back: "Volver",
    invalid_user: "Usuario no válido",
    invalid_credentials: "Credenciales incorrectas",
    tagline: "Opera tu salón como empresa"
  },
  en: {
    username: "User",
    password: "Password",
    login: "Login",
    back: "Back",
    invalid_user: "Invalid user",
    invalid_credentials: "Invalid credentials",
    tagline: "Operate your salon like a business",
    continue_button: "Continuar"
  }
};

// 🔥 Idioma actual (mañana solo cambias esto)
let currentLang = "en";

function t(key) {
  return translations[currentLang][key] || key;
}
