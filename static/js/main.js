/**
 * main.js — Lógica del dashboard SEMED
 * Carga medicamentos del usuario, los clasifica por estado y los muestra en el kanban.
 * Funcionalidades: buscar, filtrar por categoría, borrar medicamento.
 */

const API_URL = "http://127.0.0.1:5000";

// ── Sesión ────────────────────────────────────────────────────────────────────
const sesion = JSON.parse(localStorage.getItem("semed_usuario") || "null");
if (!sesion || !sesion.email) {
  alert("Sesión no encontrada. Por favor inicia sesión.");
  window.location.href = "./index.html";
}

// ── Estado de la aplicación ───────────────────────────────────────────────────
let todosMedicamentos = []; // lista completa sin filtrar
let filtrosActivos = { seguro: true, atencion: true, critico: true };
let modoBorrado = false;

// ── Umbrales de días (configurables) ─────────────────────────────────────────
const UMBRAL_SEGURO = 30; // más de 30 días → Seguro
const UMBRAL_ATENCION = 5; // entre 5 y 30 días → Atención
// menos de 5 días (o vencido) → Crítico

// ── Clasificación por fecha ───────────────────────────────────────────────────
function diasHastaVencer(fechaStr) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaStr + "T00:00:00");
  return Math.floor((vence - hoy) / (1000 * 60 * 60 * 24));
}

function clasificar(dias) {
  if (dias > UMBRAL_SEGURO) return "seguro";
  if (dias >= UMBRAL_ATENCION) return "atencion";
  return "critico";
}

// ── Formatear fecha ───────────────────────────────────────────────────────────
function formatFecha(fechaStr) {
  const [y, m, d] = fechaStr.split("-");
  return `${d}/${m}/${y}`;
}

// ── Construir una card ────────────────────────────────────────────────────────
function crearCard(med, dias) {
  const div = document.createElement("div");
  div.className = "card";
  div.dataset.id = med.id;

  const vencidoLabel =
    dias < 0
      ? `<span class="badge-vencido">VENCIDO hace ${Math.abs(dias)} día(s)</span>`
      : `<span class="badge-dias">${dias} día(s) restante(s)</span>`;

  div.innerHTML = `
    <div class="card-header">
      <h4>${med.nombre}</h4>
      <button class="btn-borrar-card" title="Eliminar medicamento" data-id="${med.id}">🗑️</button>
    </div>
    <h6>Lote: ${med.lote}</h6>
    <p>${med.presentacion}</p>
    <p><strong>${med.cantidad}</strong> unidades</p>
    <p class="lab">🏭 ${med.laboratorio}</p>
    <p class="invima">INVIMA: ${med.registro_invima}</p>
    <p class="fecha">Vence: ${formatFecha(med.fecha_vencimiento)}</p>
    ${vencidoLabel}
  `;

  // Evento de borrar en la card
  div.querySelector(".btn-borrar-card").addEventListener("click", () => {
    confirmarBorrado(med.id, med.nombre);
  });

  return div;
}

// ── Renderizar kanban ─────────────────────────────────────────────────────────
function renderizarKanban(lista) {
  const colSeguro = document.getElementById("colSeguro");
  const colAtencion = document.getElementById("colAtencion");
  const colCritico = document.getElementById("colCritico");

  // Limpiar solo las cards (mantener el h3)
  [colSeguro, colAtencion, colCritico].forEach((col) => {
    col.querySelectorAll(".card").forEach((c) => c.remove());
    col.querySelector(".empty-msg")?.remove();
  });

  let contadores = { seguro: 0, atencion: 0, critico: 0 };

  lista.forEach((med) => {
    const dias = diasHastaVencer(med.fecha_vencimiento);
    const estado = clasificar(dias);
    const card = crearCard(med, dias);

    if (estado === "seguro") colSeguro.appendChild(card);
    if (estado === "atencion") colAtencion.appendChild(card);
    if (estado === "critico") colCritico.appendChild(card);

    contadores[estado]++;
  });

  // Actualizar contadores en encabezados
  document.getElementById("cntSeguro").textContent = contadores.seguro;
  document.getElementById("cntAtencion").textContent = contadores.atencion;
  document.getElementById("cntCritico").textContent = contadores.critico;

  // Mensajes de columna vacía
  if (contadores.seguro === 0)
    colSeguro.insertAdjacentHTML(
      "beforeend",
      '<p class="empty-msg">Sin medicamentos</p>',
    );
  if (contadores.atencion === 0)
    colAtencion.insertAdjacentHTML(
      "beforeend",
      '<p class="empty-msg">Sin medicamentos</p>',
    );
  if (contadores.critico === 0)
    colCritico.insertAdjacentHTML(
      "beforeend",
      '<p class="empty-msg">Sin medicamentos</p>',
    );

  aplicarFiltros();
}

// ── Carga desde la API ────────────────────────────────────────────────────────
async function cargarMedicamentos() {
  const loadingEl = document.getElementById("kanbanLoading");
  loadingEl.style.display = "block";

  try {
    const res = await fetch(
      `${API_URL}/medicamentos?email=${encodeURIComponent(sesion.email)}`,
    );
    if (!res.ok) throw new Error("Error al cargar medicamentos");
    const data = await res.json();
    todosMedicamentos = data.medicamentos || [];
    renderizarKanban(todosMedicamentos);
  } catch (err) {
    console.error(err);
    document.getElementById("errorMsg").style.display = "block";
  } finally {
    loadingEl.style.display = "none";
  }
}

// ── Búsqueda ──────────────────────────────────────────────────────────────────
function buscar(termino) {
  const t = termino.trim().toLowerCase();
  const filtrados = t
    ? todosMedicamentos.filter((m) => m.nombre.toLowerCase().includes(t))
    : todosMedicamentos;
  renderizarKanban(filtrados);
}

// ── Filtro de columnas ────────────────────────────────────────────────────────
function aplicarFiltros() {
  document
    .getElementById("colSeguro")
    .closest(".col-wrapper-seguro").style.display = filtrosActivos.seguro
    ? ""
    : "none";
  document
    .getElementById("colAtencion")
    .closest(".col-wrapper-atencion").style.display = filtrosActivos.atencion
    ? ""
    : "none";
  document
    .getElementById("colCritico")
    .closest(".col-wrapper-critico").style.display = filtrosActivos.critico
    ? ""
    : "none";
}

// ── Confirmar y ejecutar borrado ──────────────────────────────────────────────
async function confirmarBorrado(id, nombre) {
  if (
    !confirm(
      `¿Eliminar "${nombre}" del inventario?\nEsta acción no se puede deshacer.`,
    )
  )
    return;

  try {
    const res = await fetch(
      `${API_URL}/medicamentos/${id}?email=${encodeURIComponent(sesion.email)}`,
      { method: "DELETE" },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Quitar de la lista local y re-renderizar
    todosMedicamentos = todosMedicamentos.filter((m) => m.id !== id);
    renderizarKanban(todosMedicamentos);
    mostrarToast(`"${nombre}" eliminado correctamente`);
  } catch (err) {
    mostrarToast("Error al eliminar: " + err.message, "error");
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function mostrarToast(msg, tipo = "success") {
  const toast = document.getElementById("dashToast");
  toast.textContent = (tipo === "success" ? "✔ " : "✖ ") + msg;
  toast.className = `dash-toast show ${tipo}`;
  setTimeout(() => {
    toast.className = "dash-toast";
  }, 3500);
}

// ── Modal: Filtrar categorías ─────────────────────────────────────────────────
function abrirModalFiltro() {
  document.getElementById("chkSeguro").checked = filtrosActivos.seguro;
  document.getElementById("chkAtencion").checked = filtrosActivos.atencion;
  document.getElementById("chkCritico").checked = filtrosActivos.critico;
  document.getElementById("modalFiltro").classList.add("open");
}

function cerrarModalFiltro() {
  document.getElementById("modalFiltro").classList.remove("open");
}

function aplicarModalFiltro() {
  filtrosActivos.seguro = document.getElementById("chkSeguro").checked;
  filtrosActivos.atencion = document.getElementById("chkAtencion").checked;
  filtrosActivos.critico = document.getElementById("chkCritico").checked;
  aplicarFiltros();
  cerrarModalFiltro();
}

// ── Modo borrado ──────────────────────────────────────────────────────────────
function toggleModoBorrado() {
  modoBorrado = !modoBorrado;
  document
    .getElementById("bottom")
    .classList.toggle("modo-borrado", modoBorrado);
  const btn = document.getElementById("btnBorrar");
  btn.textContent = modoBorrado
    ? "✖ Cancelar borrado"
    : "🗑️ Borrar medicamento";
  btn.classList.toggle("btn-danger", modoBorrado);
  mostrarToast(
    modoBorrado
      ? "Modo borrado activado: haz clic en 🗑️ en la card que deseas eliminar"
      : "Modo borrado desactivado",
    modoBorrado ? "warning" : "success",
  );
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Mostrar nombre del usuario en el header
  if (sesion) {
    const span = document.getElementById("usuarioNombre");
    if (span) span.textContent = sesion.nombre || sesion.email;
  }

  cargarMedicamentos();

  // Búsqueda
  const inputBuscar = document.getElementById("inputBuscar");
  const btnBuscar = document.getElementById("btnBuscar");

  btnBuscar.addEventListener("click", () => buscar(inputBuscar.value));
  inputBuscar.addEventListener("keydown", (e) => {
    if (e.key === "Enter") buscar(inputBuscar.value);
    if (e.key === "Escape") {
      inputBuscar.value = "";
      buscar("");
    }
  });
  // Búsqueda en tiempo real
  inputBuscar.addEventListener("input", () => buscar(inputBuscar.value));

  // Botón configurar categorías → modal filtro
  document
    .getElementById("btnFiltro")
    .addEventListener("click", abrirModalFiltro);
  document
    .getElementById("btnCerrarFiltro")
    .addEventListener("click", cerrarModalFiltro);
  document
    .getElementById("btnAplicarFiltro")
    .addEventListener("click", aplicarModalFiltro);
  // Cerrar modal al hacer clic fuera
  document.getElementById("modalFiltro").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modalFiltro"))
      cerrarModalFiltro();
  });

  // Botón borrar medicamento → modo borrado
  document
    .getElementById("btnBorrar")
    .addEventListener("click", toggleModoBorrado);
});
