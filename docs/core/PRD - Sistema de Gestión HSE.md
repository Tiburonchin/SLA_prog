# **Documento de Requisitos del Producto (PRD)**

**Proyecto:** Sistema Web de Gestión de Seguridad Laboral (HSE)

**Fecha:** Marzo 2026

**Estado:** Borrador (Fase de Ideación y Especificación Detallada)

## **1\. Introducción**

### **1.1 Propósito**

Desarrollar una aplicación web integral orientada a la seguridad laboral (HSE) que permita digitalizar, centralizar y agilizar los procesos críticos de inspección, control estricto de equipos, registro de amonestaciones y gestión del personal. Históricamente, estos procesos dependen de formatos en papel y hojas de cálculo desconectadas, lo que genera retrasos, pérdida de información y riesgos legales. El nuevo sistema facilitará la comunicación fluida entre áreas, enviará notificaciones automáticas proactivas y proveerá datos fiables en tiempo real a las jefaturas para la toma de decisiones preventivas y correctivas.

### **1.2 Visión del Producto**

Convertirse en la herramienta central y definitiva para la operación diaria del Coordinador HSE y los Supervisores en campo. El objetivo es eliminar por completo el uso de papel en las inspecciones operativas, prevenir incidentes graves mediante el bloqueo del uso de herramientas defectuosas o EPPs inadecuados (por ejemplo, en trabajos críticos en altura o riesgo eléctrico), y mantener un expediente digital 360° de cada trabajador que esté disponible a un clic de distancia en caso de auditorías o emergencias.

## **2\. Objetivos y Métricas de Éxito**

### **2.1 Objetivos del Negocio**

- **Centralización y Estandarización:** Tener una base de datos única, auditable y dinámica para trabajadores, supervisores, ubicaciones y calibraciones, eliminando los silos de información entre las distintas sucursales.
- **Visibilidad en Tiempo Real y Transparencia:** Proveer a las jefaturas y a Recursos Humanos información instantánea sobre el estado real de la seguridad y el cumplimiento normativo en todas las operaciones y proyectos activos.
- **Prevención Operativa Activa:** Asegurar de manera sistemática que ningún trabajador realice tareas de alto riesgo sin contar con los EPPs específicos, las herramientas en regla y las capacitaciones vigentes adecuadas para su cargo.

### **2.2 Métricas de Éxito (KPIs sugeridos)**

- **Adopción:** 100% de digitalización de las inspecciones de campo y permisos de trabajo en los primeros 3 meses de despliegue.
- **Eficiencia:** Reducción del tiempo de generación de informes consolidados de HSE de un promedio de 3 días hábiles a reportes autogenerados en minutos.
- **Cumplimiento de Equipos:** 0% de herramientas o equipos de medición en uso con calibración o mantenimiento vencido en campo (gracias al sistema de bloqueos y alertas tempranas).
- **Tasa de Respuesta:** Reducción en el tiempo de notificación de faltas graves a Recursos Humanos a menos de 5 minutos desde el registro del incidente.

## **3\. Perfiles de Usuario (Personas)**

1. **Coordinador HSE (Administrador):** Usuario principal de "back-office" (en oficina). Requiere acceso total a la configuración del sistema, gestión de matrices IPC, dashboards globales, historial completo de auditorías de toda la empresa y exportación de reportes estadísticos para gerencia.
2. **Supervisor (Usuario de Campo):** Usuario que opera principalmente desde un dispositivo móvil o tablet, a menudo en condiciones ambientales adversas. Necesita interfaces rápidas, botones grandes y flujos intuitivos. Realiza inspecciones in situ, verifica EPPs, toma fotos de evidencia, aprueba permisos de trabajos de alto riesgo (PTAR) y emite amonestaciones en el momento exacto en que ocurren.
3. **Jefatura / Gerencia / Recursos Humanos:** Usuarios de consulta estratégica (solo lectura y dashboards). Acceden a la plataforma para evaluar el clima de seguridad general, visualizar estadísticas rápidas, analizar tendencias de riesgos, revisar KPIs de seguridad y descargar informes consolidados mensuales.
4. **Operario / Trabajador (Sujeto de datos):** En esta fase inicial, el trabajador no interactúa directamente con la aplicación desde su propio dispositivo. Sin embargo, posee un "Perfil Digital" exhaustivo que es consultado, actualizado y auditado por el Supervisor (mediante búsqueda por nombre, DNI o escaneo de código QR en su fotocheck).

## **4\. Requisitos Funcionales (Core Features)**

### **Módulo 1: Base de Datos Maestra (CRUD Dinámico)**

- **Gestión de Trabajadores:** Registro profundo que incluye: Nombre completo, DNI/ID, cargo actual, sucursal asignada, historial de capacitaciones, tallas exactas de EPP (para facilitar compras), tipo de sangre, contactos de emergencia y estado de salud actual (apto, no apto, apto con restricciones).
- **Gestión de Supervisores:** Registro de responsables con asignación específica de permisos por sucursales, zonas geográficas o cuadrillas operativas.
- **Gestión de Calibraciones y Equipos:** Inventario detallado de equipos/herramientas (marca, modelo, número de serie) con fechas de última calibración, próxima calibración requerida, manuales técnicos adjuntos y estado actual (Operativo, En Mantenimiento, Baja Técnica).
- **Ubicaciones e IPC (Identificación de Peligros por Cargo):** Matriz relacional y configurable donde se define de forma estricta qué EPPs, herramientas y capacitaciones previas son de uso obligatorio y excluyente según el cargo específico del trabajador y la ubicación donde realizará la tarea.

### **Módulo 2: Perfil del Trabajador (Expediente 360\)**

- **Vista Rápida de Emergencia y Control:** Al buscar a un trabajador, el sistema debe desplegar en menos de 2 segundos un dashboard individual con:
  - Datos personales, médicos básicos y cargo.
  - Historial completo y fechado de entregas de EPP.
  - Historial disciplinario, amonestaciones previas e incidentes asociados.
  - Semáforo de certificaciones vigentes (ej. Verde: "Certificación para trabajos en altura vigente"; Rojo: "Curso de riesgo eléctrico vencido").
- **Código QR Dinámico:** Generación e impresión de un código QR único por trabajador. El supervisor podrá escanearlo con la cámara de su tablet en el terreno, abriendo el "Expediente 360" al instante sin necesidad de teclear nombres.

### **Módulo 3: Inspecciones y Permisos de Trabajo**

- **Checklist Dinámico y Condicional:** El formulario se adapta basándose en la ubicación y la matriz IPC. Si el supervisor selecciona "Trabajo en Altura \- Cambio de Red Eléctrica", el sistema autogenera una lista de verificación ineludible: arnés dieléctrico, línea de vida con absorbedor, casco dieléctrico, herramientas aisladas (hasta 1000V).
- **Evidencia Fotográfica Inmutable:** Opción para capturar fotos directamente desde la app en tiempo real (evitando subir fotos antiguas de la galería) para evidenciar el cumplimiento o la desviación. Las fotos deben guardar metadatos de fecha y hora.
- **Validación Cruzada de Herramientas:** Al ingresar el código de una herramienta a usar, el sistema hace un cruce automático con la tabla de calibraciones. Si la herramienta está vencida, el sistema arroja una alerta roja y sugiere suspender la tarea.
- **Cierre de Inspección Segura:** Culminación del proceso mediante una validación del supervisor y, si aplica, registro de coordenadas GPS en el momento del cierre.

### **Módulo 4: Gestión de Amonestaciones e Incidentes**

- **Formulario Ágil de Registro:** Diseñado para completarse en menos de un minuto. Campos obligatorios: Operario implicado, Supervisor responsable (autocompletado), Sucursal, Fecha/Hora exacta del evento.
- **Tipificación Estructurada:** Selector estandarizado del motivo de la amonestación (ej. "No uso de EPP", "Acto Inseguro", "Incumplimiento de procedimiento") y clasificación de la severidad de la falta (Leve, Grave, Crítica/Despido).
- **Descripción y Respaldo Visual:** Campo de texto para la relatoría de los hechos, posibilidad de adjuntar testimonios breves y carga obligatoria de fotos de la infracción en el lugar de los hechos.

### **Módulo 5: Dashboard, Reportes y Comunicaciones**

- **Dashboard Analítico para Jefaturas:** Interfaz gráfica rica en datos con actualizaciones en vivo. Debe incluir:
  - Gráficos de barras y mapas de calor mostrando amonestaciones por sucursal y por tipo de falta.
  - Tasas de cumplimiento: Inspecciones completadas satisfactoriamente vs. inspecciones con observaciones críticas.
  - Panel de alertas tempranas para herramientas próximas a vencer su calibración.
- **Motor Proactivo de Notificaciones (Automated Workflow):**
  - Envío de email automático con carácter de urgencia a la Gerencia y a Recursos Humanos al registrarse una falta "Grave" o "Crítica" en el sistema.
  - Alertas automáticas programadas al Coordinador HSE 30, 15 y 5 días antes del vencimiento de cualquier calibración de equipo crítico.
  - Generación y envío automático de reportes semanales ejecutivos en formato PDF a la lista de distribución gerencial.

## **5\. Requisitos No Funcionales**

- **Diseño Responsivo / Mobile-First Extremo:** La interfaz de usuario para el módulo de inspecciones y amonestaciones debe estar hiper-optimizada para dispositivos móviles. Esto implica: alto contraste para lectura bajo luz solar directa, botones grandes para facilitar el uso con guantes de seguridad, y un flujo de pantallas de un solo toque (single-tap).
- **Trazabilidad Absoluta (Audit Trail):** El sistema debe guardar un log inmutable de todas las acciones realizadas en la base de datos (Ej. "El usuario \[Nombre del Supervisor\] modificó la fecha de inspección \[ID\] el día \[Fecha\] desde la IP \[Dirección IP\]"). Esto es vital para peritajes legales en caso de accidentes.
- **Disponibilidad y Rendimiento Óptimo:** La latencia es inaceptable en operaciones de campo. La búsqueda de un perfil de trabajador, la validación de un código QR o la consulta de una herramienta debe resolverse de manera casi instantánea (\< 2 segundos).
- **Seguridad de la Información:** Implementación de accesos estrictamente controlados por roles (RBAC). Las contraseñas deben estar encriptadas (ej. bcrypt), y toda la transferencia de datos debe realizarse bajo protocolos seguros (HTTPS/TLS) dada la sensibilidad de los datos médicos y disciplinarios del personal.

## **6\. Suposiciones e Iteraciones Futuras (Out of Scope para V1)**

- _Asumido (Fase 1):_ Se da por sentado que los dispositivos en campo (smartphones o tablets de los supervisores) tendrán acceso a internet, aunque sea intermitente o de baja velocidad (3G).
- _Fase 2 (Sugerida - PWA Offline):_ Evolucionar la arquitectura hacia una Progressive Web App (PWA) completa utilizando 'Service Workers'. Esto permitirá realizar inspecciones largas en zonas remotas (ej. minas, sótanos o torres de alta tensión) 100% offline, guardando la data en el almacenamiento local del dispositivo y sincronizándola automáticamente en segundo plano cuando se recupere la conexión a internet.
- _Fase 2 (Sugerida - Portal del Empleado):_ Desarrollo de un portal ligero de autogestión para que el Operario, utilizando sus credenciales, pueda iniciar sesión desde su celular personal para consultar sus propias amonestaciones, firmar acuses de recibo de EPPs digitalmente, o reportar condiciones inseguras de manera anónima.

---

## **Registro de Cambios (Changelog)**

| Fecha          | Cambio                                                                                                                                                                                                                                                                                                                           | Justificación (Visión Central)                                                                                                                                                                                                                                                                                                                       | Rol                   |
| :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------- |
| **Marzo 2026** | **(Aplazado) Desactivación de Trabajadores:** Se ha retirado temporalmente la lógica y la interfaz gráfica que permitía a los supervisores desactivar/eliminar trabajadores directamente desde los perfiles individuales y tablas principales.                                                                                   | _Prevención de Feature Creep / Custodia de Datos:_ Eliminar o desactivar trabajadores afecta la inmutabilidad histórica del 'Expediente 360'. Esta función requiere un flujo de permisos más avanzado (solo Coordinador/RRHH) antes de llegar a producción, para evitar incidentes o pérdida de historial por desactivaciones accidentales en campo. | Technical Writer / QA |
| **Marzo 2026** | **(Realizado) Rediseño de Layout Trabajadores:** Migración de visualización de Tallas EPP de formato tabla a tarjetas con iconos visuales (Grid-layout). Compactación del espacio vertical y refactor universal enfocándose en monitores portátiles (desktop-first) sin perder responsividad. Inclusión de pestaña "Documentos". | _Eficiencia en Campo:_ Permite a los Coordinadores/Supervisores visualizar toda la información crítica y médica sin necesidad de hacer scroll continuo. Las métricas de EPP de un escaneo de un vistazo fortalecen la filosofía de uso ágil.                                                                                                         | Technical Writer / UI |
