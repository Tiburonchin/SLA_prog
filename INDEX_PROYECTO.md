# 🤖 Índice de Documentación para Agentes de IA - Sistema HSE
**Versión del Índice: v1.3 — Stable Release** _(Sprint Estabilización 3.1 — 2026-03-06)_

Este documento es el **punto de entrada principal** para cualquier Agente de Inteligencia Artificial (IA) o desarrollador que necesite entender, auditar o extender el **Sistema de Gestión HSE**.

**Instrucción crítica para la IA:** No intentes adivinar la arquitectura, el stack o las reglas de negocio. Utiliza el siguiente índice para abrir y leer el documento `.md` que corresponda a la tarea que se te ha asignado.

---

## 🏗️ 1. Definición del Proyecto y Arquitectura (Punto de Partida)

Estos documentos contienen la verdad absoluta sobre qué es el sistema y cómo está construido. **Léelos primero** si recién te unes a la conversación.

| Archivo                               | Ubicación    | Función Principal                                                                                                                                                                               |
| :------------------------------------ | :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`PRD - Sistema de Gestión HSE.md`** | `/docs/core` | **Product Requirements Document.** Define las reglas de negocio, los roles (Admin, Auditor, Operador) y los requerimientos funcionales de cada módulo (Trabajadores, Inspecciones, etc).        |
| **`Tech Stack - Sistema HSE.md`**     | `/docs/core` | **Stack Tecnológico.** Define las tecnologías estrictas (NestJS, React, PostgreSQL, Docker) y los patrones de arquitectura que DEBES respetar. No sugieras tecnologías fuera de este documento. |
| **`GUIA_EJECUCION.md`**               | Raíz (`/`)   | **Guía de Inicialización.** Instrucciones exactas sobre cómo levantar el proyecto en local usando Docker y los scripts de `npm` correctos.                                                      |

---

## 📅 2. Histórico de Desarrollo (Fases)

El proyecto se estructuró en 4 fases metodológicas. Lee estos documentos si necesitas entender cómo evolucionó una característica específica o si buscas el origen de una implementación.

| Archivo             | Ubicación     | Función Principal                                                                                      |
| :------------------ | :------------ | :----------------------------------------------------------------------------------------------------- |
| **`DOC_FASE_0.md`** | `/docs/fases` | Diseño base, modelado de la base de datos (DB Schema) y setup inicial.                                 |
| **`DOC_FASE_1.md`** | `/docs/fases` | Implementación de la lógica base CRUD para entidades principales.                                      |
| **`DOC_FASE_2.md`** | `/docs/fases` | Desarrollo de la Interfaz de Usuario (UI/UX) e integración inicial del Frontend con el Backend.        |
| **`DOC_FASE_3.md`** | `/docs/fases` | Cierre de desarrollo: Seguridad, logs, exportación (PDF/CSV), paginación y corrección de bugs finales. |

---

## 🛡️ 3. Seguridad, Auditorías y Testing

Si tu tarea está relacionada con vulnerabilidades, testing de intrusión (Pentesting), o revisión de logs, dirígete inmediatamente a estos documentos.

| Archivo                          | Ubicación            | Función Principal                                                                                                                                                                                         |
| :------------------------------- | :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`DOCUMENTACION_AUDITORIA.md`** | `/docs/seguridad`    | Políticas globales de seguridad, metodologías de defensa y reglas de auditoría requeridas para el código.                                                                                                 |
| **`REGISTRO_AUDITORIAS.md`**     | `/system_tests`      | Registro unificado y bitácora de los tests automatizados ejecutados (SQL Injections, XSS, etc).                                                                                                           |
| **`HIGH_LEVEL_SUMMARY.md`**      | `/system_tests/docs` | Resumen ejecutivo (métricas y gráficas de éxito/fallo) de la suite de pruebas de seguridad automatizada.                                                                                                  |
| **`DETAILED_REPORT.md`**         | `/system_tests/docs` | **Reporte Técnico de Vulnerabilidades.** Contiene el desglose exhaustivo de los payloads enviados, respuestas del servidor y endpoints específicos que fallaron o pasaron. **Crítico para parchar bugs.** También incluye la sección _"Sprint Estabilización — Fase 3.1"_ con los bugs TS/JSONB corregidos en el sprint de Sucursales & Dashboard. |

---

## 💻 4. Recursos Específicos por Módulo

| Archivo                                   | Ubicación    | Función Principal                                                                                    |
| :---------------------------------------- | :----------- | :--------------------------------------------------------------------------------------------------- |
| **`README.md` (Frontend)**                | `/frontend`  | Configuración específica de la aplicación React web (Vite, Tailwind, variables de entorno frontend). |
| **`Modulos_Trabajadores.md`**             | `/docs/core` | Documentación técnica del módulo Expediente 360° Trabajadores. Incluye edge cases, errores HTTP, borrado lógico y comportamiento null-safe del frontend. |
| **`Modulos_Sucursales.md`**               | `/docs/core` | Documentación técnica del Centro de Control de Riesgos y Emergencias (Sedes). Incluye expansión Sprint 3.1 (35 campos, JSONB, enums, Cron) y edge cases. |
| **`DashboardModule` (backend)**           | `/backend/src/modules/dashboard` | Módulo KPI — endpoint `GET /api/dashboard/riesgos-activos`. Agrega equipos con calibración vencida, trabajadores sin EMO vigente e inspecciones abiertas por sucursal. |
| **`IncidentesModule` (backend)**          | `/backend/src/modules/incidentes` | Módulo de reporte rápido — endpoint `POST /api/incidentes/rapido` (Art. 82 Ley 29783). Solo COORDINADOR y SUPERVISOR. Valida que el trabajador esté activo y no CESADO. |
| **`ERD_Base_de_Datos.md`** ⭐ _v3.0_ | `/docs/core` | **Diagrama E-R-E completo** del schema PostgreSQL (Mermaid). Incluye 22 entidades, cardinalidades, políticas Soft-Delete, ENUMs, campos JSONB y tabla de índices críticos. |

---

## 🎯 Instrucciones de Uso para Agentes IA (Protocolo y Flujo de Acción)

Como Agente de IA, estás programado para seguir este manual de forma estricta. **NO operes a ciegas.** Utiliza los siguientes recursos según la necesidad de la orden que recibas:

### 💡 1. ¿Cómo abordar el Código Existente o Nuevas Funcionalidades (Fases)?

- **Para lógica de Modelo/Base de Datos:** Lee los requerimientos del `PRD` y luego consulta `/docs/fases/DOC_FASE_0.md` y `/docs/fases/DOC_FASE_1.md` para entender cómo se hizo el andamiaje del CRUD actual (Ej. Prisma).
- **Para requerimientos de UI/UX (Botones, Tablas en React):** Dirígete a leer `/docs/fases/DOC_FASE_2.md` y la carpeta `frontend/README.md`.
- **Para reportes (PDF/CSV) y paginación:** Utiliza `/docs/fases/DOC_FASE_3.md`.

### 🛡️ 2. ¿Cómo utilizar la Ayuda de Auditoría y Seguridad?

- **Reglas Maestras:** NUNCA implementes un nuevo endpoint sin consultar primero `/docs/seguridad/DOCUMENTACION_AUDITORIA.md`. Aquí se encuentran las políticas de roles, autenticación y defensas globales.
- **Incidentes y Alertas Registradas:** Si se te pide revisar el historial o resúmenes gerenciales, consulta el `/system_tests/REGISTRO_AUDITORIAS.md` y `/system_tests/docs/HIGH_LEVEL_SUMMARY.md`.

### 🪲 3. ¿Cómo resolver Vulnerabilidades Específicas (El Reporte Detallado)?

- El recurso de mayor valor para parchar código es `/system_tests/docs/DETAILED_REPORT.md`.
- **Instrucción de uso:** Ve al `DETAILED_REPORT.md`, lee minuciosamente el `Payload` inyectado por el test y ubica el `Endpoint` fallido. Con estos dos datos, inspecciona el Controller/Service en NestJS, corrobora la falta de validación o el problema de `onDelete` (Cascada en BD), y aplica el fix.

### ⚙️ Flujo de Ejecución (Paso a Paso)

1. **Analiza el Requerimiento:** Identifica el componente y si la tarea es de Construcción o de Seguridad.
2. **Confirma el Core:** Asegura la tecnología correcta abriendo `/docs/core/Tech Stack - Sistema HSE.md`.
3. **Carga el Contexto:** Usa las instrucciones 1, 2 o 3 (arriba) según tu objetivo y abre esos archivos `.md`, extrayendo la filosofía de trabajo requerida.
4. **Ejecuta, Corrige y Responde:** Redacta y edita el código solucionando la petición del usuario.
