/**
 * medicamentos.js — Lógica de registro de medicamentos SEMED
 * Depende de: localStorage["semed_usuario"] con { nombre, area, email }
 */

document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://127.0.0.1:5000";
    const formMedicamento = document.getElementById("card");
    const btnSubmit = formMedicamento?.querySelector("button[type='submit']");

    // ── Verificar sesión activa ───────────────────────────────────────────────
    const sesion = JSON.parse(localStorage.getItem("semed_usuario") || "null");
    if (!sesion || !sesion.email) {
        alert("Sesión no encontrada. Por favor inicia sesión.");
        window.location.href = "./index.html";
        return;
    }

    // ── Utilidades UI ─────────────────────────────────────────────────────────

    function setBtnLoading(loading) {
        if (!btnSubmit) return;
        btnSubmit.disabled = loading;
        btnSubmit.textContent = loading
            ? "⏳ Registrando..."
            : "💊 Registrar medicamento 💊";
        btnSubmit.style.opacity = loading ? "0.6" : "1";
    }

    // ── Validación de fecha ───────────────────────────────────────────────────

    function validarFecha(fechaStr) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fecha = new Date(fechaStr + "T00:00:00"); // evita desfase de zona horaria
        if (fecha < hoy) {
            return "La fecha de vencimiento no puede ser anterior a hoy.";
        }
        return null;
    }

    // ── Envío del formulario ──────────────────────────────────────────────────

    if (formMedicamento) {
        formMedicamento.addEventListener("submit", async (e) => {
            e.preventDefault();

            const datosMedicamento = {
                // ✅ email del usuario en sesión para vincular el medicamento
                email_usuario:     sesion.email,
                nombre:            document.getElementById("nombre").value.trim(),
                lote:              document.getElementById("lote").value.trim(),
                presentacion:      document.getElementById("presentacion").value.trim(),
                cantidad:          document.getElementById("cantidad").value,
                laboratorio:       document.getElementById("laboratorio").value.trim(),
                registro_invima:   document.getElementById("registro_invima").value.trim(),
                fecha_vencimiento: document.getElementById("fecha_vencimiento").value,
            };

            // Validación de fecha en el cliente
            const errorFecha = validarFecha(datosMedicamento.fecha_vencimiento);
            if (errorFecha) {
                alert("⚠️ " + errorFecha);
                return;
            }

            setBtnLoading(true);

            try {
                const response = await fetch(`${API_URL}/registrar_medicamento`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(datosMedicamento),
                });

                const data = await response.json();

                if (response.ok) {
                    alert("✅ " + data.mensaje);
                    formMedicamento.reset();
                    window.location.href = "./dashboard.html";
                } else {
                    alert("❌ Error al registrar: " + (data.error || "Error desconocido"));
                }
            } catch (error) {
                console.error("Error en la conexión:", error);
                alert(
                    "🔌 No se pudo conectar con el servidor.\n" +
                    "Asegúrate de que el backend (app.py) está corriendo en http://127.0.0.1:5000"
                );
            } finally {
                setBtnLoading(false);
            }
        });
    } else {
        console.error("[medicamentos.js] No se encontró el formulario con id='card'");
    }
});