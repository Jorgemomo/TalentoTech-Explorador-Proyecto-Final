document.addEventListener("DOMContentLoaded", () => {
    const formMedicamento = document.getElementById("card");
    const API_URL = "http://127.0.0.1:5000";

    if (formMedicamento) {
        formMedicamento.addEventListener("submit", async (e) => {
            e.preventDefault(); 

            // Construir el objeto con los datos del formulario
            const datosMedicamento = {
                nombre: document.getElementById("nombre").value,
                lote: document.getElementById("lote").value,
                presentacion: document.getElementById("presentacion").value,
                cantidad: document.getElementById("cantidad").value,
                laboratorio: document.getElementById("laboratorio").value,
                registro_invima: document.getElementById("registro_invima").value,
                fecha_vencimiento: document.getElementById("fecha_vencimiento").value
            };

            try {
                // Enviar petición POST al backend
                const response = await fetch(`${API_URL}/registrar_medicamento`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosMedicamento)
                });

                const data = await response.json();

                if (response.ok) {
                    alert("💊 " + data.mensaje);
                    window.location.href = "./dashboard.html"; 
                } else {
                    alert("Error al registrar: " + data.error);
                }
            } catch (error) {
                console.error("Error en la conexión con la base de datos:", error);
                alert("No se pudo conectar con el servidor de base de datos.");
            }
        });
    }
});