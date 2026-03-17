const seguro = document.querySelector(".colseguro");
const atencion = document.querySelector(".colatencion");
const critico = document.querySelector(".colcritico");
const card = document.querySelectorAll(".card");

let draggedElement = null;

// Guardar cuál elemento se está arrastrando
card.forEach((item) => {
  item.addEventListener("dragstart", (e) => {
    draggedElement = item;
  });
});

// Contenedores: seguro, atencion, critico
[seguro, atencion, critico].forEach((container) => {
  container.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  container.addEventListener("drop", (e) => {
    if (draggedElement) {
      container.appendChild(draggedElement);
      draggedElement = null;
    }
  });
});
