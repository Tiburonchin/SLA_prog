# Documentación de Módulo: Sucursales

**Ubicación:** `/frontend/src/pages/sucursales/` y `/backend/src/modules/sucursales/`
**Estado Actual:** Estable / Implementado V3 (Actualización Arquitectónica Masiva)

---

## 1. Misión del Módulo dentro de la Visión HSE

El módulo **Sucursales** ha evolucionado de un simple directorio de ubicaciones a un **"Centro de Control de Riesgos y Emergencias"**. Cumple con el rol crítico de mantener la trazabilidad legal y operativa de cada sede para garantizar el cumplimiento de la **Ley 29783 (Ley de Seguridad y Salud en el Trabajo)**, las normativas de **SUNAFIL** y las exigencias de **INDECI**. Este módulo permite a los coordinadores HSE y supervisores monitorear en tiempo real los vencimientos de certificados, aforos, niveles de riesgo y estructurar planes de emergencia para evitar clausuras y salvaguardar la vida de los trabajadores.

## 2. Flujo de Arquitectura y Componentes Clave (Frontend)

La interfaz fue rediseñada bajo el concepto de enfoque **Mobile-First** para asegurar que los supervisores de campo puedan reaccionar desde sus dispositivos.

### 2.1 Tablero de Control de Sedes (Grid / Lista)
- **Descripción:** Vista principal que centraliza todas las instalaciones.
- **Funcionalidades Clave:**
  - **Semáforos de Nivel de Riesgo:** Indicadores visuales automáticos que clasifican las sucursales (Bajo, Medio, Alto, Crítico) según su riesgo SST o estado de observaciones de SUNAFIL.
  - **Filtros Avanzados:** Capacidades de búsqueda reactiva por tipo de instalación, nivel de riesgo y estado de vigencia del Certificado DC.

### 2.2 Expediente Digital de Sede (Layout en Pestañas)
- **Descripción:** Sub-ruta para la inspección detallada de una sucursal en formato "Expediente de Sede".
- **Distribución Estructural:**
  - **Header Operativo:** Incluye el nombre de la sede, semáforo de estado y los **Botones de Llamada de Emergencia** directos (médico ocupacional, emergencias de la sede), optimizados para dispositivos móviles (teléfono `href="tel:..."`).
  - **Layout en Pestañas (Tabs):** Permite navegar sin recargas entre diferentes contextos de prevención y legalidad:
    1. **Info Legal e INDECI:** Datos de certificación (Certificado de Defensa Civil, fechas de vencimiento), parámetros de infraestructura (Aforo Máximo, m², pisos, año de construcción), y códigos CIIU.
    2. **Gestión de Emergencias:** Visor de equipamiento (cantidad de extintores, DEA, botiquines), contacto del responsable SST y fechas del plan de emergencias/simulacros.
    3. **Brigadas y Peligros:** Visor de los equipos de primera respuesta y mapa de riesgos, alimentados directamente desde una estructura `JSONB` flexible.
    4. **SUNAFIL:** Historial de inspecciones externas, nivel de cumplimiento (Conforme, Observado, Sancionado) y tracking de observaciones legales activas.

## 3. Motor Cron (Backend) y Reglas de Negocio

La vitalidad del módulo reside en la proactividad de su motor interno, diseñado para delegar el estrés de memoria del Coordinador HSE hacia acciones automatizadas.

- **Servicio Principal:** `SucursalesAlertas.service.ts`
- **Regla de Negocio (INDECI & SUNAFIL):**
  - El sistema Cron evalúa diariamente el campo `vencimientoCertificadoDC` y `fechaVencimientoPlanEmergencia` de cada sucursal activa.
  - **Escala de Alertas:** Se disparan notificaciones preventivas a los **90**, **30** y **7 días** previos al vencimiento.
  - **Objetivo:** Prevenir el cierre o clausura por parte de INDECI o la imposición de multas por comento de SUNAFIL, garantizando tiempo de sobra para tramitar las renovaciones.

## 4. Arquitectura de Base de Datos y Cumplimiento Legal

La estructura de datos (`schema.prisma`) ha sido fuertemente vitaminada para modelar la realidad jurídica de un establecimiento comercial/industrial:

- **Campos Legales y de Infraestructura:**
  - Incorporación de `codigoEstablecimientoINDECI`, `numeroCertificadoDC`, `vencimientoCertificadoDC`, `aforoMaximo` y `areaM2`.
  - Enums categorizadores: `TipoInstalacion`, `NivelRiesgo`, `CategoriaIncendio` y `ResultadoInspeccionSUNAFIL`.
- **Estructuras Dinámicas (`JSONB`):**
  - **`brigadasEmergencia`:** Permite almacenar arrays completos de miembros, roles (Evacuación, Primeros Auxilios, Contraincendios) y estados de certificación sin tablas intermedias innecesarias.
  - **`peligrosIdentificados`:** Mapa flexible de riesgos (Eléctrico, Químico, etc.) geolocalizados por zona y nivel de riesgo, permitiendo a los ingenieros HSE detallar las medidas de control.
- **Auditoría y Borrado Lógico (Soft-Delete):**
  - Implementación estricta de `deletedAt`. Ningún establecimiento se elimina físicamente de la base de datos para preservar el historial ante posibles inspecciones retrospectivas de SUNAFIL o auditorías de la Ley 29783.

## 5. Notas de TSDoc (Regla HSE-DOCS)

Al igual que en los demás módulos del ecosistema, los servicios de backend y los store de React/Zustand asociados a las sucursales cuentan con documentación `TSDoc` auto-generable, especificando la estructura de los payloads de los campos `JSONB` y las mecánicas del motor de alertas (Cron).

---

## 6. Expansión Sprint 3.1 — Resumen Técnico (2026-03-06)

Esta sección documenta los cambios estructurales introducidos en el Sprint Estabilización (Fase 3.1) para registrar el alcance exacto de la expansión del módulo.

### 6.1 Nuevos Campos en el Modelo `Sucursal` (schema.prisma)

El modelo fue expandido de ~10 campos base a **35+ campos** agrupados en las siguientes categorías:

| Categoría | Campos representativos |
| :-------- | :---------------------- |
| **Identificadores INDECI** | `codigoEstablecimientoINDECI`, `numeroCertificadoDC`, `vencimientoCertificadoDC` |
| **Infraestructura** | `aforoMaximo`, `areaM2`, `numeroPisos`, `anoConstruccion`, `materialConstruccion` |
| **Riesgo y Clasificación** | `nivelRiesgo (NivelRiesgo enum)`, `categoriaIncendio (CategoriaIncendio enum)`, `tipoInstalacion (TipoInstalacion enum)`, `zonaRiesgoSismico (Int 1-4)` |
| **SUNAFIL** | `ultimaInspeccionSUNAFIL`, `resultadoInspeccionSUNAFIL (ResultadoInspeccionSUNAFIL enum)`, `observacionesSUNAFIL` |
| **Emergencias** | `cantidadExtintores`, `tieneDea`, `cantidadBotiquines`, `fechaUltimoSimulacro`, `fechaVencimientoPlanEmergencia` |
| **Contacto SST** | `responsableSSTNombre`, `responsableSSTTelefono`, `telefonoEmergenciaSede`, `telefonoMedicoOcupacional` |
| **JSONB Dinámicos** | `brigadasEmergencia (Json)`, `peligrosIdentificados (Json)` |
| **Códigos sectoriales** | `codigoCIIU`, `actividadEconomica` |

### 6.2 DTOs Actualizados

- **`CrearSucursalDto`**: Reescrito desde ~35 líneas a ~340 líneas. Incluye clases anidadas `BrigadaEmergenciaDto` y `PeligroIdentificadoDto` con `@ValidateNested({ each: true }) @Type(...)` para validar los arrays JSONB a nivel de campo.
- **`ActualizarSucursalDto`**: Extiende `PartialType(CrearSucursalDto)` — todos los campos son opcionales en PUT/PATCH.
- **Enums importados directamente desde `@prisma/client`**: evita duplicación de definiciones.

### 6.3 Motor Cron — Regla de Alertas

| Umbral | Comportamiento |
| :----- | :------------- |
| 90 días antes del vencimiento | `Logger.warn` + `Notificacion.createMany` para todos los usuarios con rol `COORDINADOR` activos |
| 30 días antes del vencimiento | Ídem — tono más urgente en el mensaje |
| 7 días antes del vencimiento | Ídem — mensaje de alerta crítica |

- **Cron expression (producción):** `'0 0 8 * * *'` (08:00 AM diario)
- **Cron expression (testing):** `'*/10 * * * * *'` (cada 10 segundos — cambiar temporalmente en `sucursales-alertas.service.ts`)
- Los errores de persistencia de notificaciones son capturados silenciosamente (`try/catch` interno) para **no interrumpir el ciclo Cron** ante fallos de BD transitorios.

---

## 7. Manejo de Errores y Casos Extremos (Edge Cases)

### 7.1 Capa de API / Backend

| Condición | Respuesta | Capa |
| :-------- | :-------- | :--- |
| `POST /sucursales` con `codigoEstablecimientoINDECI` duplicado | `409 Conflict` — `PrismaExceptionFilter` atrapa `P2002` | `PrismaExceptionFilter` (global) |
| `brigadasEmergencia` con estructura de objeto inválida (campo faltante) | `400 Bad Request` — `ValidationPipe` rechaza el DTO anidado; devuelve array de errores de validación por campo | `ValidationPipe` (global) |
| Payload con campo desconocido (ej. `"hackerField": true`) | `400 Bad Request` — `ValidationPipe` con `forbidNonWhitelisted: true` | `ValidationPipe` (global) |
| `DELETE` o desactivación lógica de sucursal con trabajadores activos vinculados | `400 Bad Request` — `PrismaExceptionFilter` atrapa `P2003` (FK constraint de `Trabajador.sucursalId`) al intentar borrar | `PrismaExceptionFilter` (global) |
| `GET /sucursales/:id` con UUID inexistente | `404 Not Found` — `P2025` atrapado | `PrismaExceptionFilter` (global) |
| Cron job falla al conectarse a BD (ej. PostgreSQL caído) | El error es logueado con `Logger.error()` pero **no mata el proceso NestJS**. El siguiente ciclo Cron intentará de nuevo. | `SucursalesAlertasService` (try/catch) |
| Enums enviados con valor fuera del set (ej. `"nivelRiesgo": "EXTREMO"`) | `400 Bad Request` — `@IsEnum(NivelRiesgo)` en el DTO rechaza el valor | `ValidationPipe` (global) |
| `zonaRiesgoSismico` con valor `0` o `5` (fuera del rango 1-4) | `400 Bad Request` — `@Min(1) @Max(4)` en el DTO | `ValidationPipe` (global) |

### 7.2 Error de Compilación TypeScript — Patrón JSONB

> **Cuándo ocurre:** Al actualizar el `schema.prisma` y agregar campos `Json`, si el client Prisma no es regenerado (`npx prisma generate`), el DTO no puede importar los enums nuevos y TypeScript falla con `Module '"@prisma/client"' has no exported member`.

> **Solución permanente:** El patrón de cast `as unknown as Prisma.InputJsonValue` en el servicio desacopla el tipo tipado del DTO del tipo opaco de Prisma, eliminando los errores de asignación bajo modo estricto. Ver `sucursales.service.ts` como referencia canónica.

### 7.3 Casos de Estado Nulo (Frontend)

| Condición | Comportamiento en UI |
| :-------- | :------------------- |
| `nivelRiesgo` es `null` | `BadgeRiesgo` muestra badge neutro gris sin lanzar error |
| `vencimientoCertificadoDC` es `null` | `AlertaDC` muestra `—` en lugar de fecha; `diasHasta()` retorna `null` sin producir `NaN` |
| `brigadasEmergencia` es `[]` o `null` | `GridBrigadas` muestra estado vacío ("Sin brigadas registradas") en lugar de una tableau vacío |
| `peligrosIdentificados` es `[]` o `null` | `GridPeligros` muestra estado vacío ("Sin peligros registrados") |
| `telefonoEmergenciaSede` es `null` | El botón `href="tel:..."` del header no se renderiza (renderizado condicional `{telefono && <a href=...>}`) |

