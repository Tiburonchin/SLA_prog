# Documentación Fase 2: Inspecciones y Amonestaciones

## 1. Descripción General

La **Fase 2** empodera la acción en terreno e in-situ al entregar el **Módulo de Inspecciones** (Módulo 3) y el **Módulo de Amonestaciones/Actos Inseguros** (Módulo 4). Introduce un control sofisticado con alta vinculación de datos, soporte de prevención (IDOR) y trazabilidad completa de checklists.

## 2. Módulo de Inspecciones (Trabajos Seguros)

- **Checklist Dinámico:** Basado en la Matriz IPC. Cuando un usuario especifica un _Tipo de Trabajo_ y _Ubicación_, el backend compila dinámicamente un cuestionario (`crearPreguntasDeMatriz()`) integrando Herramientas, EPP, Requisitos o Peligros en un formato de JSON escalable (`datosChecklist: Prisma.JsonValue`).
- **Regulación y Modificaciones:** El estado avanza por un flujo (EN_PROGRESO → COMPLETADA). Solo inspecciones "En progreso" pueden modificarse.
- **Prevención de Vulnerabilidades (IDOR & Validación Cruzada):**
  - Validación estricta que impide que un supervisor cree, edite checklists o cierre una inspección a nombre de otro usuario, verificando rigurosamente que su `usuario.id` coincida con el originador real, cortando de raíz posibles vulnerabilidades Insecure Direct Object Reference (SEC-06 IDOR).
  - Backend comprueba y restringe a nivel de base de datos que todos los trabajadores asignados a la inspección efectivamente operen en la _Sucursal_ seleccionada (Cross-Validation).
- **Firmas y Trazabilidad:** _(Plataforma escalada)_ Arquitectura preparada para aceptar coordenadas Geo-referenciadas y recolección de firmas al momento de ejecutar `/api/inspecciones/:id/cerrar`.

## 3. Módulo de Amonestaciones (Discrecional o Sistémico)

- **Altas Rápidas:** Interfaz de usuario "mobile-first" diseñada en el frontend para ingreso expedito de incidentes.
- **Severidad y Motivo estandarizado:** Formulario encausado con `Leve`, `Grave` o `Critica`, uniendo evidencia (Fotos y testimonios).
- **Filtros e Indexación:** Listados completos accesibles en la administración.
- **Control Lógico Estricto:** Al igual que en Inspecciones, se ejerce control cruzado. Backend se reasegura de que el supervisor autenticado pre-emisor esté _autorizado a fungir en la sucursal implicada en el evento_, impidiendo faltas cruzadas fuera de jurisdicción o suplantaciones IDOR.

## 4. Dashboard Gerencial Operativo Dinámico

- Se modificó profundamente la pantalla base (`PaginaDashboard`) para destituir la información "hard-coded".
- Reemplazo por integraciones en tiempo real: Se ejecutan solicitudes API directas (promesas resueltas de manera optimizada) que listan y alimentan las tarjetas del UI con datos vivos extraídos del backend.
- **Recent Activity Feed:** Despliega una línea de tiempo a la derecha mostrando las últimas intervenciones de amonestaciones, inspecciones y estados de manera visual y clara.

## 5. Evolución del Rendimiento

Se introdujo paralelismo transaccional. La obtención de trabajadores y amonestaciones fue convertida a arquitecturas que responden **Paginado**, con conteos `Promise.all` acoplados, incrementando el performance enormemente a volúmenes masivos. Se prepara la arquitectura del frontend (`PWA / offline-first sync` - Fase Futura).
