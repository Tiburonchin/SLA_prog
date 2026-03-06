# Documento Fundacional: Fase 3 (Cierre, Seguridad y Exportación)

**Proyecto:** Sistema Web de Gestión de Seguridad Laboral (HSE)
**Rol:** Custodio Ágil del Producto
**Estado:** Activa

## 1. Visión Central y Propósito de la Fase 3

La Fase 3 amolda la **Visión Central del Producto** a los requisitos corporativos y legales de la gerencia. Una vez logrado el ecosistema de "cero papel" en campo mediante el Frontend PWA (Fase 2) y el Backend robusto (Fase 1), esta fase añade capacidades de exportación forense inmutable (PDFs), endurecimiento de la seguridad del sistema frente a vulnerabilidades y distribución automática de alertas a directivos (workflows automatizados).

## 2. Generación Inmutable de Reportes (Exportación)

Para suplir al 100% los requerimientos legales (auditorías ministeriales y gerenciales) donde habitualmente se imprimía papel, el sistema adopta una vía automatizada:

- **Generación de PDFs (Puppeteer/PDFKit):** El backend en NestJS expone endpoints para ensamblar reportes consolidados, actas de inspección firmadas y certificados de amonestaciones en formatos `.pdf` imposibles de alterar en terreno. Estos incluyen firmas, fechas, logs geo-referenciados y la evidencia fotográfica capturada.
- **Exportación Estadísticas en CSV:** Emisión de sábanas de datos dinámicas para los Dashboards de la gerencia (utilizados por Recursos Humanos y Jefaturas).

## 3. Seguridad Perimetral y Auditoría del Sistema

Dado que el sistema recolecta el Expendiente Médico/Disciplinario (360°) de personal vulnerable, la seguridad se endurece de acuerdo a políticas corporativas:

- **Trazabilidad Absoluta (Audit Trail):** Integración de mecanismos en NestJS para guardar un "Audit Log". Cada mutación en la base de datos (Ej. "El usuario X cambió fecha de vencimiento Y desde IP Z") queda registrada y expuesta sólo a roles jerárquicos superiores.
- **Manejo Estricto de Sesiones y CORS:** Interceptores web, Helmet.js Headers y validaciones en NestJS para blindar Endpoints contra inyecciones SQL o intentos tipo "Insecure Direct Object Reference (IDOR)".
- **Regulación Paginada y Performance:** Se impone el uso de cláusulas `skip/take` (Prisma) limitadas en todas las tramas de respuesta. Previene asfixia de peticiones (Rate Limiting) y fuga masiva de listados de empleados.

## 4. Workflows y Sistema Proactivo de Alertas

El motor de notificaciones transforma el sistema pasivo en activo:

- **Mailing Automático:** Si un Supervisor emite una "falta Crítica" in situ, la arquitectura acopla un sistema de correos (Ej. Nodemailer o SendGrid) para notificar inmediatamente a las jefaturas correspondientes.

## 5. Trazabilidad de Cambios (Changelog)

- **[Marzo 2026] - Version 1.0.0:** Creación del documento fundacional de la Fase 3. Se consolida el protocolo final del producto, estableciendo la entrega automatizada de documentos gerenciales PDF y el esquema riguroso de auditoría (Log tracking) dentro de NestJS para salvaguardar la información "cero papel" legalmente.
