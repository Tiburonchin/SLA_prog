# Documentación Fase 0: Fundación del Sistema HSE

## 1. Descripción General

La **Fase 0** constituye la arquitectura base y los cimientos tecnológicos del Sistema Integrado de Gestión HSE (Health, Safety, and Environment). En esta etapa se construyó la infraestructura de backend y frontend, se diseñó la base de datos maestra y se implementaron las políticas elementales de seguridad, autenticación y diseño.

## 2. Stack Tecnológico Base

- **Backend:** [NestJS](https://nestjs.com/) (Node.js) con TypeScript.
- **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) con TypeScript.
- **Base de Datos:** [PostgreSQL 15](https://www.postgresql.org/) desplegado mediante Docker.
- **ORM:** [Prisma](https://www.prisma.io/).
- **Estilos (Estética Premium):** [TailwindCSS](https://tailwindcss.com/) + Shadcn/UI, con soporte a temas oscuros, animaciones micro (glassmorphism y transiciones fluidas) y diseño responsive.

## 3. Arquitectura y Configuración

- **Monorepo Lógico:** El código está organizado claramente entre `frontend/` y `backend/`.
- **Despliegue Local Dockerizado:** Creación del archivo `docker-compose.yml` para levantar rápida y consistentemente la base de datos.
- **Variables de Entorno:** Configuración global a través de `ConfigModule` de NestJS (para leer archivo `.env`).
- **Conexión Frontend ↔ Backend:** Cliente de la API configurado a través de **Axios**, incluyendo interceptores `request`/`response` para inyectar y procesar tokens JWT automáticamente, centralizando el manejo de errores y códigos HTTP (401, 403, etc.).

## 4. Módulo de Autenticación y Autorización (Security-First)

La seguridad es el pilar de la plataforma:

- **JWT (JSON Web Tokens):** Implementado con `@nestjs/jwt` y Passport. Las contraseñas se encriptan con `bcrypt`.
- **RBAC (Role-Based Access Control):**
  - Sistema de `RolesGuard` en el backend para validar a través del decorador `@Roles()` el nivel de acceso al endpoint (`SUPERVISOR`, `COORDINADOR`, `JEFATURA`).
  - En el frontend, componente `RutaProtegida` para segmentar el acceso visual a las pantallas según el rol logueado.
- **Rate Limiting:** Global a través del `ThrottlerModule` (límite por defecto de 20 peticiones por minuto, 60000 ms TTL), configurado para mitigar ataques DDoS o fuerza bruta.

## 5. Diseño y Layout Inicial

- **Sidebar Navegacional:** Componente colapsable e interactivo (lucide-react icons) con filtrado dinámico de ítems operado por el componente lógico basado en credenciales (ej. `JEFATURA` solo visualiza reportes y dashboard).
- **Top Navbar:** Provee navegación superior contextual, estado de sesión y menús de acceso rápido.
- **UX/UI Moderno:** Configuración del `index.css` definiendo variables globales para un alto contraste, bordes radiados y legibilidad (font-family como Inter u Outfit).

## 6. Verificación de Fase

- Base de datos levantada con `docker compose up -d`.
- Migraciones iniciales (`npm run prisma:migrate`) ejecutadas con éxito en el esquema `hse_database`.
- Rutas de login del backend (`POST /auth/login`) y frontend conectadas y respondiendo `200 OK` devolviendo la información completa de la UI.
