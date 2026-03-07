# Documento Fundacional: Fase 0 (Base de Datos y Setup)

**Proyecto:** Sistema Web de Gestión de Seguridad Laboral (HSE)
**Rol:** Custodio Ágil del Producto — Auditoría: HSE-db-expert Agent
**Estado:** Activa — **Schema versión 3.0** (Marzo 2026)

---

## 1. Visión Central y Propósito de la Fase 0

En estricto apego a la **Visión Central del Producto**, la Fase 0 establece los cimientos infraestructurales y de datos para el sistema. Su objetivo es reemplazar los archivos físicos y hojas de cálculo desconectadas por una base de datos centralizada, relacional y altamente disponible. La premisa "cero papel" comienza aquí, garantizando que el expediente 360° de los trabajadores sea inmutable, seguro y auditable.

---

## 2. Arquitectura de Almacenamiento y Setup

| Capa | Tecnología | Justificación |
|---|---|---|
| **Motor de BD** | PostgreSQL 16 (Docker) | Soporte nativo JSONB para checklists dinámicos y matrices IPC |
| **ORM** | Prisma v7 | Schema fuertemente tipado, migraciones seguras, Client generado |
| **Orquestación local** | Docker Desktop + `docker-compose.yml` | Réplica exacta del entorno de producción; BD aislada por proyecto |
| **Índices avanzados** | GIN sobre campos JSONB | Búsquedas sub-milisegundo dentro de objetos EPP/checklist |

> **Nota Docker:** La base de datos corre en el contenedor `hse_postgres` (puerto 5432). Todos los comandos Prisma leen `DATABASE_URL` del `.env` local para conectarse. Para operaciones DBA directas usar: `docker exec -it hse_postgres psql -U <user> -d hse_database`

---

## 3. Inventario Completo de Entidades (Schema v3.0)

### 3.0 Enumeraciones del Sistema

| Enum | Valores | Usado en |
|---|---|---|
| `Rol` | `COORDINADOR` / `SUPERVISOR` / `JEFATURA` | `usuarios` |
| `EstadoLaboral` | `ACTIVO` / `CESADO` | `trabajadores` |
| `EstadoEMO` | `APTO` / `NO_APTO` / `APTO_RESTRICCION` | `trabajadores`, `examenes_medicos` |
| `TipoExamenMedico` | `INGRESO` / `PERIODICO` / `RETIRO` / `REINTEGRO` | `examenes_medicos` |
| `EstadoEquipo` | `OPERATIVO` / `EN_MANTENIMIENTO` / `BAJA_TECNICA` | `equipos` |
| `SeveridadFalta` | `LEVE` / `GRAVE` / `CRITICA` | `amonestaciones` |
| `EstadoInspeccion` | `EN_PROGRESO` / `COMPLETADA` / `CANCELADA` | `inspecciones` |
| `TipoInstalacion` ⭐ _v3.0_ | `OFICINA` / `PLANTA_INDUSTRIAL` / `ALMACEN` / `LABORATORIO` / `OBRA` | `sucursales` |
| `NivelRiesgo` ⭐ _v3.0_ | `BAJO` / `MEDIO` / `ALTO` / `CRITICO` | `sucursales` |
| `CategoriaIncendio` ⭐ _v3.0_ | `BAJO` / `ORDINARIO` / `ALTO` | `sucursales` |
| `ResultadoInspeccionSUNAFIL` ⭐ _v3.0_ | `CONFORME` / `OBSERVADO` / `NO_CONFORME` / `SANCIONADO` | `sucursales` |

### 3.1 Módulo de Acceso y Usuarios

#### `usuarios`
| Campo | Tipo | Restricción | Notas |
|---|---|---|---|
| `id` | UUID | PK | Auto-generado |
| `correo` | String | UNIQUE | Clave de autenticación |
| `contrasena` | String | — | Hash bcrypt (10 rounds) |
| `nombreCompleto` | String | — | — |
| `rol` | Enum `Rol` | — | COORDINADOR / SUPERVISOR / JEFATURA |
| `activo` | Boolean | default true | Control de sesiones activas |
| `deletedAt` | DateTime? | nullable | **Soft-Delete** — null = activo |
| `creadoEn` | DateTime | default now | — |
| `actualizadoEn` | DateTime | updatedAt | — |

**Índices:** `[activo]`, `[deletedAt]`

---

### 3.2 Módulo 1 — Base de Datos Maestra

#### `sucursales` ⭐ _(Expandido v3.0 — Ley 29783 / SUNAFIL / INDECI)_

**Bloque 1 — Identificación base**
| Campo | Tipo | Restricción | Notas |
|---|---|---|---|
| `id` | UUID | PK | Auto-generado |
| `nombre` | String | UNIQUE | Nombre único de la sede |
| `direccion` | String? | — | Dirección física |
| `latitud` / `longitud` | Float? | — | Geolocalización |
| `activa` | Boolean | default true | Estado operativo |
| `deletedAt` | DateTime? | nullable | **Soft-Delete** — Sede dada de baja lógicamente |
| `creadoEn` / `actualizadoEn` | DateTime | — | Trazabilidad temporal |

**Bloque 2 — Clasificación de la instalación (INDECI / Ley 29783)**
| Campo | Tipo | Notas |
|---|---|---|
| `tipoInstalacion` | Enum `TipoInstalacion`? | Tipo de establecimiento según INDECI |
| `nivelRiesgo` | Enum `NivelRiesgo`? | Nivel de riesgo SST declarado |
| `categoriaIncendio` | Enum `CategoriaIncendio`? | Riesgo de incendio según NFPA / NTP 350.043 |

**Bloque 3 — Registros legales obligatorios**
| Campo | Tipo | Notas |
|---|---|---|
| `codigoCIIU` | String? | Clasificación Industrial Internacional Uniforme (SUNAT/SBS) |
| `codigoEstablecimientoINDECI` | String? | **UNIQUE** — Registro Nacional INDECI |
| `numeroCertificadoDC` | String? | N° Certificado de Inspección de Defensa Civil |
| `vencimientoCertificadoDC` | DateTime? | ⚠️ Trigger de alerta a 90/30/7 días antes de vencer |
| `fechaProximaRevisionDC` | DateTime? | Próxima revisión programada por INDECI |

**Bloque 4 — Infraestructura física**
| Campo | Tipo | Notas |
|---|---|---|
| `aforoMaximo` | Int? | Capacidad máxima de personas (exigido por INDECI) |
| `areaM2` | Float? | Área total del establecimiento en m² |
| `numeroPisos` | Int? | N° de pisos / niveles |
| `anioConstruccion` | Int? | Año de construcción (para evaluación sísmica) |
| `zonaRiesgoSismico` | Int? | Zona sísmica 1-4 según NTE E.030 |

**Bloque 5 — Gestión de emergencias (Ley 29783 Art. 34)**
| Campo | Tipo | Notas |
|---|---|---|
| `responsableSSTNombre` | String? | Nombre del responsable SST de la sede |
| `responsableSSTTelefono` | String? | Teléfono directo del responsable SST |
| `medicoOcupacionalNombre` | String? | Médico ocupacional asignado |
| `centroMedicoMasCercano` | String? | Hospital / clínica de referencia en emergencias |
| `telefonoCentroMedico` | String? | Teléfono del centro médico de referencia |
| `cantidadExtintores` | Int? | default 0 — Total de extintores en la sede |
| `tieneDesfibriladorDEA` | Boolean | default false — Existencia de DEA |
| `ubicacionDEA` | String? | Descripción exacta de ubicación del DEA |
| `cantidadBotiquines` | Int? | default 0 — Total de botiquines |
| `tieneEnfermeria` | Boolean | default false — Existencia de enfermería propia |
| `telefonoEmergenciasSede` | String? | Línea directa de emergencias de la sede |
| `planEmergenciaVigente` | Boolean | default false — Plan de emergencia aprobado y vigente |
| `fechaVencimientoPlanEmergencia` | DateTime? | Fecha de vencimiento del plan de emergencia |
| `fechaUltimoSimulacro` | DateTime? | Fecha del último simulacro realizado |
| `cantidadSimulacrosAnio` | Int? | default 0 — Simulacros realizados en el año |
| `brigadasEmergencia` | Json (JSONB) | Array de brigadas con tipo, jefe, miembros y certificación |
| `peligrosIdentificados` | Json (JSONB) | Mapa de peligros: tipo, nivel, zona y control implementado |

**Bloque 6 — Trazabilidad SUNAFIL**
| Campo | Tipo | Notas |
|---|---|---|
| `fechaUltimaInspeccionSUNAFIL` | DateTime? | Fecha de la última visita de fiscalización |
| `resultadoUltimaInspeccion` | Enum `ResultadoInspeccionSUNAFIL`? | Estado ante SUNAFIL: CONFORME / OBSERVADO / NO_CONFORME / SANCIONADO |
| `observacionesLegalesActivas` | String? | Texto de observaciones o multas pendientes de subsanar |

**Índices:** `[activa]`, `[deletedAt]`, `[tipoInstalacion]`, `[nivelRiesgo]`, `[vencimientoCertificadoDC]`, `[fechaProximaRevisionDC]`, `[resultadoUltimaInspeccion]`, `[planEmergenciaVigente]`

> **Estructura JSONB — `brigadasEmergencia`:**
> ```json
> [{"tipo": "Evacuación", "jefe": "Juan Pérez", "miembros": 12, "certificado": true}]
> ```

> **Estructura JSONB — `peligrosIdentificados`:**
> ```json
> [{"tipo": "Eléctrico", "nivel": "ALTO", "zona": "Sala de compresores", "control": "EPP dieléctrico"}]
> ```

---

#### `trabajadores`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | — |
| `dni` | String UNIQUE | Clave QR de emergencia |
| `estadoEMO` | Enum `EstadoEMO` | **Cache** del último examen (fuente: `examenes_medicos`) |
| `fechaVencimientoEMO` | DateTime? | **Cache** para alertas de vencimiento |
| `estadoLaboral` | Enum `EstadoLaboral` | ACTIVO / CESADO |
| `alergiasCriticas` | String? | Acceso rápido escáner QR emergencias |
| `condicionesPreexistentes` | String? | — |
| `eps` / `arl` | String? | Cobertura médica |
| `sucursalId` | FK → `sucursales` | `onDelete: Restrict` |
| `deletedAt` | DateTime? | **Soft-Delete** — Historial laboral protegido SUNAFIL |

**Índices:** `[sucursalId]`, `[estadoLaboral]`, `[tipoSangre]`, `[activo]`, `[deletedAt]`

> **Patrón de doble capa:** Los campos `estadoEMO` y `fechaVencimientoEMO` actúan como **cache de lectura rápida** para el escáner QR en emergencias. El historial completo y verificable vive en la tabla `examenes_medicos` (ver §3.3).

---

#### `supervisores`
| Campo | Tipo | Notas |
|---|---|---|
| `usuarioId` | FK UNIQUE → `usuarios` | `onDelete: Cascade` — el supervisor sigue al usuario |
| `telefono` | String? | — |

> Nota de soft-delete: El borrado lógico del `Usuario` padre (via `deletedAt`) desactiva implícitamente al supervisor. No requiere `deletedAt` propio.

---

#### `supervisor_sucursal` _(tabla de unión N:N)_
- Relación: `Supervisor` ↔ `Sucursal`
- `onDelete: Cascade` en ambas FK — limpieza automática al desasignar
- Unique constraint: `[supervisorId, sucursalId]`

---

#### `equipos`
| Campo | Tipo | Notas |
|---|---|---|
| `numeroSerie` | String UNIQUE | — |
| `nfcTagId` | String? UNIQUE | Escaneo NFC en campo |
| `estado` | Enum `EstadoEquipo` | OPERATIVO / EN_MANTENIMIENTO / BAJA_TECNICA |
| `deletedAt` | DateTime? | **Soft-Delete** — Historial de calibraciones protegido |

**Índices:** `[estado]`, `[deletedAt]`

---

#### `calibraciones`
- FK `equipoId` → `equipos` con `onDelete: Restrict`
- **Inmutabilidad garantizada:** ningún equipo puede eliminarse si tiene calibraciones registradas
- Sin `deletedAt` — los certificados son documentos técnico-legales, jamás se anulan

---

#### `matriz_ipc`
| Campo | Tipo | Notas |
|---|---|---|
| `eppsObligatorios` | Json (JSONB) | Índice GIN aplicado |
| `herramientasRequeridas` | Json (JSONB) | Índice GIN aplicado |
| `capacitacionesRequeridas` | Json (JSONB) | Índice GIN aplicado |
| `activo` | Boolean | Mecanismo equivalente a soft-delete para configuración |

**Índices B-tree:** `[cargo]`, `[activo]`
**Índices GIN (SQL raw):** `idx_matriz_epps_gin`, `idx_matriz_herramientas_gin`, `idx_matriz_capacitaciones_gin`

---

### 3.3 Módulo 2 — Perfil 360° / Salud y Seguridad

#### `examenes_medicos` _(NUEVO — Schema v2.0)_

Esta tabla **normaliza el historial médico ocupacional** del trabajador, separando la aptitud puntual (cache en `trabajadores`) del registro longitudinal de exámenes. Cumple con la obligación de documentar el seguimiento EMO exigido por la Ley 29783 y su Reglamento DS 005-2012-TR.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | — |
| `trabajadorId` | FK → `trabajadores` | `onDelete: Restrict` — **prueba médica inmutable** |
| `tipoExamen` | Enum `TipoExamenMedico` | INGRESO / PERIODICO / RETIRO / REINTEGRO |
| `fechaExamen` | DateTime | — |
| `estado` | Enum `EstadoEMO` | APTO / NO_APTO / APTO_RESTRICCION |
| `restricciones` | String? | Ej: "No trabajo en altura por 6 meses" |
| `observaciones` | String? | Notas del médico evaluador |
| `medicoEvaluador` | String? | Nombre del profesional |
| `institucion` | String? | Clínica / Centro de salud |
| `documentoUrl` | String? | URL al certificado PDF |
| `proximoVencimiento` | DateTime? | Para sistema de alertas automáticas |
| `creadoEn` | DateTime | Registro inmutable de cuándo se subió |

**Índices:** `[trabajadorId]`, `[fechaExamen]`, `[estado]`, `[proximoVencimiento]`

> **Sin `deletedAt`:** Los exámenes médicos son documentos clínicos de valor probatorio. Nunca se anulan; si hubo un error, se crea un examen corrector. El `onDelete: Restrict` garantiza que el registro permanezca aunque el trabajador sea dado de baja.

**Flujo de actualización del cache:**
```
POST /examenes-medicos (nuevo examen)
  → Service actualiza trabajadores SET estadoEMO = nuevo.estado,
                                       fechaVencimientoEMO = nuevo.proximoVencimiento
```

---

#### `entregas_epp`
- FK `trabajadorId` → `trabajadores` con `onDelete: Restrict`
- Sin `deletedAt` — el histórico de entrega de EPP es parte del expediente 360° inmutable

---

#### `capacitaciones`
- Campo `vigente: Boolean` — equivalente funcional al soft-delete para certificaciones
- FK `trabajadorId` → `trabajadores` con `onDelete: Restrict`

---

### 3.4 Módulo 3 — Inspecciones

#### `inspecciones`
| Campo | Tipo | Notas |
|---|---|---|
| `checklist` | Json (JSONB) | Índice GIN: `idx_inspeccion_checklist_gin` |
| `firmaSupervisor` | Boolean | Cierre legal de la inspección |
| `firmaBase64` | String? | Imagen de firma digital |
| `supervisorId` | FK → `supervisores` | `onDelete: Restrict` |
| `sucursalId` | FK → `sucursales` | `onDelete: Restrict` |
| `deletedAt` | DateTime? | **Soft-Delete** — Acta legal, nunca se borra físicamente |

**Índices:** `[estado]`, `[deletedAt]`

---

#### `inspeccion_trabajador` _(tabla de unión N:N)_
- Inspeccion `onDelete: Cascade` — si se anula una inspección, se limpia la asignación
- Trabajador `onDelete: Restrict` — el trabajador inspeccionado no puede borrarse

---

#### `fotos_inspeccion`
- FK `inspeccionId` → `inspecciones` con `onDelete: Cascade`
- Las fotos siguen el ciclo de vida del acta

---

### 3.5 Módulo 4 — Disciplina e Incidentes

#### `amonestaciones`
| Campo | Tipo | Notas |
|---|---|---|
| `severidad` | Enum `SeveridadFalta` | LEVE / GRAVE / CRITICA |
| `trabajadorId` | FK → `trabajadores` | `onDelete: Restrict` |
| `supervisorId` | FK → `supervisores` | `onDelete: Restrict` |
| `sucursalId` | FK → `sucursales` | `onDelete: Restrict` |
| `deletedAt` | DateTime? | **Soft-Delete** — Sanción con valor jurídico SUNAFIL |

**Índices:** `[trabajadorId]`, `[severidad]`, `[deletedAt]`

---

#### `incidentes`
| Campo | Tipo | Notas |
|---|---|---|
| `trabajadorId` | FK → `trabajadores` | `onDelete: Restrict` |
| `amonestacionId` | FK? → `amonestaciones` | `onDelete: SetNull` — desvinculable |
| `deletedAt` | DateTime? | **Soft-Delete** — Reporte obligatorio Ley 29783 |

**Índices:** `[trabajadorId]`, `[fechaEvento]`, `[deletedAt]`

---

### 3.6 Módulo 5 — Trazabilidad y Notificaciones

#### `registros_auditoria`
- Registro de cada acción del sistema (quién, qué, cuándo, IP)
- FK `usuarioId` → `usuarios` con `onDelete: Restrict` — **audit trail absoluto e inmutable**
- Sin `deletedAt` — los logs de auditoría jamás se borran

**Índices:** `[usuarioId, creadoEn DESC]`, `[entidad, entidadId]`, `[creadoEn DESC]`

---

#### `notificaciones`
- FK `destinatarioId` → `usuarios` con `onDelete: Cascade`
- Entidad efímera — sigue el ciclo de vida del usuario

---

## 4. Mapa de Relaciones — Salud y Seguridad (v2.0)

```
┌─────────────────────────────────────────────────────────────────┐
│                    NÚCLEO: Trabajador                           │
│  dni (UNIQUE) ← Escáner QR emergencias                         │
│  estadoEMO    ← Cache (actualizado desde ExamenMedico)         │
│  deletedAt    ← Soft-Delete SUNAFIL                            │
└───────────────────────┬─────────────────────────────────────────┘
                        │ 1
          ┌─────────────┼──────────────────────────┐
          │ N           │ N                         │ N
          ▼             ▼                           ▼
  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐
  │ExamenMedico  │  │  EntregaEpp      │  │   Capacitacion     │
  │(NUEVO v2.0)  │  │  onDelete:RESTRICT│  │   onDelete:RESTRICT│
  │tipoExamen    │  │  Expediente 360° │  │   vigente (bool)   │
  │estado EMO    │  └──────────────────┘  └────────────────────┘
  │restricciones │
  │onDelete:     │
  │  RESTRICT    │
  │  (inmutable) │
  └──────────────┘

  Historial EMO completo:
  INGRESO → PERIODICO → PERIODICO → RETIRO
     ↑ cada entrada en examenes_medicos actualiza el cache en trabajadores
```

---

## 4b. Mapa de Relaciones — Sede / Emergencias (v3.0)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NÚCLEO: Sucursal (v3.0)                          │
│                                                                         │
│  ESTADO LEGAL:          INFRAESTRUCTURA:      EMERGENCIAS:              │
│  codigoCIIU             aforoMaximo           responsableSSTNombre      │
│  codigoINDECI (UNIQUE)  areaM2                cantidadExtintores        │
│  numeroCertificadoDC    numeroPisos           tieneDesfibriladorDEA     │
│  vencimientoDC ─────────────────────────────► ALERTA (90/30/7 días)    │
│  fechaProximaRevisionDC ────────────────────► ALERTA Cron programado   │
│                                                                         │
│  JSONB:                 SUNAFIL:              SIMULACROS:               │
│  brigadasEmergencia     fechaUltimaInspeccion fechaUltimoSimulacro      │
│  peligrosIdentificados  resultadoInspeccion   cantidadSimulacrosAnio    │
│                         observacionesActivas  planEmergenciaVigente     │
│                         ↑                                              │
│              CONFORME / OBSERVADO / NO_CONFORME / SANCIONADO           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │ 1
         ┌─────────────────┼────────────────────┐
         │ N               │ N                  │ N
         ▼                 ▼                    ▼
  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │  Trabajador  │  │   Inspeccion    │  │  Amonestacion   │
  │ sucursalId ──┘  │ sucursalId ─────┘  │ sucursalId ─────┘
  │ onDelete:       │ onDelete:          │ onDelete:        │
  │  RESTRICT       │  RESTRICT          │  RESTRICT        │
  │ deletedAt       │ deletedAt          │ deletedAt        │
  └──────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 5. Auditoría de Integridad — Borrado Lógico Global (Soft-Delete)

Auditoría ejecutada el **6 de Marzo 2026** por `HSE-db-expert`.

| Tabla | Mecanismo | Justificación Legal |
|---|---|---|
| `usuarios` | `deletedAt` ✅ | Historial de accesos SUNAFIL |
| `sucursales` | `deletedAt` ✅ | Sede desactivada mantiene historial |
| `trabajadores` | `deletedAt` ✅ | Expediente laboral protegido |
| `equipos` | `deletedAt` ✅ | Historial de calibraciones preservado |
| `inspecciones` | `deletedAt` ✅ _(añadido v2.0)_ | Acta legal firmada — Ley 29783 |
| `amonestaciones` | `deletedAt` ✅ _(añadido v2.0)_ | Sanción disciplinaria SUNAFIL |
| `incidentes` | `deletedAt` ✅ _(añadido v2.0)_ | Reporte de accidente obligatorio |
| `matriz_ipc` | campo `activo` ✅ | Configuración, no registro legal |
| `capacitaciones` | campo `vigente` ✅ | Suficiente para gestión de vigencia |
| `calibraciones` | `onDelete: Restrict` ✅ | Inmutable por diseño técnico-legal |
| `examenes_medicos` | `onDelete: Restrict` ✅ | Documento clínico — nunca se anula |
| `entregas_epp` | `onDelete: Restrict` ✅ | Expediente 360° inmutable |
| `registros_auditoria` | Jamás se borra ✅ | Audit trail absoluto PRD §5 |
| `notificaciones` | `onDelete: Cascade` ✅ | Entidad efímera, no es registro legal |

### Política de Soft-Delete — Guía de Implementación

```typescript
// CORRECTO — Borrado lógico (siempre usar esto)
await prisma.inspeccion.update({
  where: { id },
  data: { deletedAt: new Date() }
});

// CORRECTO — Query que excluye eliminados
await prisma.trabajador.findMany({
  where: { deletedAt: null }
});

// PROHIBIDO — Borrado físico de registros legales
// await prisma.amonestacion.delete({ where: { id } }); ← NUNCA
```

---

## 6. Índices de Rendimiento (Schema v3.0)

### B-tree (Prisma `@@index`)
| Índice | Tabla | Uso principal |
|---|---|---|
| `[activo]`, `[deletedAt]` | todas las tablas principales | Filtro global de registros activos |
| `[sucursalId]`, `[estadoLaboral]` | trabajadores | Listados por sede/estado |
| `[tipoSangre]` | trabajadores | Emergencias: filtro rápido en QR |
| `[proximoVencimiento]` | examenes_medicos | Alertas de vencimiento EMO |
| `[trabajadorId]`, `[severidad]` | amonestaciones | Dashboard disciplinario |
| `[estado]`, `[deletedAt]` | inspecciones | Listados de campo |
| `[usuarioId, creadoEn DESC]` | registros_auditoria | Historial por usuario |
| `[entidad, entidadId]` | registros_auditoria | Trazabilidad de un registro |
| `[tipoInstalacion]`, `[nivelRiesgo]` ⭐ _v3.0_ | sucursales | Filtro por tipo/riesgo en dashboard |
| `[vencimientoCertificadoDC]` ⭐ _v3.0_ | sucursales | **Job Cron de alertas:** certificados DC próximos a vencer |
| `[fechaProximaRevisionDC]` ⭐ _v3.0_ | sucursales | **Job Cron de alertas:** revisiones programadas |
| `[resultadoUltimaInspeccion]` ⭐ _v3.0_ | sucursales | Dashboard SUNAFIL: sedes con hallazgos activos |
| `[planEmergenciaVigente]` ⭐ _v3.0_ | sucursales | Filtro: sedes con plan vencido o inexistente |

### GIN (SQL raw — `prisma/gin_indexes.sql`)
| Índice | Tabla.Campo | Permite |
|---|---|---|
| `idx_matriz_epps_gin` | `matriz_ipc.eppsObligatorios` | `WHERE eppsObligatorios @> '["Casco"]'` |
| `idx_matriz_herramientas_gin` | `matriz_ipc.herramientasRequeridas` | Búsqueda de herramienta en cualquier cargo |
| `idx_matriz_capacitaciones_gin` | `matriz_ipc.capacitacionesRequeridas` | Búsqueda de curso requerido |
| `idx_inspeccion_checklist_gin` | `inspecciones.checklist` | Consultas sobre items del checklist |

### Query de alerta diaria — ejemplo de uso de índices Sucursal

```typescript
// Sedes con certificado DC que vence en los próximos 30 días
const hoy = new Date();
const en30Dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

await prisma.sucursal.findMany({
  where: {
    deletedAt: null,
    vencimientoCertificadoDC: { lte: en30Dias, gte: hoy },
  },
  select: {
    nombre: true,
    numeroCertificadoDC: true,
    vencimientoCertificadoDC: true,
    responsableSSTNombre: true,
    responsableSSTTelefono: true,
  },
});

// Sedes con observaciones SUNAFIL activas
await prisma.sucursal.findMany({
  where: {
    deletedAt: null,
    resultadoUltimaInspeccion: { in: ['OBSERVADO', 'NO_CONFORME', 'SANCIONADO'] },
  },
});
```

---

## 7. Trazabilidad de Cambios (Changelog)

- **[Marzo 2026] - v1.0.0:** Creación del documento fundacional. Se decreta PostgreSQL + Prisma + Docker. Entidades base: Trabajador, Usuario, Sucursal, Inspeccion, Equipo.

- **[Marzo 2026] - v2.0.0:** Auditoría completa de integridad por `HSE-db-expert`.
  - **Fase 1 — Soft-Delete Global:** `deletedAt` añadido a `Usuario`, `Sucursal`, `Trabajador`, `Equipo`, `Inspeccion`, `Amonestacion`, `Incidente`. Protección total del historial legal ante SUNAFIL.
  - **Fase 2 — EMO Normalizado:** Nueva tabla `examenes_medicos` con `TipoExamenMedico` enum. Patrón cache/historial: `trabajadores.estadoEMO` = lectura rápida QR; `examenes_medicos` = fuente de verdad histórica.
  - **Fase 3 — Índices de Rendimiento:** GIN sobre todos los campos JSONB (MatrizIpc, Inspeccion). Índices B-tree compuestos en audit trail y tablas críticas. Índices aplicados via `prisma/gin_indexes.sql` al contenedor Docker.
  - **Bug fix:** BD vacía (seed nunca ejecutado). Re-seeded con 60 trabajadores, 40 inspecciones, 25 amonestaciones, **40 exámenes médicos**.

- **[Marzo 2026] - v3.0.0:** Expansión del módulo de Sucursales por requerimiento SUNAFIL / INDECI / Ley 29783.
  - **4 Enums nuevos:** `TipoInstalacion` (OFICINA / PLANTA_INDUSTRIAL / ALMACEN / LABORATORIO / OBRA), `NivelRiesgo` (BAJO / MEDIO / ALTO / CRITICO), `CategoriaIncendio` (BAJO / ORDINARIO / ALTO), `ResultadoInspeccionSUNAFIL` (CONFORME / OBSERVADO / NO_CONFORME / SANCIONADO).
  - **30 campos nuevos en `sucursales`** organizados en 6 bloques: Clasificación INDECI, Registros legales (CIIU, Certificados DC), Infraestructura física (aforo, área, pisos, sismo), Gestión de emergencias (responsables SST, equipamiento, DEA, botiquines), Plan de emergencia y simulacros, Trazabilidad SUNAFIL.
  - **UNIQUE constraint:** `codigoEstablecimientoINDECI` — cada sede tiene un código INDECI irrepetible.
  - **JSONB estructurado:** `brigadasEmergencia` y `peligrosIdentificados` con estructura documentada.
  - **8 índices nuevos** en `sucursales` para el motor de alertas diarias: `[vencimientoCertificadoDC]`, `[fechaProximaRevisionDC]`, `[resultadoUltimaInspeccion]`, `[planEmergenciaVigente]`, `[nivelRiesgo]`, `[tipoInstalacion]`.
  - **Seed actualizado:** Las 3 sucursales ahora tienen todos los campos poblados con datos realistas coherentes entre sí (Planta Norte = OBSERVADO por SUNAFIL; Planta Sur = CONFORME; Oficina CDMX = CONFORME con DEA registrado).
  - **Comandos Docker ejecutados:** `npx prisma db push --accept-data-loss` + `npx prisma generate` + `npx ts-node prisma/seed.ts`.


