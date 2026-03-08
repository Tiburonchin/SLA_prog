# Reporte Técnico HSE: Gestión Integral de Equipos y Control de Mantenimiento

**Fecha de Evaluación:** 07 de Marzo de 2026  
**Auditor/Especialista:** Experto Senior HSE (Cumplimiento ISO 45001 / 14001)  
**Objetivo:** Definir los requerimientos funcionales y legales para la interfaz de "Detalles de Equipo", diferenciando drásticamente las acciones de "Registrar Mantenimiento" (Ingreso de datos operativos) y "Exportar" (Generación de Dossier Legal para Auditorías).

---

## 1. Diferencia Crítica: Registrar Mantenimiento vs. Exportar

Desde el punto de vista de seguridad industrial y auditoría, estas dos funciones tienen propósitos, públicos y requerimientos legales completamente distintos.

### A. Botón: "Registrar Mantenimiento" (Acción Operativa / Ingreso)
Esta función es utilizada por el **Jefe de Mantenimiento, Supervisor HSE o Técnico Autorizado**. Su objetivo es documentar una intervención para garantizar que el equipo vuelva a ser seguro de operar.

**Campos Críticos Exigidos (Cumplimiento Legal):**
- **Tipo de Intervención:** Preventivo, Correctivo o Calibración. 
  - *Alerta HSE:* Si es correctivo por una falla, el sistema debe preguntar: *"¿Esta falla generó un incidente/accidente?"* y obligar a vincular el reporte de incidente.
- **Protocolo LOTO (Bloqueo y Etiquetado):** Checkbox obligatorio indicando si se aplicó aislamiento de energías peligrosas durante la intervención.
- **Técnico Responsable:** Nombre y validación de que tiene la competencia/certificación para reparar este equipo específico (ej. trabajos eléctricos).
- **Repuestos Cambiados y Disposición Final:** (Cumplimiento ISO 14001) ¿Se generaron residuos peligrosos, como aceites o filtros? Indicar dónde se desecharon.
- **Evidencia Adjunta:** Obligatoriedad de adjuntar el "Reporte de Servicio" firmado o fotografías del antes y después.
- **Próxima Fecha Programada:** Autocalculable para no perder la trazabilidad del programa preventivo.

### B. Botón: "Exportar" / "Generar Dossier" (Acción de Auditoría / Salida)
Esta función es utilizada por el **Inspector de SUNAFIL/Ministerio, Auditor ISO o Gerente HSE**. Su objetivo es demostrar, en papel o digital inalterable (PDF), que el equipo ha cumplido con todo el rigor normativo y es seguro para la vida humana. No es un simple volcado de datos; es un **documento con peso legal**.

**Características del Documento Exportado:**
- **Sello de Tiempo y Trazabilidad:** Fecha y hora exacta de la generación del reporte y quién lo imprimió.
- **Ficha Técnica Consolidada:** Datos de placa del equipo (Marca, Modelo, Serie, Capacidad máxima).
- **Semáforo de Estado Legal:** Un indicador claro en la primera página: "APTO PARA USO" o "PROHIBIDO SU USO (Fuera de estándar)".
- **Historial Filtrado:** Tabla cronológica de los últimos mantenimientos, fallas reportadas y checklists pre-uso recientes.
- **Anexo Documental:** Debe permitir incluir (o listar) los certificados de calibración vigentes. Sin esto, el equipo no es auditable.

---

## 2. Pestañas Requeridas en "Detalles de Equipo"

Para que el sistema sea una herramienta de prevención real en campo y no solo un inventario estático, la vista de equipo debe dividirse en pestañas especializadas. Un operador con prisa debe encontrar la información de peligro al instante.

### Pestaña 1: Ficha Técnica y Criticidad
*El "DNI" del equipo y su nivel de peligro.*
- **Datos Básicos:** Serie, código interno, ubicación actual.
- **Matriz de Riesgo Asociada:** ¿Qué peligros genera este equipo? (Atrapamiento, riesgo eléctrico, ruido > 85dB).
- **EPP Obligatorio:** Iconos grandes indicando qué equipo de protección personal debe usar el operario para interactuar con esta máquina.
- **Condición Actual:** Etiqueta grande y coloreada (Verde = Operativo, Rojo = Bloqueado/Fuera de Servicio).

### Pestaña 2: Inspecciones Pre-Uso (Checklists Diarios)
*Lo que el operario llena antes de arrancar la máquina.*
- **Historial de Checklists:** Lista de las inspecciones realizadas en campo.
- **Alertas de Falla:** Si un operario marcó "Fallo en frenos" en su checklist de la mañana, esto debe resaltar en rojo absoluto y bloquear el equipo automáticamente.
- **Registro Fotográfico Diario:** Evidencias de cualquier anomalía detectada antes del uso.

### Pestaña 3: Trazabilidad de Mantenimientos
*El registro de la vida mecánica del equipo.*
- Línea de tiempo (Timeline) con todas las intervenciones.
- Gráfico simple de "Tiempo medio entre fallas" (MTBF) para identificar si un equipo es un riesgo crónico y debe ser dado de baja por seguridad.

### Pestaña 4: Certificaciones, Manuales y Calibraciones (Documentación Legal)
*La defensa legal ante una inspección gubernamental.*
- **Certificados Vigentes:** Principalmente en equipos de izaje (grúas, eslingas), detección ambiental (gasómetros) o riesgo eléctrico (pértigas). 
- **Semáforo de Vigencia:** Alertas visuales (ej. "Certificado vence en 15 días").
- **Manual del Fabricante:** PDF accesible para que el técnico no improvise durante un mantenimiento y siga las normas de fábrica.

---

## Dictamen Final de UX Ocupacional

Como prevencionista, exijo que el sistema no permita "Errores Humanos". 
1. Si alguien intenta **Registrar un Mantenimiento** e indica que el equipo quedó "Apto", pero no adjunta la firma del técnico, el sistema debe bloquear la acción.
2. Si un equipo tiene su certificado de calibración vencido por un solo día, el botón de **Exportar** debe generar el dossier con una marca de agua roja que diga "EQUIPO NO CONFORME - RIESGO ALTO", e internamente el estado de la Pestaña 1 debe pasar a "Bloqueado".

La prioridad no es la estética del programa, es garantizar que ninguna persona pierda la vida por operar una de estas máquinas en malas condiciones.
