const seguro = document.querySelector(".colseguro");
const atencion = document.querySelector(".colatencion");
const critico = document.querySelector(".colcritico");

const medicamentos = [
  [
    {
      id: 1,
      nombre: "Sertralina",
      lote: "09",
      presentacion: "50mg - Tabletas",
      cantidad: "2000 unds",
      registro: "2021M-0001992-R2",
      laboratorio: "Genfar",
      fecha: "12/08/2026",
    },
    {
      id: 2,
      nombre: "Metformina",
      lote: "27",
      presentacion: "Suspensión",
      cantidad: "1500 unds",
      registro: "12008M-0008511",
      laboratorio: "Genfar",
      fecha: "20/09/2026",
    },
  ],
  [
    {
      id: 3,
      nombre: "Paracetamol",
      lote: "21",
      presentacion: "500mg- Tabletas",
      cantidad: "500 unds",
      registro: "2023M-0017613-R1",
      laboratorio: "Genfar",
      fecha: "20/03/2026",
    },
  ],
  [
    {
      id: 4,
      nombre: "Insulina",
      lote: "05",
      presentacion: "10ml- Inyección",
      cantidad: "100 unds",
      registro: "2022DM-0025145",
      laboratorio: "Genfar",
      fecha: "13/03/2026",
    },
  ],
];

const cardSeguro = medicamentos[0]
  .map(
    (m) => `
    <div class="card" draggable="true">
      <h4>${m.nombre}</h4>
      <h6>lote: ${m.lote}</h6>
      <p>presentación: ${m.presentacion}</p>
      <p>cantidad: ${m.cantidad}</p>
      <h4>registro: ${m.registro}</h4>
      <p>Laboratorio: ${m.laboratorio}</p>
      <p class="fecha">Vence: ${m.fecha}</p>
    </div>
  `,
  )
  .join("");

const cardAtencion = medicamentos[1]
  .map(
    (m) => `
    <div class="card" draggable="true">
      <h4>${m.nombre}</h4>
      <h6>lote: ${m.lote}</h6>
      <p>presentación: ${m.presentacion}</p>
      <p>cantidad: ${m.cantidad}</p>
      <h4>registro: ${m.registro}</h4>
      <p>Laboratorio: ${m.laboratorio}</p>
      <p class="fecha">Vence: ${m.fecha}</p>
    </div>
  `,
  )
  .join("");

const cardCritico = medicamentos[2]
  .map(
    (m) => `
    <div class="card" draggable="true">
      <h4>${m.nombre}</h4>
      <h6>lote: ${m.lote}</h6>
      <p>presentación: ${m.presentacion}</p>
      <p>cantidad: ${m.cantidad}</p>
      <h4>registro: ${m.registro}</h4>
      <p>Laboratorio: ${m.laboratorio}</p>
      <p class="fecha">Vence: ${m.fecha}</p>
    </div>
  `,
  )
  .join("");

seguro.insertAdjacentHTML("beforeend", cardSeguro);
atencion.insertAdjacentHTML("beforeend", cardAtencion);
critico.insertAdjacentHTML("beforeend", cardCritico);

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
