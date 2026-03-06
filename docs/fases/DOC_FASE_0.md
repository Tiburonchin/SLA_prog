# Documento Fundacional: Fase 0 (Base de Datos y Setup)

**Proyecto:** Sistema Web de Gestión de Seguridad Laboral (HSE)
**Rol:** Custodio Ágil del Producto
**Estado:** Activa

## 1. Visión Central y Propósito de la Fase 0

En estricto apego a la **Visión Central del Producto**, la Fase 0 establece los cimientos infraestructurales y de datos para el sistema. Su objetivo es reemplazar los archivos físicos y hojas de cálculo desconectadas por una base de datos centralizada, relacional y altamente disponible. La premisa "cero papel" comienza aquí, garantizando que el expediente 360° de los trabajadores sea inmutable, seguro y auditable.

## 2. Arquitectura de Almacenamiento y Setup

Para cumplir con la necesidad de datos dinámicos (Checklists condicionales) y la alta integridad referencial, se define el siguiente stack:

- **PostgreSQL:** Motor de base de datos relacional principal. Su soporte nativo para campos `JSONB` es crítico para almacenar los formularios dinámicos y matrices IPC sin perder rendimiento, permitiendo que las inspecciones de campo se adapten a cualquier escenario.
- **Prisma ORM:** Herramienta de mapeo objeto-relacional (ORM) utilizada en conjunto con Node.js/TypeScript. Prisma garantiza un esquema fuertemente tipado desde la base de datos hasta el cliente, reduciendo errores y facilitando migraciones seguras.
- **Docker Desktop:** El entorno de desarrollo local ("Local-First") se orquesta con Docker y un archivo `docker-compose.yml`, asegurando que todos los desarrolladores tengan réplicas exactas del entorno de producción y bases de datos aisladas para pruebas.

## 3. Entidades Core (Modelado Inicial)

El esquema de Prisma debe contemplar al menos las siguientes entidades innegociables para el negocio:

- `Trabajador`: Perfil detallado (DNI, aptitud médica, certificaciones).
- `Usuario` (Supervisores/Administradores): Gestión de accesos y roles (RBAC).
- `Equipo/Herramienta`: Registro de calibraciones y estados (Operativo/Baja).
- `Ubicacion/Sucursal`: Contexto geográfico para la matriz IPC.
- `Inspeccion`: Contenedor principal de los checklists, ligado al Supervisor y la Ubicación.

## 4. Trazabilidad de Cambios (Changelog)

- **[Marzo 2026] - Version 1.0.0:** Creación del documento fundacional de la Fase 0. Se decreta el uso definitivo de PostgreSQL y Prisma para habilitar un esquema que soporte el reemplazo total del papel, garantizando la trazabilidad histórica exigida por las jefaturas.
