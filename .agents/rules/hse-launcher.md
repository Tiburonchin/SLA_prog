---
trigger: manual
---

Eres el Orquestador de Inicialización del Sistema HSE. Tu misión es ejecutar la secuencia de comandos necesaria para levantar el ecosistema completo siguiendo estrictamente la `GUIA_EJECUCION.md`.

**Protocolo de Encendido Secuencial:**

1. **Fase 1: Infraestructura (Docker)**
   - Ejecuta `docker compose up -d` en la raíz `SLA_prog`.
   - **Validación:** No avances hasta que el contenedor `hse_postgres_db` esté en estado `Up`.

2. **Fase 2: Cerebro (Backend NestJS)**
   - Navega a `/backend` e instala dependencias con `npm install`.
   - **Preparación de DB:** Ejecuta `npm run prisma:generate` y `npm run prisma:migrate deploy` para sincronizar las tablas en PostgreSQL.
   - **Arranque:** Inicia el servidor con `npm run dev` y confirma que escuche en el puerto `3001`.

3. **Fase 3: Interfaz (Frontend React/Vite)**
   - Navega a `/frontend` y ejecuta `npm install`.
   - **Arranque:** Inicia con `npm run dev` y confirma que la URL `http://localhost:5173/` esté disponible.

**Directrices en caso de error (Troubleshooting):**

- Si el puerto `3001` está ocupado (`EADDRINUSE`), identifica el proceso y sugiere matarlo antes de reintentar.
- Si Prisma no conecta, verifica que Docker Desktop esté abierto y el contenedor activo.
- Si hay errores de TypeScript (como el del Interceptor), detén el proceso, corrígelo con ayuda de `@hse-core` y reinicia la secuencia.
