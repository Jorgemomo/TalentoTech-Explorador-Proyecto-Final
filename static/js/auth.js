document.addEventListener("DOMContentLoaded", () => {
  const formRegistro = document.getElementById("formRegistro");
  const formLogin = document.getElementById("formLogin");

  // URL de nuestra API en Python
  const API_URL = "http://127.0.0.1:5000";

  // ==========================================
  // 1. LÓGICA DE REGISTRO
  // ==========================================
  if (formRegistro) {
    formRegistro.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("nombre").value;
      const email = document.getElementById("email").value;
      const telefono = document.getElementById("telefono").value;
      const area = document.getElementById("area").value;
      const password = document.getElementById("pass").value;
      const confirmPass = document.getElementById("confirm_pass").value;

      if (password !== confirmPass) {
        alert("Las contraseñas no coinciden.");
        return;
      }

      // Petición HTTP POST al backend
      try {
        const response = await fetch(`${API_URL}/registro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, email, telefono, area, password }),
        });

        const data = await response.json();

        if (response.ok) {
          alert("Registro exitoso en la base de datos.");
          window.location.href = "./index.html";
        } else {
          alert("Error: " + data.error);
        }
      } catch (error) {
        console.error("Error en la conexión:", error);
        alert("No se pudo conectar con el servidor de base de datos.");
      }
    });
  }

  // ==========================================
  // 2. LÓGICA DE INICIO DE SESIÓN
  // ==========================================
  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Guardamos solo la info básica de la sesión en localStorage, no la contraseña
          localStorage.setItem("semed_usuario", JSON.stringify(data.usuario));
          window.location.href = "./dashboard.html";
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error("Error en la conexión:", error);
        alert("No se pudo conectar con el servidor.");
      }
    });
  }
});
