const seguro = document.querySelector(".colseguro");
const atencion = document.querySelector(".colatencion");
const critico = document.querySelector(".colcritico");
const API_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Cargar datos desde la base de datos
    await cargarMedicamentos();
    // 2. Reactivar el Drag & Drop después de crear las tarjetas
    configurarDragAndDrop();
});

async function cargarMedicamentos() {
    try {
        console.log("Intentando conectar con el backend..."); // <-- NUEVO
        
        const response = await fetch(`${API_URL}/medicamentos`);
        const data = await response.json();

        console.log("Datos recibidos de SQLite:", data); // <-- NUEVO

        // Limpiar el contenido previo...
        seguro.innerHTML = '<h3>✔ Seguro</h3>';
        atencion.innerHTML = '<h3>⚠ Atención</h3>';
        critico.innerHTML = '<h3>❌ Crítico</h3>';

        const hoy = new Date();
        // Normalizamos la hora a la medianoche para cálculos exactos
        hoy.setHours(0, 0, 0, 0); 

        data.forEach(m => {
            // Calcular diferencia en días
            const fechaVencimiento = new Date(m.fecha_vencimiento);
            // Sumamos un día a la fecha de vencimiento para compensar la zona horaria al convertir desde texto
            fechaVencimiento.setDate(fechaVencimiento.getDate() + 1); 
            fechaVencimiento.setHours(0, 0, 0, 0);

            const diferenciaTiempo = fechaVencimiento.getTime() - hoy.getTime();
            const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));

            // Generar la tarjeta HTML
            const cardHTML = `
                <div class="card" draggable="true">
                    <h4>${m.nombre}</h4>
                    <h6>Lote: ${m.lote}</h6>
                    <p>Presentación: ${m.presentacion}</p>
                    <p>Cantidad: ${m.cantidad}</p>
                    <h4>Registro: ${m.registro_invima}</h4>
                    <p>Laboratorio: ${m.laboratorio}</p>
                    <p class="fecha">Vence: ${m.fecha_vencimiento} (Faltan ${diasRestantes} días)</p>
                </div>
            `;

            // Clasificación por etapas según tu semáforo (>30 verde, 5-30 amarillo, <5 rojo)
            if (diasRestantes > 30) {
                seguro.insertAdjacentHTML("beforeend", cardHTML);
            } else if (diasRestantes >= 5 && diasRestantes <= 30) {
                atencion.insertAdjacentHTML("beforeend", cardHTML);
            } else {
                critico.insertAdjacentHTML("beforeend", cardHTML);
            }
        });

    } catch (error) {
        console.error("Error cargando el inventario:", error);
    }
}

function configurarDragAndDrop() {
    const cards = document.querySelectorAll(".card");
    let draggedElement = null;

    cards.forEach((item) => {
        item.addEventListener("dragstart", () => {
            draggedElement = item;
        });
    });

    [seguro, atencion, critico].forEach((container) => {
        container.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        container.addEventListener("drop", () => {
            if (draggedElement) {
                container.appendChild(draggedElement);
                draggedElement = null;
            }
        });
    });
}