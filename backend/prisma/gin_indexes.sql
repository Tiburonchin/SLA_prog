-- =========================================================
-- FASE 3: Índices GIN para campos JSONB en Matriz IPC
-- Permiten búsquedas O(log n) dentro de objetos JSON sin
-- escanear toda la tabla. Crítico cuando la matriz escala
-- a cientos de cargos con requisitos de EPP complejos.
-- =========================================================

-- Índice GIN: buscar qué cargos requieren un EPP específico
CREATE INDEX IF NOT EXISTS idx_matriz_epps_gin
  ON matriz_ipc USING gin("eppsObligatorios");

-- Índice GIN: buscar qué cargos requieren una herramienta específica
CREATE INDEX IF NOT EXISTS idx_matriz_herramientas_gin
  ON matriz_ipc USING gin("herramientasRequeridas");

-- Índice GIN: buscar qué cargos requieren una capacitación específica
CREATE INDEX IF NOT EXISTS idx_matriz_capacitaciones_gin
  ON matriz_ipc USING gin("capacitacionesRequeridas");

-- Índice GIN: búsqueda dentro del checklist dinámico de inspecciones
CREATE INDEX IF NOT EXISTS idx_inspeccion_checklist_gin
  ON inspecciones USING gin(checklist);

-- =========================================================
-- FASE 3: Índices de rendimiento para el Dashboard / Audit
-- Columnas camelCase requieren comillas dobles en PostgreSQL
-- =========================================================

-- Índice para queries de auditoría por usuario (historial de acciones)
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario
  ON registros_auditoria("usuarioId", "creadoEn" DESC);

-- Índice para queries por entidad (ej: todos los cambios de un trabajador)
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad
  ON registros_auditoria(entidad, "entidadId");

-- Índice de ordenamiento temporal para el Dashboard (logs más recientes primero)
-- NOTA: Los índices parciales con NOW() no son posibles en PostgreSQL (función VOLATILE).
-- La paginación por fecha se maneja vía este índice B-tree con ORDER BY "creadoEn" DESC.
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha_desc
  ON registros_auditoria("creadoEn" DESC);

-- =========================================================
-- FASE 4: Índices de rendimiento — Módulo Gestión de Equipos
-- Sección 3 del Reporte de Desarrollo de BD (2026-03-07)
-- =========================================================

-- Para el CRON diario que detecta equipos con calibración vencida
-- Consulta: "calibración más reciente de cada equipo ordenada por vencimiento"
CREATE INDEX IF NOT EXISTS idx_calibraciones_por_equipo_vencimiento
  ON calibraciones ("equipoId", "proximaCalibracion" DESC);

-- Para el cálculo MTBF: historial de mantenimientos correctivos por equipo
-- Índice parcial — solo filas CORRECTIVO, reduciendo tamaño del índice al mínimo
CREATE INDEX IF NOT EXISTS idx_mant_correctivos_por_equipo
  ON mantenimientos ("equipoId", "tipoMantenimiento", "fechaMantenimiento")
  WHERE "tipoMantenimiento" = 'CORRECTIVO';

-- Para la auditoría de bloqueos automáticos en el dashboard
-- Índice parcial — solo equipos con esBloqueoAutomatico=true
CREATE INDEX IF NOT EXISTS idx_equipos_bloqueados_auto
  ON equipos (estado, "esBloqueoAutomatico")
  WHERE "esBloqueoAutomatico" = true;

-- Para el log de exportaciones por equipo, ordenado por fecha descendente
CREATE INDEX IF NOT EXISTS idx_dossier_log_equipo_fecha
  ON dossier_export_logs ("equipoId", "fechaExportacion" DESC);

-- GIN sobre el JSONB eppObligatorio de equipos (búsquedas por tipo de EPP requerido)
CREATE INDEX IF NOT EXISTS idx_equipos_epp_gin
  ON equipos USING gin("eppObligatorio");

-- =========================================================
-- FASE 4: Vista de conformidad legal de equipos
-- Requerida por: Dashboard CRON, endpoint dossier, alertas
-- =========================================================

CREATE OR REPLACE VIEW vista_conformidad_equipos AS
SELECT
  e.id                                          AS equipo_id,
  e.nombre,
  e.estado,
  c.proxima_calibracion                         AS vencimiento_calibracion,
  CASE
    WHEN c.proxima_calibracion IS NULL           THEN 'SIN_CALIBRACION'
    WHEN c.proxima_calibracion < NOW()           THEN 'NO_CONFORME'
    WHEN c.proxima_calibracion < NOW() + INTERVAL '15 days' THEN 'POR_VENCER'
    ELSE                                              'CONFORME'
  END                                           AS estado_conformidad,
  COALESCE(mant_count.total, 0)                 AS total_mantenimientos,
  mant_count.ultimo_correctivo                  AS fecha_ultimo_correctivo
FROM equipos e
LEFT JOIN LATERAL (
  SELECT "proximaCalibracion" AS proxima_calibracion
  FROM calibraciones
  WHERE "equipoId" = e.id
  ORDER BY "fechaCalibracion" DESC
  LIMIT 1
) c ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int AS total,
    MAX(CASE WHEN "tipoMantenimiento" = 'CORRECTIVO' THEN "fechaMantenimiento" END) AS ultimo_correctivo
  FROM mantenimientos
  WHERE "equipoId" = e.id
) mant_count ON true
WHERE e."deletedAt" IS NULL;
