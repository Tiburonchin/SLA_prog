---
description: Revisa la accesibilidad, diseño responsivo (Tailwind v4) y preparación PWA (offline) de los componentes frontend.
---

Ejecuta la siguiente auditoría de Interfaz de Usuario (UI), Experiencia (UX) y arquitectura Frontend basándote estrictamente en el enrutamiento de `INDEX_PROYECTO.md`. Trabaja de forma secuencial y no avances al siguiente paso hasta completar el actual:

**Paso 1: Lectura de Requisitos Visuales y Arquitectura**

- **Objetivo:** Comprender las reglas de diseño antes de auditar componentes.
- **Acción:** Lee los archivos `/docs/core/PRD - Sistema de Gestión HSE.md` y `/docs/core/Tech Stack - Sistema HSE.md`.
- **Validación:** Consulta además `/docs/fases/DOC_FASE_2.md` y `frontend/README.md` para alinear tu revisión estricta con la configuración actual de Vite, Tailwind CSS y la integración Frontend-Backend.

**Paso 2: Escaneo de Ergonomía y Tailwind CSS (Mobile-First)**

- **Objetivo:** Garantizar que la app sea operable en condiciones adversas de campo (sol, uso de guantes).
- **Acción:** Inspecciona todos los archivos `.tsx` modificados recientemente en `/frontend/src/components`.
- **Validación:** Comprueba que todos los botones y áreas interactivas tengan clases que garanticen un tamaño mínimo táctil (ej. 44x44px) y alto contraste.
- **Acción Correctiva:** Refactoriza el código aplicando clases de Tailwind CSS inmediatamente si encuentras elementos difíciles de operar.

**Paso 3: Auditoría de Estado Offline (PWA y Zustand)**

- **Objetivo:** Asegurar que las inspecciones en campo no se pierdan si el supervisor se queda sin internet.
- **Acción:** Revisa los stores de Zustand en `/frontend/src/store` y la lógica de peticiones al backend.
- **Validación:** Verifica si los datos críticos (como el Checklist Dinámico IPC) implementan persistencia local.
- **Acción Correctiva:** Si un store crítico carece de persistencia, inyecta el middleware `persist` de Zustand y la lógica de sincronización (Workbox) para solucionarlo.

**Paso 4: Revisión de Flujos Finales (Paginación y Exportación)**

- **Objetivo:** Validar la usabilidad de los dashboards administrativos en escritorio.
- **Acción:** Basado en las directrices de `/docs/fases/DOC_FASE_3.md`, revisa las tablas de datos y paneles de reportes.
- **Validación:** Confirma que existan controles de paginación claros y que los flujos de exportación (PDF/CSV) estén correctamente enlazados en la UI sin romper el diseño.
- **Acción Correctiva:** Añade esqueletos de carga (skeletons) o ajusta la maquetación si la interfaz no cumple con estos flujos estandarizados.

**Paso 5: Consolidación y Registro de UI/UX**

- **Objetivo:** Mantener un historial de las mejoras aplicadas al frontend.
- **Acción:** Escribe un informe técnico detallando los componentes refactorizados, las mejoras de accesibilidad integradas y el estado de madurez de la PWA.
- **Destino Final:** Guarda y crea este archivo en la ruta `/docs/audits/frontend/` con el nombre `UI_Audit_Report_YYYY_MM_DD.md`.
