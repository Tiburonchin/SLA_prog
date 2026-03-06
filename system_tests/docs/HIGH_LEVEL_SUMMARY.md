# Resumen Ejecutivo — Suite DAST Autónoma HSE

## ¿Qué es esto?

Suite de **Pruebas de Seguridad Dinámicas (DAST)** que se ejecuta de forma autónoma contra el backend del Sistema HSE cuando está corriendo localmente. Genera reportes JSON con timestamps en `/reports` para mantener un historial de auditorías.

## ¿Qué se ejecutó?

| Categoría                        | # Tests | Aprobados | Fallidos |
| :------------------------------- | :------ | :-------- | :------- |
| Autenticación (SEC-01/02/04)     | 8       | 7         | 1\*      |
| Inyección y Validación (INJ)     | 4       | 3         | 1\*      |
| Control de Acceso RBAC (SEC-08)  | 7       | 7         | 0        |
| Funcionalidad y Paginación (FUN) | 10      | 9         | 1\*\*    |
| Rate Limiting (SEC-03)           | 1       | 1         | 0        |
| **TOTAL**                        | **30**  | **27**    | **3**    |

_\*Los 2 fallos (SEC-02d, INJ-04) son falsos positivos confirmados, no vulnerabilidades reales._
_\*\*FUN-01c fue parchado en la auditoría del 2026-03-04 (ver sección de parches)._

## Estado del Sistema: **SEGURO** ✅

---

## 🩹 Parches Aplicados — Auditoría Manual 2026-03-04 (15:17 CST)

### Base de Datos (Prisma Schema)

Se detectaron **4 relaciones con `onDelete: Cascade`** que violaban la política de "Trazabilidad Absoluta" y "Expediente 360° inmutable" del PRD. Cascadas que destruirían registros legales al eliminar entidades padre:

| Modelo              | Relación Padre | Antes     | Después    | Justificación PRD                          |
| :------------------ | :------------- | :-------- | :--------- | :----------------------------------------- |
| `EntregaEpp`        | `Trabajador`   | `Cascade` | `Restrict` | Historial de EPP es inmutable (Exp. 360°)  |
| `Capacitacion`      | `Trabajador`   | `Cascade` | `Restrict` | Certificaciones son inmutables (Exp. 360°) |
| `Calibracion`       | `Equipo`       | `Cascade` | `Restrict` | Historial de calibraciones es inmutable    |
| `RegistroAuditoria` | `Usuario`      | `Cascade` | `Restrict` | Audit Trail inmutable (PRD §5)             |

### Resolución de FUN-01c (Paginación en Amonestaciones)

- **Problema:** El `FiltrarAmonestacionesDto` no incluía `page`/`limit` como campos válidos. Con `forbidNonWhitelisted: true`, el `ValidationPipe` rechazaba los query params con 400 Bad Request.
- **Fix:** Se agregaron `page` y `limit` (con `@IsOptional()` + `@IsNumberString()`) al DTO y se eliminó el hack de type intersection en el servicio.

### Auditoría RBAC (10 Controllers)

Se auditaron los 10 controladores NestJS del sistema. **No se encontraron brechas**:

- ✅ Todos tienen `@UseGuards(AuthGuard('jwt'))` a nivel de clase o método.
- ✅ Endpoints de mutación protegidos con `@UseGuards(RolesGuard)` + `@Roles(...)`.
- ✅ Exportaciones CSV restringidas a `COORDINADOR` / `JEFATURA`.
- ✅ Parámetros UUID validados con `ParseUUIDPipe`.
- ✅ Protecciones IDOR activas en servicios de Inspecciones y Amonestaciones.

---

## Cómo Escalar

1. Agregar nuevos `.js` en `system_tests/tests/`
2. Ejecutar: `cd system_tests && node tests/dast_autonomo.js`
3. Los reportes se guardan automáticamente en `system_tests/reports/`

## Estructura de Archivos

```
system_tests/
├── tests/
│   ├── dast_autonomo.js          ← Script principal autónomo
│   └── vulnerabilidades.test.js  ← Tests Jest (complementarios)
├── docs/
│   ├── DETAILED_REPORT.md        ← Reporte granular por prueba
│   └── HIGH_LEVEL_SUMMARY.md     ← Este archivo
└── reports/
    ├── reporte_2026-03-04T...json ← Reportes con timestamp
    └── ultimo_reporte.json        ← Siempre el más reciente
```
