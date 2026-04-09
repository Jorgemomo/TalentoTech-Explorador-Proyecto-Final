# Proyecto SEMED: Semáforo de Vencimiento de Medicamentos

Aplicación web diseñada para ayudar a los usuarios a monitorear la fecha de vencimiento de sus medicamentos mediante un sistema visual tipo **semáforo**, indicando qué tan próximos están a caducar.

## 📖 Descripción del Proyecto

El sistema permite registrar medicamentos y calcular automáticamente el tiempo restante hasta su vencimiento, mostrando un estado visual:

- 🟢 **Verde** → Medicamento vigente
- 🟡 **Amarillo** → Próximo a vencer
- 🔴 **Rojo** → Medicamento vencido o crítico

El objetivo principal es reducir el consumo accidental de medicamentos vencidos y mejorar la gestión doméstica o clínica de los tratamientos.

## 🎯 Objetivos

- Registrar medicamentos y fechas de vencimiento.
- Mostrar alertas visuales automáticas tipo semáforo.
- Proveer una interfaz web simple e intuitiva.
- Permitir trabajo colaborativo mediante Git y GitHub.

## 🛠️ Tecnologías Utilizadas

**Frontend (Interfaz de Usuario):**
- HTML5
- CSS3
- JavaScript Vanilla

**Backend y Base de Datos (Lógica del Servidor):**
- Python
- Flask (Framework web)
- SQLite (Base de datos)

---

## 📂 Estructura del Proyecto

A continuación se describe la organización principal de los archivos para facilitar la navegación a los desarrolladores:

```text
/
├── templates/ # Vistas HTML de la aplicación
│ ├── index.html # Pantalla de inicio de sesión (Login)
│ ├── registro.html # Formulario para usuarios nuevos
│ └── dashboard.html # Panel principal (Semáforo de medicamentos)
├── static/ # Lógica del servidor, estilos y scripts
│ ├── app.py # 🧠 Servidor Backend en Flask (Motor del proyecto)
│ ├── js/ # Scripts de interactividad (auth.js, medicamentos.js)
│ ├── imagenes/ # Recursos gráficos y fondos
│ ├── estilo.css # Hojas de estilo generales
│ └── dashboard.css # Estilos específicos del panel
└── semed.db # Base de datos SQLite (se genera en automático)
