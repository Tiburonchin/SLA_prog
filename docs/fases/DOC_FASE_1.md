# Documentación Fase 1: Gestión de Personal y Perfil 360°

## 1. Descripción General

La **Fase 1** introduce los primeros módulos funcionales centrados en la **Base de Datos Maestra** interactiva (Módulo 1) y el **Perfil 360° del Trabajador** (Módulo 2). El propósito es centralizar los registros del personal, infraestructura y activos, permitiendo trazabilidad de entregas y control del estado operativo.

## 2. Base de Datos Maestra (Módulo 1)

Desarrollo completo de operaciones CRUD (Create, Read, Update, Delete) en backend (Services y Controllers con ParseUUIDPipe strict) y frontend (Vistas de tablas modernas y modales rápidos):

- **Sucursales:** Gestión de centros de trabajo. Control central.
- **Trabajadores:** Motor base de personal activo/inactivo.
  - _Arquitectura:_ Se incluyó soporte de **Paginación** del lado del servidor (limit/skip de Prisma) para obtener un tiempo de respuesta ultra-rápido independientemente del tamaño del set de datos (`/api/trabajadores?page=1&limit=20`).
- **Supervisores:** Separación de credenciales operativas. Solo accesibles para `COORDINADOR`.
- **Equipos e Instrumentos:** Gestión de activos con fechas de próxima calibración. Lógica backend rechaza ingresos de calibraciones no válidas (`BadRequestException`).
- **Matriz IPC (Identificación de Peligros y Control):** Centro de configuración global por cargo y ubicación para estandarizar requisitos de EPP e historial. Emplea sanitización estricta (`Transform` y `trim`) desde el DTO para evitar inconsistencias en base de datos de texto plano.

## 3. Módulo de Perfil 360° Operativo (Módulo 2)

Crea una vista global de la condición de habilitación de un empleado.

- **Histórico Integral:** Las pantallas del frontend integran de forma panorámica la información básica, EPPs asignados, capacitaciones recibidas y fallas de conducta en una sola vista de "timeline" / ficha técnica.
- **Registro Funcional Rápido:** Capacidad de documentar Entregas de EPP y Constancias de Capacitaciones. Actualizan el estado general del trabajador a través de modales ágiles e intuitivos sin cambiar de página.

## 4. Tecnología QR Code

- **Generación (Frontend):** Vistas equipadas para crear códigos de seguimiento de Trabajador (DNI/ID interno) y Equipos.
- **Escaner Web Nativo:** Incorporación del módulo de lectura `PaginaEscanerQr` usando acceso directo a la webcam de escritorio y móvil, optimizando sustancialmente los flujos en terreno para cargar información de manera automática a la vista del perfil 360° o registro de herramientas.

## 5. Cimientos de Seguridad y Escalabilidad Operacional

- Todas las validaciones de input fluyen por medio de `class-validator` y restricciones en los `pipe` de NestJS.
- Paginación backend (para prevenir cuellos de botella memory heap bounds).
