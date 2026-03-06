---
description: Ejecuta una auditoría de seguridad, permisos RBAC y BD en el backend, y genera pruebas E2E en system_tests.
---

Ejecuta la siguiente auditoría integral de Seguridad (DevSecOps) y Arquitectura, basándote estrictamente en el enrutamiento del archivo `INDEX_PROYECTO.md`. Trabaja de forma secuencial y no avances al siguiente paso hasta haber completado exhaustivamente el actual:

**Paso 1: Carga de Políticas y Contexto Base**

- **Objetivo:** Establecer las reglas del juego antes de tocar el código.
- **Acción:** Lee silenciosamente los archivos `/docs/core/Tech Stack - Sistema HSE.md` y `/docs/seguridad/DOCUMENTACION_AUDITORIA.md`.
- **Validación:** Asimila las políticas globales de seguridad, metodologías de defensa y reglas de auditoría requeridas para el código. No sugieras tecnologías fuera del Tech Stack definido.

**Paso 2: Análisis y Corrección de Base de Datos (Prisma)**

- **Objetivo:** Proteger la persistencia de datos y la arquitectura base.
- **Acción:** Consulta `/docs/fases/DOC_FASE_0.md` y `/docs/fases/DOC_FASE_1.md` para entender el andamiaje del CRUD actual. Luego, inspecciona `/backend/prisma/schema.prisma`.
- **Validación:** Verifica la integridad referencial. Asegúrate de que las reglas de borrado en cascada (`onDelete`) sean seguras para no perder expedientes disciplinarios por accidente.
- **Acción Correctiva:** Si detectas relaciones huérfanas o tipos de datos ineficientes, reescribe el esquema de Prisma inmediatamente.

**Paso 3: Resolución Activa de Vulnerabilidades (El Core del QA)**

- **Objetivo:** Parchar bugs de seguridad detectados en pruebas anteriores.
- **Acción:** Abre y lee minuciosamente el archivo `/system_tests/docs/DETAILED_REPORT.md`.
- **Validación:** Extrae el `Payload` inyectado por el test y ubica el `Endpoint` fallido.
- **Acción Correctiva:** Con estos dos datos, inspecciona el Controller/Service correspondiente en la carpeta `/backend/src/` de NestJS, corrobora la falta de validación o el problema de seguridad, y aplica el parche exacto (ej. inyección de guards, sanitización de inputs).

**Paso 4: Auditoría de Seguridad Perimetral y RBAC**

- **Objetivo:** Evitar la introducción de nuevos huecos de seguridad.
- **Acción:** Analiza todos los Controladores de NestJS modificados recientemente.
- **Validación:** Confirma que ningún endpoint nuevo se haya implementado sin seguir las directrices de `/docs/seguridad/DOCUMENTACION_AUDITORIA.md`. Verifica que la lógica de roles diferencie estrictamente los permisos entre Administrador/Coordinador y Operador/Supervisor.
- **Acción Correctiva:** Si falta un decorador JWT o una validación de rol, inyéctalo en el código fuente.

**Paso 5: Actualización de Bitácoras y Reporte Final**

- **Objetivo:** Mantener el historial de auditorías legalmente trazable.
- **Acción:** Basado en las correcciones aplicadas en el Paso 3 y 4, actualiza el archivo `/system_tests/REGISTRO_AUDITORIAS.md`.
- **Destino Final:** Genera un nuevo reporte ejecutivo resumiendo los parches aplicados y guárdalo/actualízalo en la ruta `/system_tests/docs/HIGH_LEVEL_SUMMARY.md`.
