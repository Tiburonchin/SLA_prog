# Documentación de Módulo: Trabajadores

**Ubicación:** `/frontend/src/pages/trabajadores/`
**Estado Actual:** Estable / Implementado V1

---

## 1. Misión del Módulo dentro de la Visión HSE

El módulo **Trabajadores** es el motor central del "Expediente 360°". Cumple con el rol fundamental de mantener un perfil digital inmutable de todos los operarios y contratistas del sistema. Este módulo fue construido para que el Supervisor de campo o el Coordinador HSE en oficina tengan acceso inmediato a la información médica de emergencia, las tallas de EPP necesarias, métricas de capacitaciones y el historial de amonestaciones de una persona (ya sea buscando vía barra de herramientas o a través del Código QR dinámico asignado a su fotocheck).

## 2. Flujo de Arquitectura y Componentes Clave

### 2.1 Tablero Maestro de Trabajadores (`PaginaTrabajadores.tsx`)

- **Descripción:** Es la vista principal (Tabla de Datos + KPIs).
- **Funcionalidades Clave:**
  - **KPIs Superiores:** Tarjetas dinámicas indicando total de operarios, total sin entrega de EPPs, volumen de capacitaciones e histórico global de amonestaciones disciplinarias.
  - **Barra de Búsqueda y Filtros:** Búsqueda reactiva por DNI o Nombre con filtro complementario de sucursal.
  - **Paginación Robusta:** Permite la carga estructurada de los listados grandes en el _viewport_ usando una ventana paginadora flotante optimizada sin re-renderizar los encabezados principales (previniendo efecto fantasma).

### 2.2 Expediente Digital Individual (`PaginaDetalleTrabajador.tsx`)

- **Descripción:** Sub-ruta `/trabajadores/:id` para la inspección detallada.
- **Distribución Estructural:**
  - **Left Col (Columna Izquierda - Tarjeta de Perfil):** Contiene la fotografía real, botón para ver/exportar el código QR asignado, y medallas operativas (accesos críticos en Verde o Rojo).
  - **Right Col (Columna Central - Layout en Pestañas):** Permite navegar sin recargas entre contextos del trabajador.
- **Pestañas (Tabs) Implementadas:**
  1. **Info General:** Consolidado laboral (cargo, fechas, turno), parámetros médicos de contacto urgente, y un visor tipo _Grid-Card_ para las tallas precisas de **EPP (Casco, Guantes, Calzado, Camisa)**.
  2. **Entregas (EPP):** Bitácora inmutable de recepciones de equipos con evidencias o vencimientos (historial).
  3. **Capacitaciones:** Base de datos de entrenamientos formativos (cursos o charlas previas).
  4. **Historial (Amonestaciones):** Tarjetas críticas tipo "Timeline" con evidencias en caso de incidentes o faltas cometidas.
  5. **Inspecciones:** Vínculo cruzado entre el empleado y auditorías de campo en el lugar.
  6. **Documentos:** (Reciente inclusión) Espacio asincrónico para alojar contratos PDF u otra legalidad estática adherida a su ficha.

## 3. Registro de Modificaciones Técnicas Recientes

Como custodios del proyecto, registramos las configuraciones que refinaron el producto:

- **Rediseño Visual EPP:** Reemplazo de la estructura de tablas obsoleta por un formato interactivo _Card-Grid_, añadiendo íconos visuales (Lucide-icons) a la talla de equipos, economizando notablemente la densidad vertical sin sacrificar contraste (reglas _hse-ui v4_).
- **Ajuste de Alturas Relativas:** Compresión algorítmica de padding/margins sobre el contenedor principal (`space-y-4` y optimización en grillas de datos personales) reduciendo exigencias excesivas de _scroll_ en resoluciones _desktop_.
- **Parche Estado "Data Fantasma":** Inserción de un sistema `skeleton-loader` y aislamiento en el ciclo de hidratación sobre la tabla maestro para mantener siempre dibujado en pantalla las cabeceras y evitar re-montaje blanco durante la paginación de la base de datos de PostgreSQL.
- **Supresión de "Feature Creep" (Desactivar):** Ocultación estratégica y destierro de la lógica `manejarDesactivar` de UI. Esta decisión fue resguardada por documentación oficial (PRD) dado que los permisos para invalidar históricamente un empleado exigen una política de borrado lógico más compleja para no arrancar de raíz el soporte legal en caso de auditorías HSE previas.

## 4. Notas de TSDoc (Regla HSE-DOCS)

El equipo de desarrollo ha documentado orgánicamente estos archivos mediante `JSDoc/TSDoc`, comentando la abstracción de compresión de imágenes y las variables de UI interactivas directamente antes de la definición de los componentes maestros funcionales (e.g., `comprimirImagen`, interfaces auxiliares de formulario y dependencias offline Zustand).

---

## 5. Manejo de Errores y Casos Extremos (Edge Cases)

Esta sección documenta los comportamientos del módulo ante condiciones límite comprobadas durante el Sprint Estabilización (Fase 3.1 — 2026-03-06). Cada ítem describe la condición, la respuesta del sistema y la capa que aplica la protección.

### 5.1 Capa de API / Backend (NestJS)

| Condición | Respuesta | Capa |
| :-------- | :-------- | :--- |
| `GET /trabajadores/:id` con UUID inexistente | `404 Not Found` — `PrismaExceptionFilter` atrapa `P2025` y devuelve `{ statusCode: 404, message: 'Registro no encontrado' }` | `PrismaExceptionFilter` (global) |
| `POST /trabajadores` con `dni` duplicado | `409 Conflict` — `PrismaExceptionFilter` atrapa `P2002` y devuelve `{ statusCode: 409, message: 'Ya existe un registro con ese valor único' }` | `PrismaExceptionFilter` (global) |
| Payload con campo desconocido (ej. `"hackerField": true`) | `400 Bad Request` — `ValidationPipe` con `forbidNonWhitelisted: true` rechaza el payload antes de alcanzar el servicio | `ValidationPipe` (global) |
| Rol `JEFATURA` intenta `DELETE /trabajadores/:id` | `403 Forbidden` — `RolesGuard` valida el decorator `@Roles('COORDINADOR')` | `RolesGuard` |
| `POST /incidentes/rapido` con `trabajadorId` de un trabajador con `estadoLaboral: 'CESADO'` | `400 Bad Request` — `IncidentesService.reporteRapido()` valida `activo && estadoLaboral !== 'CESADO'` explícitamente antes de persistir | `IncidentesService` (lógica de negocio) |
| FK de `sucursalId` inexistente en `POST /trabajadores` | `400 Bad Request` — `PrismaExceptionFilter` atrapa `P2003` (FK violation) | `PrismaExceptionFilter` (global) |

### 5.2 Casos de Estado Nulo (Frontend)

| Condición | Comportamiento en UI |
| :-------- | :------------------- |
| `emoFecha` es `null` o `undefined` | Función `diasHasta()` retorna `null`; el badge de estado EMO muestra `—` en lugar de un número de días. No lanza `NaN`. |
| `foto` del trabajador es `null` | El componente de imagen muestra un avatar placeholder SVG inline. No lanza error de `<img src={null}>`. |
| Respuesta del servidor tarda > 2s | Skeleton loaders permanecen visibles durante el fetch. La tabla no muestra filas vacías ni estado blanco. |
| Fallo de red en la carga de trabajadores | El estado de Zustand queda en `isLoading: false, error: 'Error de conexión'`; la UI muestra el componente `OfflineFallback`. |
| Paginación más allá del total registros | El servicio backend normaliza la página al máximo válido vía `Math.min(page, totalPages)`; el frontend no navega a una página vacía. |

### 5.3 Consideraciones de Borrado Lógico (Soft-Delete)

- El trabajador nunca se **elimina físicamente** de la base de datos (`deletedAt` pattern con `@SoftDelete`).
- `GET /trabajadores` filtra automáticamente `deletedAt IS NOT NULL` vía Prisma middleware global.
- Un trabajador con `deletedAt` activo no puede ser vinculado a nuevas inspecciones, amonestaciones ni incidentes; la validación ocurre en la capa de servicio de cada módulo dependiente.
- El historial de inspecciones previas a la desactivación permanece **intacto e inmutable** para garantizar la trazabilidad ante auditorías SUNAFIL.

