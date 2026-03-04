# 📋 Registro Maestro de Auditorías DAST — Sistema HSE

Este archivo es el **índice central** de todas las ejecuciones de la suite DAST.
Cada entrada documenta: fecha, versión del script, resultado, y la ruta a los reportes generados.

---

## Convención de Carpetas

```
system_tests/
├── scripts/                    ← Scripts de prueba (código fuente)
│   └── dast_autonomo.js
├── docs/                       ← Documentación estática de referencia
│   ├── DETAILED_REPORT.md      ← Reporte granular (actualizado por ejecución)
│   └── HIGH_LEVEL_SUMMARY.md   ← Resumen ejecutivo a gran escala
├── reports/                    ← Reportes JSON automáticos por ejecución
│   ├── 2026-03-03/             ← Carpeta por fecha
│   │   └── reporte_22-50.json
│   ├── 2026-03-04/
│   │   └── reporte_09-30.json
│   └── ultimo_reporte.json     ← Siempre apunta al más reciente
└── REGISTRO_AUDITORIAS.md      ← ESTE ARCHIVO (índice maestro)
```

---

## Historial de Ejecuciones

| #   | Fecha      | Hora (CST) | Tests | ✅  | ❌  | %     | Ruta del Reporte                        | Notas                                                                 |
| :-- | :--------- | :--------- | :---- | :-- | :-- | :---- | :-------------------------------------- | :-------------------------------------------------------------------- |
| 001 | 2026-03-03 | 22:50      | 30    | 27  | 3   | 90.0% | `reports/2026-03-03/reporte_22-50.json` | Ejecución inicial. 3 falsos positivos (SEC-02d, INJ-04, FUN-01c).     |
| 002 | 2026-03-04 | 05:00      | 30    | 27  | 3   | 90.0% | `reports/2026-03-04/reporte_05-00.json` | Ejecución autónoma validando auto-ordenamiento de carpetas por fecha. |

---

## Cómo Registrar una Nueva Ejecución

1. Ejecuta el script: `cd system_tests && node scripts/dast_autonomo.js`
2. El script crea automáticamente la carpeta de fecha y guarda el JSON.
3. Agrega una fila nueva a la tabla de arriba con los datos del reporte.

---

## Leyenda de Categorías de Tests

| Prefijo  | Significado                            | Referencia                 |
| :------- | :------------------------------------- | :------------------------- |
| SEC-XX   | Seguridad (Auth, JWT, Rate Limit, CSV) | DOCUMENTACION_AUDITORIA.md |
| INJ-XX   | Inyección (SQL, UUID, Path Traversal)  | OWASP A03:2021             |
| RBAC-XX  | Control de Acceso por Rol              | OWASP A01:2021             |
| FUN-XX   | Funcionalidad (Paginación, Endpoints)  | Requisitos funcionales     |
| STATS-XX | Estadísticas y Dashboards              | Módulo 5                   |
| CRUD-XX  | Operaciones básicas CRUD               | Módulos 1-4                |
