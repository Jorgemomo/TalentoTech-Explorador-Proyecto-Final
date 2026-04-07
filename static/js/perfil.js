/**
 * perfil.js — Lógica de configuración de perfil SEMED
 * Depende de: localStorage["semed_usuario"] con { nombre, area, email }
 */

const API_URL = "http://127.0.0.1:5000";

// ── Utilidades ────────────────────────────────────────────────────────────────

/** Muestra un toast de notificación */
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  const toastIcon = document.getElementById("toastIcon");

  toastMsg.textContent = msg;
  toastIcon.textContent = type === "success" ? "✔" : "✖";
  toast.className = `show ${type}`;

  setTimeout(() => {
    toast.className = "";
  }, 3500);
}

/** Muestra / oculta el overlay de carga */
function setLoading(visible) {
  document.getElementById("loadingOverlay").classList.toggle("active", visible);
}

/** Deshabilita un botón mientras espera */
function setBtnLoading(btn, loading) {
  btn.disabled = loading;
  btn.style.opacity = loading ? ".6" : "1";
}

// ── Sesión ────────────────────────────────────────────────────────────────────

const sesion = JSON.parse(localStorage.getItem("semed_usuario") || "null");

if (!sesion || !sesion.email) {
  // Si no hay sesión activa, redirigir al login
  alert("Sesión no encontrada. Por favor inicia sesión.");
  window.location.href = "./index.html";
}

// ── Avatar por defecto (SVG inline en base64) ─────────────────────────────────

const AVATAR_DEFAULT =
  "data:image/svg+xml;base64," +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#dde5e3"/>
    <circle cx="50" cy="38" r="18" fill="#8fa39f"/>
    <ellipse cx="50" cy="85" rx="28" ry="22" fill="#8fa39f"/>
  </svg>`);

// ── Cargar perfil desde el servidor ───────────────────────────────────────────

async function cargarPerfil() {
  setLoading(true);
  try {
    const res = await fetch(
      `${API_URL}/perfil?email=${encodeURIComponent(sesion.email)}`,
    );
    if (!res.ok) throw new Error("No se pudo cargar el perfil");
    const { usuario } = await res.json();

    // Sidebar
    document.getElementById("sidebarNombre").textContent =
      [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || "—";
    document.getElementById("sidebarArea").textContent = usuario.area || "—";
    document.getElementById("sidebarEmail").textContent = usuario.email;
    document.getElementById("statTelefono").textContent =
      usuario.telefono || "—";
    document.getElementById("statUbicacion").textContent =
      usuario.ubicacion || "—";

    // Avatar
    document.getElementById("avatarPreview").src =
      usuario.foto_perfil || AVATAR_DEFAULT;

    // Formulario datos básicos
    document.getElementById("nombre").value = usuario.nombre || "";
    document.getElementById("apellido").value = usuario.apellido || "";
    document.getElementById("telefono").value = usuario.telefono || "";
    document.getElementById("ubicacion").value = usuario.ubicacion || "";
    document.getElementById("descripcion").value = usuario.descripcion || "";

    // Formulario email
    document.getElementById("emailActual").value = usuario.email;
  } catch (err) {
    showToast("Error cargando el perfil", "error");
    console.error(err);
  } finally {
    setLoading(false);
  }
}

// ── Cambio de foto de perfil ──────────────────────────────────────────────────

document.getElementById("avatarWrapper").addEventListener("click", () => {
  document.getElementById("foto-input").click();
});

document.getElementById("foto-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Vista previa inmediata
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById("avatarPreview").src = ev.target.result;
  };
  reader.readAsDataURL(file);

  // Convertir a base64 y enviar al servidor
  const base64 = await fileToBase64(file);
  setLoading(true);
  try {
    const res = await fetch(`${API_URL}/perfil/foto`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: sesion.email, foto_perfil: base64 }),
    });
    if (!res.ok) throw new Error();
    showToast("Foto de perfil actualizada ✔");
  } catch {
    showToast("No se pudo guardar la foto", "error");
  } finally {
    setLoading(false);
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // ya incluye el prefijo data:image/...
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Formulario: datos personales ──────────────────────────────────────────────

document.getElementById("formDatos").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btnDatos");
  setBtnLoading(btn, true);

  const payload = {
    email: sesion.email,
    nombre: document.getElementById("nombre").value.trim(),
    apellido: document.getElementById("apellido").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    ubicacion: document.getElementById("ubicacion").value.trim(),
    descripcion: document.getElementById("descripcion").value.trim(),
  };

  try {
    const res = await fetch(`${API_URL}/perfil`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Actualizar localStorage con el nuevo nombre
    sesion.nombre = payload.nombre;
    localStorage.setItem("semed_usuario", JSON.stringify(sesion));

    // Refrescar sidebar
    document.getElementById("sidebarNombre").textContent = [
      payload.nombre,
      payload.apellido,
    ]
      .filter(Boolean)
      .join(" ");
    document.getElementById("statTelefono").textContent =
      payload.telefono || "—";
    document.getElementById("statUbicacion").textContent =
      payload.ubicacion || "—";

    showToast("Datos actualizados correctamente");
  } catch (err) {
    showToast(err.message || "Error guardando datos", "error");
  } finally {
    setBtnLoading(btn, false);
  }
});

// ── Formulario: cambio de correo ──────────────────────────────────────────────

document.getElementById("formEmail").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btnEmail");
  const emailNuevo = document.getElementById("emailNuevo").value.trim();
  const password = document.getElementById("passVerifEmail").value;

  if (emailNuevo === sesion.email) {
    showToast("El correo nuevo es igual al actual", "error");
    return;
  }

  setBtnLoading(btn, true);
  try {
    const res = await fetch(`${API_URL}/perfil/email`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email_actual: sesion.email,
        email_nuevo: emailNuevo,
        password,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Actualizar sesión con el nuevo correo
    sesion.email = emailNuevo;
    localStorage.setItem("semed_usuario", JSON.stringify(sesion));

    document.getElementById("emailActual").value = emailNuevo;
    document.getElementById("emailNuevo").value = "";
    document.getElementById("passVerifEmail").value = "";
    document.getElementById("sidebarEmail").textContent = emailNuevo;

    showToast("Correo actualizado correctamente");
  } catch (err) {
    showToast(err.message || "Error actualizando correo", "error");
  } finally {
    setBtnLoading(btn, false);
  }
});

// ── Formulario: cambio de contraseña ──────────────────────────────────────────

const passNueva = document.getElementById("passNueva");
const passStrengthFill = document.getElementById("passStrengthFill");
const passHint = document.getElementById("passHint");

passNueva.addEventListener("input", () => {
  const val = passNueva.value;
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const pct = (score / 4) * 100;
  const colors = ["#c94040", "#e09a2a", "#1a7f6e", "#23a08d"];
  const labels = ["Muy débil", "Débil", "Buena", "Fuerte"];
  passStrengthFill.style.width = pct + "%";
  passStrengthFill.style.background = colors[score - 1] || "#dde5e3";
  passHint.textContent = score > 0 ? labels[score - 1] : "Mínimo 8 caracteres";
});

document
  .getElementById("formPassword")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnPass");

    const passActual = document.getElementById("passActual").value;
    const nuevaPass = passNueva.value;
    const confirm = document.getElementById("passConfirm").value;

    if (nuevaPass !== confirm) {
      showToast("Las contraseñas nuevas no coinciden", "error");
      return;
    }
    if (nuevaPass.length < 8) {
      showToast("La contraseña debe tener al menos 8 caracteres", "error");
      return;
    }

    setBtnLoading(btn, true);
    try {
      const res = await fetch(`${API_URL}/perfil/contrasena`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: sesion.email,
          password_actual: passActual,
          password_nueva: nuevaPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      document.getElementById("passActual").value = "";
      passNueva.value = "";
      document.getElementById("passConfirm").value = "";
      passStrengthFill.style.width = "0";
      passHint.textContent = "Mínimo 8 caracteres";

      showToast("Contraseña actualizada correctamente");
    } catch (err) {
      showToast(err.message || "Error actualizando contraseña", "error");
    } finally {
      setBtnLoading(btn, false);
    }
  });

// ── Init ──────────────────────────────────────────────────────────────────────
cargarPerfil();
