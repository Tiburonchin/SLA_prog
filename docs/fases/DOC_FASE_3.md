# Documentación Fase 3: Dashboard Analítico, Reportes y PDF

## 1. Descripción General

La **Fase 3** consolida los datos recolectados en terreno y transaccionales para convertirlos en _Inteligencia de Negocios_ y generación de evidencia. Se enfoca en entregar trazabilidad visual (gráficas y reportes KPIs), facilitar extracciones CSV con gobernanza de roles, y compilar reportes PDF de ejecutividad a través de módulos especializados en el servidor.

## 2. Dashboard Analítico (Business Intelligence UI)

Implementado en el Frontend a través de la interfaz de Recharts (moderno sistema gráfico en React).

- **Amonestaciones por Sucursal (Barras):** Exposición volumétrica subdividiéndose la información automáticamente entre grados `Leve`, `Grave` y `Critica` en cada sede operativa. Funciona de manera elástica y es alimentada por un endpoint especializado del Backend (`/estadisticas/por-sucursal`).
- **KPIs Visuales y Donuts (Severidad y Estados):**
  - Interfaz de anillos proporcionando ratio de cumplimiento entre "Inspecciones en curso", "Finalizadas" y "Canceladas".
  - Tarjetas sumarias con colores semánticos (Verde éxito, Naranja cuidado, Rojo peligro).
- **Tracker de Calibraciones (Sistema Alarma):** Grilla scrolleable visualizando las herramientas "Próximas a vencer". Tiene un _Semáforo Dinámico_ que advierte visualmente si el vencimiento es a <5 días, <15 días o <30 días usando colores cálidos incrementales en UI.

## 3. Descargas de Data Directa (Exportaciones CSV Seguras)

Se consolidó una solución rápida e indolora de reportería masiva directa.

- Exportación de formato **CSV con codificación BOM UTF-8** para importación universal limpia en Excel por parte de los supervisores o gerencia.
- **Control por Roles estricto (Backend/Frontend):** En el backend, endpoints como `/exportar/csv` para inspecciones y amonestaciones están estrictamente decorados con `@Roles('COORDINADOR', 'JEFATURA')`, asegurando que el supervisor básico (de piso) no tenga autorización para bajar la matriz de negocio.

## 4. Motor de Reportes Ejecutivos (Backend / PDFKit)

Arquitectura generativa de documentos compilados sin intervención Frontend.

- **Módulo Reportes NestJS:** Se diseñó el `ReportesModule` el cual expone un endpoint (`GET /reportes/pdf/semanal`).
- **Creación On-the-Fly:** Mediante el paquete `PDFKit`, de manera streaming, crea y encapsula en buffers el documento estructurado.
- **Data inyectada en Documento PDF:** Recopila KPIs de la semana pasada (Volumen inspecciones, finalizadas, número de sanciones, y cuántas son críticas) listando además textualmente en tintas rojas aquellos instrumentos próximos a quedar fuera del margen de calibrabilidad en los siguientes 30 días. Todo esto lo transfiere como binario tipo MIME `application/pdf` descargable automáticamente al clic del usuario.

## 5. Control de Vista Jefatura (Layout RBAC)

La interfaz del **Sidebar** ha evolucionado implementando un renderizado condicionado.
La constante de navegación se filtra transparentemente; un usuario portador de rol `JEFATURA` u homologable pierde visibilidad del clutter operacional (Matriz IPC, alta de sucursales o escaner QR) y únicamente visualiza métricas de alto nivel (Dashboard y Reportes), logrando el estándar estricto de software as a service por permisos.

_(Nota interna: Motor de Notificaciones Nodemailer/Cron aplazado intencionalmente previniendo configuración SMTP comercial final)._
