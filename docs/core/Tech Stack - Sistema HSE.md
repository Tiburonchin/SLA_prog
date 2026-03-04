# **Especificación de Arquitectura y Tech Stack**

**Proyecto:** Sistema Web de Gestión de Seguridad Laboral (HSE)

**Enfoque:** Pila Tecnológica, Base de Datos y Estrategia de Desarrollo Local

## **1\. Visión General de la Arquitectura**

El sistema seguirá una arquitectura **Cliente-Servidor (Frontend desacoplado del Backend)**. Esto permite escalar cada parte de forma independiente y facilita la futura creación de aplicaciones nativas si fuera necesario. Se construirá como una **Single Page Application (SPA)** con capacidades de **Progressive Web App (PWA)** para el uso en campo.

## **2\. Frontend (Interfaz de Usuario y Cliente Móvil)**

El frontend estará diseñado bajo el enfoque *Mobile-First*, optimizado para tablets y smartphones en campo, pero con vistas robustas para los dashboards de escritorio en la oficina.

* **Librería Principal:** **React.js (con TypeScript)**. React permite construir interfaces dinámicas y modulares (como los checklists condicionales). TypeScript es obligatorio para asegurar el tipado estricto y evitar errores en tiempo de ejecución.  
* **Framework:** **Vite.js**. Vite ofrece tiempos de compilación ultrarrápidos y un excelente rendimiento para desarrollo local y SPAs.  
* **Estilos y UI:** **Tailwind CSS**. Framework de utilidades que permite diseñar interfaces rápidas, consistentes y adaptables a cualquier pantalla sin escribir CSS manual excesivo.  
* **Componentes UI:** **shadcn/ui** o **Material UI (MUI)**. Proveen botones grandes, modales y selectores ya accesibles y listos para pantallas táctiles.  
* **Gestión del Estado:** **Zustand**. Una opción más ligera y moderna que Redux para manejar el estado global de la aplicación (datos del usuario logueado, modo offline).  
* **Capacidad Offline (PWA):** **Service Workers (Workbox)**. Esenciales para cachear la aplicación y permitir que el supervisor siga llenando inspecciones si pierde la señal, usando **IndexedDB** en el navegador.

## **3\. Backend (API y Lógica de Negocio)**

El backend será el cerebro del sistema, encargado de procesar las validaciones cruzadas (ej. verificar que una herramienta no esté vencida) y gestionar la lógica de permisos.

* **Entorno de Ejecución:** **Node.js**.  
* **Framework:** **NestJS (con TypeScript)**. Es un framework ideal para aplicaciones empresariales. Su arquitectura modular basada en inyección de dependencias facilita mantener el código ordenado a medida que el sistema crece.  
* **Arquitectura de API:** **API RESTful** (estándar de la industria, fácil de cachear y consumir).  
* **Generación de PDFs:** **Puppeteer** o **PDFKit**. Para la autogeneración de los reportes semanales y los comprobantes de amonestaciones que se envían a gerencia.

## **4\. Base de Datos y Almacenamiento (PostgreSQL)**

Dado que el sistema HSE tiene una naturaleza altamente relacional y manejará datos dinámicos (Checklists IPC), PostgreSQL es la opción definitiva.

* **Base de Datos Principal:** **PostgreSQL**. Es el motor relacional de código abierto más avanzado. Es ideal para este proyecto por su soporte nativo para campos JSONB (perfecto para formularios dinámicos de inspección) y su alta integridad referencial.  
* **ORM (Object-Relational Mapping):** **Prisma**. Provee una forma moderna, segura y autocompletada de interactuar con PostgreSQL desde Node.js/TypeScript. La gran ventaja de Prisma es que permite migrar del entorno local a la nube cambiando una sola variable (DATABASE\_URL).  
* **Almacenamiento de Archivos (Fotos/Evidencias):**  
  * *Fase Local:* Almacenamiento local en el disco duro (carpeta del servidor Node.js) mediante la librería multer.  
  * *Fase Producción:* **Amazon S3** (AWS) o **Supabase Storage**.

## **5\. Autenticación y Seguridad**

La seguridad es crítica dado que se manejan datos personales e historiales disciplinarios.

* **Gestor de Identidad (Auth):**  
  * *Opción 1:* **Firebase Authentication** (Recomendado, fácil de integrar localmente usando sus emuladores).  
  * *Opción 2:* Implementación propia con **JWT (JSON Web Tokens)** y encriptación de contraseñas con **bcrypt** en PostgreSQL (ideal si se quiere control absoluto 100% local).  
* **Autorización y Roles (RBAC):** Gestionado internamente en el backend. Cada petición de la app verificará si el usuario es "Coordinador" o "Supervisor".  
* **Seguridad Web:** Implementación de **Helmet** (cabeceras HTTP seguras) y **CORS** estricto.

## **6\. Entorno de Desarrollo Local y Futuro Despliegue**

La estrategia del proyecto será **"Local-First"**. Todo se desarrollará, probará y validará en un entorno local antes de pensar en la nube.

### **6.1 Fase 1: Entorno Local (Actual)**

* **Base de Datos:** Se ejecutará PostgreSQL utilizando **Docker Desktop** y un archivo docker-compose.yml. Esto mantiene el equipo de desarrollo limpio y simula un servidor real.  
* **Backend y Frontend:** Se ejecutarán en localhost a través de la terminal usando los servidores de desarrollo de Vite y NestJS.  
* **Variables de Entorno:** Uso estricto de archivos .env para separar la configuración local de la futura configuración en la nube.

### **6.2 Fase 2: Despliegue a Producción (Futuro)**

Una vez que el sistema sea funcional a nivel local, se utilizarán los créditos del GitHub Student Pack para el despliegue:

* **Base de Datos PostgreSQL:** Supabase (gratuito) o DigitalOcean Managed Databases.  
* **Alojamiento Backend:** DigitalOcean App Platform o Render.  
* **Alojamiento Frontend:** Vercel o Netlify.

## **7\. Servicios de Terceros (Integraciones)**

* **Correos Electrónicos (Notificaciones):** **SendGrid** o **Nodemailer** (para pruebas locales interceptando correos).  
* **Lectura de QR (Frontend):** **html5-qrcode**. Librería de JavaScript ligera para usar la cámara del dispositivo móvil y escanear credenciales en campo.