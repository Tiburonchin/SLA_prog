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
