// ===== KIVOR LANGUAGE SYSTEM =====

const translations = {
  es: {
    username: "Usuario",
    password: "Clave",
    login: "Entrar",
    back: "Volver",
    invalid_user: "Usuario no válido",
    invalid_credentials: "Credenciales incorrectas",
    tagline: "Plataforma de gestión profesional"
  },
  en: {
    username: "User",
    password: "Password",
    login: "Login",
    back: "Back",
    invalid_user: "Invalid user",
    invalid_credentials: "Invalid credentials",
    tagline: "Professional management platform"
  }
};

// 🔥 Idioma actual (mañana solo cambias esto)
let currentLang = "en";

function t(key) {
  return translations[currentLang][key] || key;
}
