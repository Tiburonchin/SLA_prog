# Documento Fundacional: Fase 1 (Lógica CRUD y Backend)

**Proyecto:** Sistema Web de Gestión de Seguridad Laboral (HSE)
**Rol:** Custodio Ágil del Producto
**Estado:** Activa

## 1. Visión Central y Propósito de la Fase 1

Alineado a la **Visión Central del Producto**, la Fase 1 tiene la misión de construir el "motor de negocio" del sistema. Este backend es el encargado de proveer datos fiables en tiempo real, ejecutar validaciones cruzadas críticas (como evitar que se asigne una herramienta vencida a un trabajo riesgoso) y mantener la seguridad mediante roles. Todo enfocado en agilizar los procesos operativos sin usar una sola hoja de papel.

## 2. Arquitectura del Backend y Tech Stack

El backend es el núcleo de las reglas de negocio, diseñado para ser consumido ágilmente por dispositivos móviles en campo:

- **Node.js y NestJS:** Framework principal utilizado para la construcción de una API RESTful empresarial. La arquitectura modular de NestJS, basada en inyección de dependencias y TypeScript, permite escalar los módulos de (Trabajadores, Inspecciones, Equipos, Amonestaciones) de manera aislada y robusta.
- **Controladores y Servicios REST:** Exposición de endpoints seguros para consumo desde el frontend (SPA) y futuras aplicaciones móviles.
- **Validación de Datos en Entrada (Pipes):** Uso extensivo de `class-validator` y `class-transformer` en NestJS para garantizar que ninguna petición desde el campo ingrese datos sucios o incompletos al sistema.

## 3. Reglas de Negocio Implementadas en esta Fase

1. **Validaciones Cruzadas Activas:** El servicio de Inspecciones revisa automáticamente el estatus de las `Herramientas`. Si una herramienta escaneada excedió su fecha de calibración, la API rechaza la validación de la inspección.
2. **Control de Acceso Basado en Roles (RBAC):** NestJS implementa `Guards` para distinguir entre `Coordinador HSE` (acceso global a Dashboards) y `Supervisor` (limitado a sus sucursales y la creación de checklists in situ).
3. **Manejo Centralizado de Errores:** Filtros de excepciones para devolver mensajes claros a la tablet del supervisor si falta información o la red falla durante la operación de escritura.

## 4. Trazabilidad de Cambios (Changelog)

- **[Marzo 2026] - Version 1.0.0:** Creación del documento fundacional de la Fase 1. Se estandariza el uso de NestJS como orquestador de la lógica de negocio, asegurando que el backend valide proactivamente la condición de los equipos para prevenir accidentes, cumpliendo con la visión central del PRD.
