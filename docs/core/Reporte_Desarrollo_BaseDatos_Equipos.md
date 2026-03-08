# Reporte de Desarrollo: Base de Datos — Módulo Gestión Integral de Equipos
**Fecha:** 07 de Marzo de 2026  
**Auditor:** DBA / CTO Backend HSE  
**Base:** Análisis de `backend/prisma/schema.prisma` vs. requerimientos HSE

---

## 1. Diagnóstico del Esquema Actual

El esquema v3.0 tiene una base sólida para el módulo de equipos. Los modelos `Equipo`, `Calibracion`, `Mantenimiento`, `EjecucionLoto` y `AutorizacionOperador` existen. Sin embargo, el análisis del flujo real del frontend y los requisitos legales HSE identificó **brechas críticas** que deben cerrarse con migraciones de Prisma.

### Estado Actual vs. Requerido

| Modelo | Estado | Brecha |
|---|---|---|
| `Equipo` | ⚠ Incompleto | Falta `BLOQUEADO_CERTIFICADO` en enum y `esBloqueoAutomatico` |
| `Mantenimiento` | 🔴 Incompleto | Faltan 5 campos HSE críticos (LOTO, incidente, residuos) |
| `Calibracion` | ⚠ Incompleto | Campos legales (`numeroCertificado`, `entidadCertificadora`) son opcionales cuando no deberían serlo para nuevos registros |
| `EstadoEquipo` | 🔴 Insuficiente | Falta estado `BLOQUEADO_CERTIFICADO` |
| `DossierExportLog` | ❌ No existe | Tabla de auditoría de exportaciones PDF faltante |
| `DocumentoEquipo` | ❌ No existe | Repositorio de manuales, normas y archivos por equipo |

---

## 2. Cambios Requeridos en `schema.prisma`

### 2.A — Enum `EstadoEquipo`: Agregar Estado de Bloqueo Legal

**Problema:** El equipo solo puede estar `OPERATIVO`, `EN_MANTENIMIENTO` o `BAJA_TECNICA`. No existe una forma de distinguir que un equipo fue bloqueado **automáticamente por el sistema** (por calibración vencida o falla en checklist pre-uso) de uno puesto manualmente en mantenimiento.

**Migración requerida:**
```prisma
enum EstadoEquipo {
  OPERATIVO
  EN_MANTENIMIENTO
  BLOQUEADO_CERTIFICADO  // ← NUEVO: bloqueado automáticamente por calibración vencida (CRON)
  BLOQUEADO_INSPECCION   // ← NUEVO: bloqueado por falla crítica en checklist pre-uso
  BAJA_TECNICA
}
```

> **Impacto de migración:** Bajo. Es additive (suma valores al enum). No rompe registros existentes. Se ejecuta con `ALTER TYPE "EstadoEquipo" ADD VALUE 'BLOQUEADO_CERTIFICADO';` y `ADD VALUE 'BLOQUEADO_INSPECCION';` en una migración SQL.

---

### 2.B — Modelo `Equipo`: Campos de Bloqueo Automático y Vínculo Documental

```prisma
model Equipo {
  // ... campos existentes ...

  // ── NUEVOS CAMPOS REQUERIDOS ───────────────────────────────────────────────
  
  // Trazabilidad de bloqueos automáticos del sistema
  esBloqueoAutomatico   Boolean   @default(false)    // true = bloqueado por CRON/regla
  motivoBloqueoAuto     String?                      // Ej: "Certificación INACAL vencida el 2026-03-01"
  fechaBloqueoAuto      DateTime?                    // Timestamp del bloqueo automático
  
  // Vínculo con la Matriz IPC para mostrar la matriz de riesgos en la Pestaña 1
  matrizIpcId           String?                      // FK a MatrizIpc
  
  // Documento del manual del fabricante (reemplaza manualUrl con relación tipada)
  // El campo manualUrl EXISTENTE se mantiene para compatibilidad
  
  // Relaciones nuevas
  matrizIpc             MatrizIpc?   @relation(fields: [matrizIpcId], references: [id], onDelete: SetNull)
  documentos            DocumentoEquipo[]             // ← Repositorio documental
  dossierLogs           DossierExportLog[]            // ← Auditoría de exportaciones

  // Nuevos índices para el CRON y bloqueos automáticos
  @@index([estado, esBloqueoAutomatico]) // Listado de bloqueados automáticos
  @@index([matrizIpcId])
}
```

---

### 2.C — Modelo `Mantenimiento`: Campos HSE Legales Faltantes

Este es el cambio más crítico. El modelo actual no puede almacenar la información que el formulario frontend ya captura.

```prisma
model Mantenimiento {
  // ... campos existentes ...

  // ── NUEVOS CAMPOS HSE REQUERIDOS (MIGRACIÓN PENDIENTE) ───────────────────
  
  // Cumplimiento OSHA 1910.147 — Protocolo LOTO
  aplicoLoto            Boolean   @default(false)    // Técnico certificó LOTO aplicado
  
  // Trazabilidad cruzada de fallas → incidentes (Art. 82 Ley 29783)
  generoIncidente       Boolean   @default(false)    // ¿Esta falla derivó en accidente?
  incidenteId           String?                      // FK a tabla Incidente (si generoIncidente=true)
  
  // Certificación del técnico interviniente (DS 024-2016-EM)
  certificacionTecnico  String?                      // Ej: "NFPA 70E — Arco Eléctrico"
  
  // Cumplimiento Medioambiental — ISO 14001:2015 Cláusula 8.1
  disposicionResiduos   String?                      // ¿Qué se hizo con aceites, filtros, chatarra?
  
  // Evidencia digital obligatoria — firma técnica (DS 005-2012-TR Art. 26)
  // NOTA: El campo "certificadoUrl" EXISTENTE se renombra conceptualmente a
  // "reporteFirmaUrl" pero se mantiene nombre en BD para compatibilidad.
  // El servicio debe exigirlo como NOT NULL en nuevos registros.
  
  // Estado del equipo al finalizar la intervención
  equipoQuedoOperativo  Boolean   @default(true)     // false = requiere intervención adicional
  
  // Relaciones nuevas
  incidente             Incidente? @relation(fields: [incidenteId], references: [id], onDelete: SetNull)

  // Nuevos índices para dashboards HSE
  @@index([generoIncidente])   // Dashboard de mantenimientos con incidentes asociados
  @@index([aplicoLoto])        // Auditoría de cumplimiento LOTO
}
```

> **Impacto:** Todos los campos nuevos son nullable o con default. La migración no rompe datos existentes. Se aplica con `prisma migrate dev`.

---

### 2.D — Modelo `Incidente`: Agregar Relación Inversa (FK desde Mantenimiento)

Para el vínculo `Mantenimiento → Incidente`, Prisma requiere declarar la relación inversa en el modelo `Incidente`.

```prisma
model Incidente {
  // ... campos existentes ...
  
  // ── RELACIÓN INVERSA NUEVA ─────────────────────────────────────────────
  mantenimientos  Mantenimiento[]  // FK inversa desde Mantenimiento.incidenteId
}
```

---

### 2.E — Nuevo Modelo `DocumentoEquipo` (Repositorio Documental Tipado)

El campo `manualUrl` actual en `Equipo` es una cadena de texto simple; no puede almacenar múltiples documentos tipados. Se necesita una tabla relacional para soportar la Pestaña 4 ("Certificaciones y Manuales"), incluyendo manuales, normas, y certificados de primera puesta en marcha.

```prisma
/// Repositorio de documentos vinculados a un equipo específico.
/// Cubre: manuales fabricante, normas aplicables, certificados legales, fichas técnicas.
model DocumentoEquipo {
  id          String              @id @default(uuid())
  equipoId    String
  nombre      String                                    // Ej: "Manual de Operación v2.3"
  tipo        TipoDocumentoEquipo                       // Enum nuevo (ver abajo)
  archivoUrl  String                                    // URL a S3 / Azure Blob
  version     String?                                   // Ej: "Rev. 3"
  emitidoPor  String?                                   // Fabricante, INACAL, SUNAFIL, etc.
  fechaEmision DateTime?
  fechaVencimiento DateTime?                            // Para certificados que caducan
  observaciones String?
  activo      Boolean             @default(true)
  creadoEn    DateTime            @default(now())
  subidoPorId String?                                   // FK a Usuario (trazabilidad)
  
  equipo      Equipo              @relation(fields: [equipoId], references: [id], onDelete: Restrict)
  subidoPor   Usuario?            @relation(fields: [subidoPorId], references: [id], onDelete: SetNull)

  @@index([equipoId])
  @@index([tipo])
  @@index([fechaVencimiento])  // Alertas de documentos por vencer
  @@map("documentos_equipo")
}

enum TipoDocumentoEquipo {
  MANUAL_FABRICANTE       // Manual de operación oficial del fabricante
  NORMA_APLICABLE         // Norma ISO, ASME, OSHA referenciada
  CERTIFICADO_FABRICACION // Certificado de fabricación / primera puesta en marcha
  CERTIFICADO_PRUEBA_CARGA // Para equipos de izaje (grúas, eslingas)
  FICHA_TECNICA           // Especificaciones técnicas resumidas
  PROCEDIMIENTO_LOTO      // Procedimiento LOTO específico del equipo
  LISTA_REPUESTOS         // Catálogo de repuestos del fabricante
  OTRO
}
```

---

### 2.F — Nuevo Modelo `DossierExportLog` (Auditoría Legal de Exportaciones PDF)

Para cumplir con el requerimiento de trazabilidad del botón "Exportar PDF", cada vez que un usuario genera un dossier, debe quedar registrado en la BD. Esto es la defensa legal del sistema ante cualquier eventualidad.

```prisma
/// Registro inmutable de cada generación de Dossier PDF por equipo.
/// El sistema debe "saber" quién descargó cada expediente y en qué estado
/// se encontraba el equipo en ese momento.
model DossierExportLog {
  id                   String   @id @default(uuid())
  equipoId             String
  usuarioId            String
  fechaExportacion     DateTime @default(now())
  estadoEquipoAlExportar String  // Snapshot del EstadoEquipo en ese momento
  calibracionVigente   Boolean  // Snapshot: ¿tenía calibración vigente?
  fueNoConforme        Boolean  @default(false) // ¿Se generó con marca de agua roja?
  ipCliente            String?  // IP del cliente (trazabilidad adicional)
  userAgent            String?  // Dispositivo/browser del usuario
  
  equipo    Equipo   @relation(fields: [equipoId], references: [id], onDelete: Restrict)
  usuario   Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Restrict)

  @@index([equipoId])
  @@index([usuarioId])
  @@index([fechaExportacion])
  @@map("dossier_export_logs")
}
```

---

## 3. Índices de Rendimiento Adicionales Requeridos

Las consultas del CRON diario y del endpoint MTBF son costosas sin los índices correctos.

```sql
-- Para el CRON que detecta equipos con calibración vencida
-- Consulta: "Equipos cuya calibración más reciente ya venció"
CREATE INDEX idx_calibraciones_por_equipo_vencimiento
  ON calibraciones (equipo_id, proxima_calibracion DESC);

-- Para el cálculo MTBF: historial de mantenimientos correctivos por equipo
CREATE INDEX idx_mant_correctivos_por_equipo
  ON mantenimientos (equipo_id, tipo_mantenimiento, fecha_mantenimiento)
  WHERE tipo_mantenimiento = 'CORRECTIVO';

-- Para la auditoría de bloqueos automáticos en el dashboard
CREATE INDEX idx_equipos_bloqueados_auto
  ON equipos (estado, es_bloqueo_automatico)
  WHERE es_bloqueo_automatico = true;

-- Para el log de exportaciones por equipo y fecha
CREATE INDEX idx_dossier_log_equipo_fecha
  ON dossier_export_logs (equipo_id, fecha_exportacion DESC);
```

---

## 4. Vistas de Base de Datos Requeridas (Views)

Para evitar lógica compleja repetida en el servicio, se propone una vista materializada para el estado de conformidad de los equipos.

```sql
-- Vista: Estado de conformidad legal de cada equipo
-- Usada por: Dashboard, CRON, y endpoint dossier
CREATE OR REPLACE VIEW vista_conformidad_equipos AS
SELECT
  e.id                              AS equipo_id,
  e.nombre,
  e.estado,
  c.proxima_calibracion             AS vencimiento_calibracion,
  CASE
    WHEN c.proxima_calibracion IS NULL THEN 'SIN_CALIBRACION'
    WHEN c.proxima_calibracion < NOW() THEN 'NO_CONFORME'
    WHEN c.proxima_calibracion < NOW() + INTERVAL '15 days' THEN 'POR_VENCER'
    ELSE 'CONFORME'
  END                               AS estado_conformidad,
  COALESCE(mant_count.total, 0)     AS total_mantenimientos,
  mant_count.ultimo_correctivo      AS fecha_ultimo_correctivo
FROM equipos e
LEFT JOIN LATERAL (
  SELECT proxima_calibracion
  FROM calibraciones
  WHERE equipo_id = e.id
  ORDER BY fecha_calibracion DESC
  LIMIT 1
) c ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int AS total,
    MAX(CASE WHEN tipo_mantenimiento = 'CORRECTIVO' THEN fecha_mantenimiento END) AS ultimo_correctivo
  FROM mantenimientos
  WHERE equipo_id = e.id
) mant_count ON true
WHERE e.deleted_at IS NULL;
```

---

## 5. Plan de Migración Prisma

**Orden de ejecución para no romper FK ni constraints existentes:**

```
Paso 1: Modificar enum EstadoEquipo (ADDITIVE — seguro)
        ALTER TYPE "EstadoEquipo" ADD VALUE 'BLOQUEADO_CERTIFICADO';
        ALTER TYPE "EstadoEquipo" ADD VALUE 'BLOQUEADO_INSPECCION';

Paso 2: Agregar campos a Mantenimiento (todos nullable o con default)
        prisma migrate dev --name "add_hse_fields_mantenimiento"

Paso 3: Agregar campos a Equipo (nullable o con default)
        prisma migrate dev --name "add_bloqueo_auto_equipo"

Paso 4: Crear modelo DocumentoEquipo con enum TipoDocumentoEquipo
        prisma migrate dev --name "create_documentos_equipo"

Paso 5: Crear modelo DossierExportLog
        prisma migrate dev --name "create_dossier_export_log"

Paso 6: Agregar relación inversa Incidente ↔ Mantenimiento
        prisma migrate dev --name "add_mantenimiento_incidente_relation"

Paso 7: Ejecutar SQL de índices adicionales y vista de conformidad
        Manual via psql o migration SQL raw en Prisma
```

---

## 6. Resumen de Cambios por Archivo

| Archivo | Operación | Criticidad |
|---|---|---|
| `schema.prisma` — enum `EstadoEquipo` | Agregar 2 valores | 🔴 CRÍTICO |
| `schema.prisma` — model `Equipo` | Agregar 4 campos + 2 relaciones | 🟡 ALTO |
| `schema.prisma` — model `Mantenimiento` | Agregar 6 campos + 1 relación | 🔴 CRÍTICO |
| `schema.prisma` — model `Incidente` | Agregar relación inversa | 🟡 ALTO |
| `schema.prisma` — enum `TipoDocumentoEquipo` | Crear nuevo enum | 🟡 ALTO |
| `schema.prisma` — model `DocumentoEquipo` | Crear nuevo modelo | 🟡 ALTO |
| `schema.prisma` — model `DossierExportLog` | Crear nuevo modelo | 🟡 ALTO |
| `prisma/migrations/` | 6 migraciones secuenciales | 🔴 CRÍTICO |
| SQL directo (psql) | 4 índices + 1 vista de conformidad | 🟢 MEDIO |

---

## Principio de Diseño: Inmutabilidad del Historial

Todos los modelos de historial técnico (`Mantenimiento`, `Calibracion`, `EjecucionLoto`, `DossierExportLog`) deben usar `onDelete: Restrict` en sus relaciones. Ningún registro de seguridad puede eliminarse físicamente por mandato de la Ley 29783. Solo se admite Soft-Delete en `Equipo` (`deletedAt`).
