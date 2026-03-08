# Documentación de Módulo: Equipos & Mantenimiento

**Ubicación Backend:** `/backend/src/modules/equipos/` y `/backend/src/modules/mantenimientos/`  
**Ubicación Frontend:** `/frontend/src/pages/equipos/`  
**Estado Actual:** Estable / Implementado v1 — _(Sprint Equipos 3.2 — 2026-03-07)_

---

## 1. Misión del Módulo dentro de la Visión HSE

El módulo **Equipos & Mantenimiento** es el registro vivo de todos los activos físicos críticos de la operación. Cumple el mandato legal del **DS 005-2012-TR (Art. 26)** y la **Ley 29783** al mantener un dossier digital auditado de cada máquina, herramienta o instrumento: su ciclo de vida, historial de calibraciones (norma NTP-ISO/IEC 17025 / INACAL), mantenimientos (preventivos y correctivos), autorizaciones de operadores y ejecuciones del procedimiento LOTO (**OSHA 1910.147**).

La lógica de bloqueo automático garantiza que un equipo con certificación vencida o en proceso de mantenimiento **no pueda operar sin autorización explícita**, previniendo accidentes por activos fuera de condición.

---

## 2. Flujo de Arquitectura y Componentes Clave

### 2.1 Tablero Maestro de Equipos (`PaginaEquipos.tsx`)

- **Descripción:** Vista principal con tabla de equipos, KPIs superiores y filtros reactivos.
- **Funcionalidades Clave:**
  - **Búsqueda reactiva** por nombre, número de serie o marca.
  - **Filtro por estado:** `OPERATIVO`, `EN_MANTENIMIENTO`, `BLOQUEADO_CERTIFICADO`, `BLOQUEADO_INSPECCION`, `BAJA_TECNICA`.
  - **Badge de estado de calibración** en cada fila, mostrando días hasta vencimiento.
  - **Indicador LOTO** en equipos que requieren procedimiento de Bloqueo y Etiquetado.

### 2.2 Expediente Digital de Equipo (`PaginaDetalleEquipo.tsx`)

- **Descripción:** Sub-ruta `/equipos/:id` para inspección completa del activo.
- **Pestañas (Tabs) Implementadas:**
  1. **General:** Datos de identidad (nombre, serie, marca, modelo, tipo), ubicación física, sucursal asignada, coordinador responsable y estado actual.
  2. **Calibraciones:** Historial completo de certificaciones con entidad certificadora, N° INACAL, resultado (`CONFORME`/`NO_CONFORME`) y días hasta próxima calibración.
  3. **Mantenimiento:** Últimos 10 registros. Muestra tipo (PREVENTIVO/CORRECTIVO/PREDICTIVO), técnico, horas al momento, costo, aplicación LOTO, y si generó incidente.
  4. **LOTO / Autorizaciones:** Ejecuciones del procedimiento de bloqueo y operadores autorizados para el equipo.
  5. **Inspecciones:** Últimas 5 inspecciones vinculadas al equipo.
  6. **Documentos:** Repositorio de documentos adjuntos (manuales, fichas técnicas, certificados).

### 2.3 Servicio Frontend (`equipos.service.ts`)

Capa de abstracción HTTP que consume la API REST del backend. Expone funciones tipadas para todos los endpoints del módulo.

---

## 3. Contratos de API (Endpoints)

### 3.1 Módulo Equipos — `GET /api/equipos`

| Método | Ruta | Rol Mínimo | Descripción |
| :----- | :--- | :--------- | :---------- |
| `GET` | `/equipos` | JWT válido | Lista todos los equipos activos. Soporta `?busqueda=` y `?estado=`. Incluye última calibración y contadores. |
| `GET` | `/equipos/:id` | JWT válido | Detalle completo: calibraciones, últimos 10 mantenimientos, autorizaciones, últimas 5 inspecciones y ejecuciones LOTO. |
| `GET` | `/equipos/nfc/:tagId` | JWT válido | Busca equipo por tag NFC. Usado en lectura de campo. Retorna `404` si el tag no está registrado. |
| `GET` | `/equipos/calibraciones/por-vencer` | JWT válido | Lista calibraciones con `proximaCalibracion` en los próximos 30 días. Ordenado por fecha ascendente. |
| `GET` | `/equipos/:id/mtbf` | JWT válido | Calcula MTBF (Mean Time Between Failures) a partir de mantenimientos CORRECTIVOS históricos. |
| `POST` | `/equipos` | `COORDINADOR` | Crea un nuevo equipo. Valida unicidad de `numeroSerie`. |
| `PUT` | `/equipos/:id` | `COORDINADOR` | Actualiza campos del equipo. Soporta todos los campos de `ActualizarEquipoDto`. |
| `POST` | `/equipos/calibraciones` | `COORDINADOR`, `SUPERVISOR` | Registra una nueva calibración. Valida que `proximaCalibracion > fechaCalibracion`. |
| `DELETE` | `/equipos/:id` | `COORDINADOR` | Baja técnica: no elimina físicamente, actualiza `estado = BAJA_TECNICA`. |

### 3.2 Módulo Mantenimientos — `GET /api/mantenimientos`

| Método | Ruta | Rol Mínimo | Descripción |
| :----- | :--- | :--------- | :---------- |
| `GET` | `/mantenimientos?equipoId=` | JWT válido | Lista todos los mantenimientos de un equipo ordenados por fecha desc. |
| `GET` | `/mantenimientos/:id` | JWT válido | Detalle de un mantenimiento individual con equipo relacionado. |
| `POST` | `/mantenimientos` | `COORDINADOR`, `SUPERVISOR` | Registra un mantenimiento nuevo. Aplica **reglas HSE críticas** (ver sección 4). |

---

## 4. Reglas de Negocio HSE (Implementadas en el Servicio)

Estas reglas son invariables y están protegidas en la capa de servicio. **No se pueden bypassear vía payload.**

### Regla 1 — Unicidad de Número de Serie
Al crear un equipo (`POST /equipos`), el servicio valida con `findUnique` que `numeroSerie` no exista en la base de datos. Si duplica, lanza `409 Conflict`.

### Regla 2 — Bloqueo LOTO antes de Mantenimiento (OSHA 1910.147)
Si `equipo.requiereLoto === true`, al intentar `POST /mantenimientos` el servicio verifica si existe una `EjecucionLoto` con `estadoEjecucion = 'BLOQUEADO'` para ese equipo. Si no existe, la solicitud es rechazada con `400 Bad Request`:
```
"ALERTA LOTO: Este equipo requiere un procedimiento de Bloqueo y Etiquetado (LOTO) activo..."
```

### Regla 3 — Restauración Automática de Estado Post-Mantenimiento
Al registrar un mantenimiento con `equipoQuedoOperativo = true`:
- Si el equipo estaba en `EN_MANTENIMIENTO` o `BLOQUEADO_INSPECCION` → se restaura a `OPERATIVO`.
- Se limpian los campos `esBloqueoAutomatico`, `motivoBloqueoAuto` y `fechaBloqueoAuto`.

Si `equipoFueraServicio = true` → el estado pasa a `EN_MANTENIMIENTO`.

### Regla 4 — Auto-cierre LOTO al Finalizar Mantenimiento Exitoso
Si el equipo requiere LOTO y el mantenimiento concluyó operativo (`equipoQuedoOperativo !== false`), el servicio cierra automáticamente la `EjecucionLoto` activa:
- `estadoEjecucion → DESBLOQUEADO`
- `fechaDesbloqueo = now()`
- `observaciones = "Cierre automático por registro de mantenimiento. Técnico: {nombre}"`

### Regla 5 — Validación de Fechas de Calibración
`proximaCalibracion` debe ser **estrictamente posterior** a `fechaCalibracion`. Si no, lanza `400 Bad Request`.

### Regla 6 — Incidente Vinculado Obligatorio (Ley 29783 Art. 82)
Si `generoIncidente = true` en el DTO de mantenimiento, el campo `incidenteId` (UUID del incidente) es **obligatorio** (validado por `@ValidateIf` en el DTO).

---

## 5. Campos del Modelo de Datos (Prisma)

### 5.1 Entidad `Equipo`

| Campo | Tipo | Descripción |
| :---- | :--- | :---------- |
| `id` | `String (UUID)` | PK auto-generado |
| `nombre` | `String` | Nombre descriptivo del equipo |
| `numeroSerie` | `String @unique` | Identificador físico único |
| `nfcTagId` | `String? @unique` | Tag NFC para lectura de campo |
| `estado` | `EstadoEquipo` | `OPERATIVO` / `EN_MANTENIMIENTO` / `BLOQUEADO_CERTIFICADO` / `BLOQUEADO_INSPECCION` / `BAJA_TECNICA` |
| `tipoEquipo` | `TipoEquipo (enum)` | Clasificación técnica del activo |
| `sucursalId` | `String? (FK)` | Sede a la que pertenece |
| `vidaUtilMeses` | `Int?` | Vida útil estimada en meses |
| `horasOperadasActuales` | `Float?` | Hodómetro de horas de operación |
| `horasLimiteMantenimiento` | `Float?` | Umbral de horas para mantenimiento preventivo |
| `proximoMantenimiento` | `DateTime?` | Se sincroniza automáticamente al registrar mantenimiento |
| `requiereLoto` | `Boolean` | Activa la validación LOTO en mantenimientos |
| `puntosBloqueo` | `String?` | Descripción textual de los puntos de bloqueo físicos |
| `energiasPeligrosas` | `String[]` | Lista de energías a controlar (eléctrica, hidráulica, etc.) |
| `eppObligatorio` | `Json?` | EPP requerido por operador (structure libre JSONB) |
| `esBloqueoAutomatico` | `Boolean` | Indica si el estado fue bloqueado por un cron automático |
| `motivoBloqueoAuto` | `String?` | Razón del bloqueo automático |
| `deletedAt` | `DateTime?` | Soft-delete para baja técnica definitiva (no implementado aún) |

### 5.2 Entidad `Calibracion`

| Campo | Tipo | Descripción |
| :---- | :--- | :---------- |
| `equipoId` | `String (FK)` | Equipo al que pertenece |
| `fechaCalibracion` | `DateTime` | Fecha en que se realizó |
| `proximaCalibracion` | `DateTime` | Vencimiento del certificado |
| `estadoResultado` | `EstadoCalibracion` | `CONFORME` / `NO_CONFORME` / `OBSERVADO` |
| `entidadCertificadora` | `String?` | Laboratorio que certificó |
| `numeroCertificado` | `String?` | Número de informe de calibración |
| `numeroAcreditacionInacal` | `String?` | N° de acreditación INACAL (ej: `LE-038`) |

### 5.3 Entidad `Mantenimiento`

| Campo | Tipo | Descripción |
| :---- | :--- | :---------- |
| `equipoId` | `String (FK)` | Equipo intervenido |
| `tipoMantenimiento` | `TipoMantenimiento` | `PREVENTIVO` / `CORRECTIVO` / `PREDICTIVO` |
| `tecnicoResponsable` | `String` | Nombre del técnico (obligatorio) |
| `trabajoRealizado` | `String` | Descripción del trabajo (obligatorio) |
| `certificadoUrl` | `String` | URL al informe técnico firmado — **obligatorio** |
| `aplicoLoto` | `Boolean` | ¿Se aplicó el procedimiento LOTO? |
| `generoIncidente` | `Boolean` | ¿La falla originó un incidente? |
| `incidenteId` | `String? (FK)` | UUID del incidente (obligatorio si `generoIncidente = true`) |
| `disposicionResiduos` | `String` | Cómo se gestionaron los residuos (ISO 14001 — obligatorio) |
| `certificacionTecnico` | `String?` | Certificación o habilitación del técnico |
| `equipoFueraServicio` | `Boolean` | Si quedó fuera de servicio al cerrar el trabajo |
| `equipoQuedoOperativo` | `Boolean` | Si el equipo fue devuelto al servicio |
| `horasEquipoAlMomento` | `Float?` | Lectura del hodómetro al momento de la intervención |
| `costoSoles` | `Float?` | Costo en soles de la intervención |

---

## 6. Cálculo MTBF — `GET /equipos/:id/mtbf`

El endpoint calcula el **Mean Time Between Failures** usando únicamente mantenimientos de tipo `CORRECTIVO` como eventos de falla:

```
MTBF = (ms entre primera y última falla) / (total_fallas - 1)  ÷  3_600_000
```

| Condición | Respuesta |
| :-------- | :-------- |
| `totalFallas < 2` | `{ mtbfHoras: null, totalFallas, horas }` — insuficientes datos |
| `totalFallas >= 2` | `{ mtbfHoras: número, totalFallas, horas }` — redondeado a 2 decimales |

---

## 7. Manejo de Errores y Casos Extremos (Edge Cases)

### 7.1 Capa de API / Backend (NestJS)

| Condición | Respuesta | Capa |
| :-------- | :-------- | :--- |
| `GET /equipos/:id` con UUID inexistente | `404 Not Found` — `NotFoundException('Equipo no encontrado')` | `EquiposService` |
| `GET /equipos/nfc/:tagId` con tag no registrado | `404 Not Found` — `NotFoundException('Equipo no encontrado o Tag NFC no registrado')` | `EquiposService` |
| `POST /equipos` con `numeroSerie` duplicado | `409 Conflict` — `ConflictException` | `EquiposService` |
| `POST /mantenimientos` con equipo `requiereLoto = true` sin `EjecucionLoto BLOQUEADO` activa | `400 Bad Request` — mensaje ALERTA LOTO | `MantenimientosService` |
| `POST /equipos/calibraciones` con `proximaCalibracion <= fechaCalibracion` | `400 Bad Request` — `BadRequestException` | `EquiposService` |
| `POST /mantenimientos` con `generoIncidente = true` y sin `incidenteId` | `400 Bad Request` — `ValidationPipe` (@ValidateIf) | `ValidationPipe` (global) |
| Payload con campo no declarado en DTO (ej. `"hack": true`) | `400 Bad Request` — `ValidationPipe` con `forbidNonWhitelisted: true` | `ValidationPipe` (global) |
| Rol `SUPERVISOR` intenta `POST /equipos` (crear equipo) | `403 Forbidden` — `RolesGuard` | `RolesGuard` |
| `sucursalId` inexistente en `POST /equipos` | `400 Bad Request` — `PrismaExceptionFilter` atrapa `P2003` (FK violation) | `PrismaExceptionFilter` (global) |
| `GET /equipos/:id/mtbf` con equipo sin mantenimientos correctivos | Respuesta `200` con `mtbfHoras: null` — no lanza error | `EquiposService` |

### 7.2 Casos de Estado Nulo (Frontend)

| Condición | Comportamiento en UI |
| :-------- | :------------------- |
| `calibraciones` vacío | La pestaña muestra mensaje "Sin calibraciones registradas". Badge de estado en rojo (`VENCIDA`). |
| `proximaCalibracion` pasado | Función de días calcula número negativo; el badge muestra "VENCIDA" con clase `destructive`. |
| `nfcTagId` es `null` | El botón de lectura NFC se desactiva. No lanza error en UI. |
| Fallo de red en carga del detalle | Estado Zustand/React Query en error; muestra `OfflineFallback`. |
| `estado = BAJA_TECNICA` | Todos los botones de acción (crear mantenimiento, calibración) se deshabilitan en la vista. |

### 7.3 Estados del Equipo (Máquina de Estados)

```
OPERATIVO ──[requiere mantenimiento]──→ EN_MANTENIMIENTO
OPERATIVO ──[cron: calibración vencida]──→ BLOQUEADO_CERTIFICADO  (pendiente, ver brecha §8.1)
OPERATIVO ──[inspección con no-conformidad]──→ BLOQUEADO_INSPECCION
EN_MANTENIMIENTO ──[equipoQuedoOperativo=true]──→ OPERATIVO
BLOQUEADO_INSPECCION ──[equipoQuedoOperativo=true]──→ OPERATIVO
CUALQUIER_ESTADO ──[baja técnica]──→ BAJA_TECNICA  (estado terminal)
```

---

## 8. Brechas Conocidas y Pendientes

Estas limitaciones son conocidas y están documentadas para la siguiente iteración.

### 8.1 🔴 CRÍTICO — Cron de Bloqueo por Calibración Vencida (Pendiente)
El CRON de notificaciones no bloquea automáticamente el equipo cuando `proximaCalibracion` ha vencido. El estado `BLOQUEADO_CERTIFICADO` existe en el enum pero no se asigna en ningún proceso automático. **Debe implementarse en `notificaciones.cron.ts`**.

### 8.2 🟡 ALTO — Endpoint Dossier PDF (`GET /equipos/:id/dossier-pdf`)
La plantilla HBS (`dossier-equipo.hbs`) ya existe en `/backend/src/modules/reportes/templates/`. El endpoint en `reportes.controller.ts` está registrado. Falta conectar el servicio de generación PDF con el log de auditoría (`DossierExportLog`) y sellar con JWT snapshot.

### 8.3 🟡 ALTO — `PaginaEquipos.tsx` sin paginación de servidor
El listado de equipos carga todos los registros en una sola petición. Para > 500 equipos, debe implementarse paginación con `?page=` y `?limit=` igual al patrón usado en Trabajadores.

### 8.4 🟢 MEDIO — Actualización de Horas por Mantenimiento
Al registrar un mantenimiento con `horasEquipoAlMomento`, el campo `horasOperadasActuales` del equipo se sincroniza automáticamente. Sin embargo, **no hay validación** que detecte `horasEquipoAlMomento < horasOperadasActuales` (retroceso de hodómetro). Se debe agregar una validación en `MantenimientosService.crear()`.

---

## 9. Flujo de Acción para el Agente IA

### Para agregar un nuevo campo al equipo:
1. Añadir columna al modelo `Equipo` en `schema.prisma` y generar migración.
2. Exponer el campo en `CrearEquipoDto` y `ActualizarEquipoDto` con los decoradores `class-validator` correspondientes.
3. Mapear el campo en `EquiposService.crear()` y `actualizar()`.
4. Actualizar la vista `PaginaDetalleEquipo.tsx` en el tab correspondiente.

### Para registrar un mantenimiento correctamente:
El payload **mínimo obligatorio** es:
```json
{
  "equipoId": "uuid",
  "tipoMantenimiento": "PREVENTIVO",
  "fechaMantenimiento": "2026-03-07",
  "tecnicoResponsable": "Juan Pérez",
  "trabajoRealizado": "Descripción del trabajo",
  "certificadoUrl": "https://storage.empresa.com/informe.pdf",
  "aplicoLoto": false,
  "generoIncidente": false,
  "disposicionResiduos": "Residuos entregados a empresa autorizada ECA-RS-001"
}
```

### Para registrar una calibración (INACAL):
```json
{
  "equipoId": "uuid",
  "fechaCalibracion": "2026-03-07",
  "proximaCalibracion": "2027-03-07",
  "estadoResultado": "CONFORME",
  "entidadCertificadora": "Laboratorio ACME SAC",
  "numeroCertificado": "CAL-2026-00123",
  "numeroAcreditacionInacal": "LE-038",
  "certificadoUrl": "https://storage.empresa.com/cal-2026-00123.pdf"
}
```
