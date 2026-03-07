# Documentación de Módulo: Sucursales

**Ubicación:** `/frontend/src/pages/sucursales/` y `/backend/src/modules/sucursales/`
**Estado Actual:** Estable / Implementado V3 (Actualización Arquitectónica Masiva)

---

## 1. Misión del Módulo dentro de la Visión HSE

El módulo **Sucursales** ha evolucionado de un simple directorio de ubicaciones a un **"Centro de Control de Riesgos y Emergencias"**. Cumple con el rol crítico de mantener la trazabilidad legal y operativa de cada sede para garantizar el cumplimiento de la **Ley 29783 (Ley de Seguridad y Salud en el Trabajo)**, las normativas de **SUNAFIL** y las exigencias de **INDECI**. Este módulo permite a los coordinadores HSE y supervisores monitorear en tiempo real los vencimientos de certificados, aforos, niveles de riesgo y estructurar planes de emergencia para evitar clausuras y salvaguardar la vida de los trabajadores.

## 2. Flujo de Arquitectura y Componentes Clave (Frontend)

La interfaz fue rediseñada bajo el concepto de enfoque **Mobile-First** para asegurar que los supervisores de campo puedan reaccionar desde sus dispositivos.

### 2.1 Tablero de Control de Sedes (Grid / Lista)
- **Descripción:** Vista principal que centraliza todas las instalaciones.
- **Funcionalidades Clave:**
  - **Semáforos de Nivel de Riesgo:** Indicadores visuales automáticos que clasifican las sucursales (Bajo, Medio, Alto, Crítico) según su riesgo SST o estado de observaciones de SUNAFIL.
  - **Filtros Avanzados:** Capacidades de búsqueda reactiva por tipo de instalación, nivel de riesgo y estado de vigencia del Certificado DC.

### 2.2 Expediente Digital de Sede (Layout en Pestañas)
- **Descripción:** Sub-ruta para la inspección detallada de una sucursal en formato "Expediente de Sede".
- **Distribución Estructural:**
  - **Header Operativo:** Incluye el nombre de la sede, semáforo de estado y los **Botones de Llamada de Emergencia** directos (médico ocupacional, emergencias de la sede), optimizados para dispositivos móviles (teléfono `href="tel:..."`).
  - **Layout en Pestañas (Tabs):** Permite navegar sin recargas entre diferentes contextos de prevención y legalidad:
    1. **Info Legal e INDECI:** Datos de certificación (Certificado de Defensa Civil, fechas de vencimiento), parámetros de infraestructura (Aforo Máximo, m², pisos, año de construcción), y códigos CIIU.
    2. **Gestión de Emergencias:** Visor de equipamiento (cantidad de extintores, DEA, botiquines), contacto del responsable SST y fechas del plan de emergencias/simulacros.
    3. **Brigadas y Peligros:** Visor de los equipos de primera respuesta y mapa de riesgos, alimentados directamente desde una estructura `JSONB` flexible.
    4. **SUNAFIL:** Historial de inspecciones externas, nivel de cumplimiento (Conforme, Observado, Sancionado) y tracking de observaciones legales activas.

## 3. Motor Cron (Backend) y Reglas de Negocio

La vitalidad del módulo reside en la proactividad de su motor interno, diseñado para delegar el estrés de memoria del Coordinador HSE hacia acciones automatizadas.

- **Servicio Principal:** `SucursalesAlertas.service.ts`
- **Regla de Negocio (INDECI & SUNAFIL):**
  - El sistema Cron evalúa diariamente el campo `vencimientoCertificadoDC` y `fechaVencimientoPlanEmergencia` de cada sucursal activa.
  - **Escala de Alertas:** Se disparan notificaciones preventivas a los **90**, **30** y **7 días** previos al vencimiento.
  - **Objetivo:** Prevenir el cierre o clausura por parte de INDECI o la imposición de multas por comento de SUNAFIL, garantizando tiempo de sobra para tramitar las renovaciones.

## 4. Arquitectura de Base de Datos y Cumplimiento Legal

La estructura de datos (`schema.prisma`) ha sido fuertemente vitaminada para modelar la realidad jurídica de un establecimiento comercial/industrial:

- **Campos Legales y de Infraestructura:**
  - Incorporación de `codigoEstablecimientoINDECI`, `numeroCertificadoDC`, `vencimientoCertificadoDC`, `aforoMaximo` y `areaM2`.
  - Enums categorizadores: `TipoInstalacion`, `NivelRiesgo`, `CategoriaIncendio` y `ResultadoInspeccionSUNAFIL`.
- **Estructuras Dinámicas (`JSONB`):**
  - **`brigadasEmergencia`:** Permite almacenar arrays completos de miembros, roles (Evacuación, Primeros Auxilios, Contraincendios) y estados de certificación sin tablas intermedias innecesarias.
  - **`peligrosIdentificados`:** Mapa flexible de riesgos (Eléctrico, Químico, etc.) geolocalizados por zona y nivel de riesgo, permitiendo a los ingenieros HSE detallar las medidas de control.
- **Auditoría y Borrado Lógico (Soft-Delete):**
  - Implementación estricta de `deletedAt`. Ningún establecimiento se elimina físicamente de la base de datos para preservar el historial ante posibles inspecciones retrospectivas de SUNAFIL o auditorías de la Ley 29783.

## 5. Notas de TSDoc (Regla HSE-DOCS)

Al igual que en los demás módulos del ecosistema, los servicios de backend y los store de React/Zustand asociados a las sucursales cuentan con documentación `TSDoc` auto-generable, especificando la estructura de los payloads de los campos `JSONB` y las mecánicas del motor de alertas (Cron).
