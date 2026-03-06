# Documento Fundacional: Fase 2 (UI/UX Frontend)

**Proyecto:** Sistema Web de Gestión de Seguridad Laboral (HSE)
**Rol:** Custodio Ágil del Producto
**Estado:** Activa

## 1. Visión Central y Propósito de la Fase 2

En estricto apego a la **Visión Central del Producto**, la Fase 2 tiene como objetivo materializar la herramienta principal para la operación diaria del Supervisor en campo. Esta fase construye un frontend extremadamente rápido, hiper-optimizado para dispositivos móviles y altamente resiliente ante la falta de conectividad (minas, sótanos). El propósito es asegurar que la labor de prevención (auditorías, amonestaciones) nunca se detenga y lograr un "cero papel" efectivo.

## 2. Arquitectura del Frontend y Tech Stack

Para cumplir con los objetivos operativos, el frontend se diseña como una **Single Page Application (SPA)** con capacidades **Progressive Web App (PWA)**:

- **React.js con TypeScript:** Pieza central para crear interfaces dinámicas. Es indispensable para renderizar los checklists operacionales condicionales en base a las API expuestas por NestJS. TypeScript otorga seguridad en la compilación.
- **Vite.js:** Herramienta de construcción (bundler) ultrarrápida, crucial para una experiencia de desarrollo local ágil.
- **Tailwind CSS v4 (Mobile-First Extremo):** Framework de utilidades fundamental para el diseño. Garantiza reglas de alto contraste bajo luz solar (vital en campo) y facilita crear interfaces limpias de un solo toque (single-tap) con botones accesibles para el uso de guantes protectores.
- **Componentes UI (shadcn/ui o Material UI):** Sistema de componentes modulares previamente probados y accesibles para agilizar la entrega gráfica.

## 3. Resiliencia Offline y Trabajo en Terreno

La inspección HSE en zonas remotas impone condiciones severas sobre la aplicación:

- **Zustand:** Gestor de estado global y liviano. Provee una fuente de la verdad para el progreso de la inspección actual sin recargar la memoria del dispositivo móvil.
- **Workbox (PWA) e IndexedDB:** Implementación de Service Workers para cachear recursos estáticos y data de configuración (matrices IPC). Los datos de inspecciones y amonestaciones generados sin señal 4G/Wifi persistirán en la IndexedDB local hasta recuperar conexión, subiendo en segundo plano transparentemente al backend.
- **html5-qrcode (Expediente 360°):** Capacidad del dispositivo móvil (tablet/smartphone) para leer códigos QR de credenciales de operarios, evitando captura manual e identificando instantáneamente al trabajador.

## 4. Trazabilidad de Cambios (Changelog)

- **[Marzo 2026] - Version 1.0.1:** Actualización integral del documento fundacional de la Fase 2. Se ratifica la alineación estricta con Tailwind CSS v4 para diseño Mobile-First y la arquitectura offline PWA con React/Zustand para uso pesado en campo, consolidando la modernización tecnológica y prohibiendo explícitamente soluciones de escritorio para supervisores.
