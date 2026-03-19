document.addEventListener("DOMContentLoaded", () => {
    // Capturamos el formulario por su ID "card"
    const formMedicamento = document.getElementById("card");

    if (formMedicamento) {
        formMedicamento.addEventListener("submit", (e) => {
            e.preventDefault(); // Evitamos que la página se recargue

            // Capturar los valores de todos los inputs
            const nombre = document.getElementById("nombre").value;
            const lote = document.getElementById("lote").value;
            const presentacion = document.getElementById("presentacion").value;
            const cantidad = document.getElementById("cantidad").value;
            const laboratorio = document.getElementById("laboratorio").value;
            const registro_invima = document.getElementById("registro_invima").value;
            const fecha_vencimiento = document.getElementById("fecha_vencimiento").value;

            // Obtener el inventario actual o crear uno vacío
            let inventario = JSON.parse(localStorage.getItem("semed_medicamentos")) || [];

            // Crear el objeto del nuevo medicamento
            const nuevoMedicamento = {
                id: Date.now(), // Generamos un ID único basado en la fecha actual
                nombre,
                lote,
                presentacion,
                cantidad,
                laboratorio,
                registro_invima,
                fecha_vencimiento
            };

            // Guardar en la "base de datos" temporal
            inventario.push(nuevoMedicamento);
            localStorage.setItem("semed_medicamentos", JSON.stringify(inventario));

            alert("💊 Medicamento registrado con éxito en el inventario.");
            
            // Redirigir de vuelta al panel principal
            window.location.href = "./dashboard.html"; 
        });
    }
});