# 🚀 Guía de Operación y Despliegue — Sistema de Gestión HSE

¡Bienvenido a la documentación de despliegue del **Sistema Integrado de Gestión HSE**! Esta guía está diseñada para llevarte paso a paso por el proceso de instalación, configuración y ejecución del ecosistema completo (Frontend, Backend y Base de Datos).

---

## 📋 Requisitos y Pre-requisitos del Sistema

Antes de iniciar, asegúrate de contar con el siguiente stack de software instalado en tu equipo de desarrollo:

| Componente         | Versión Sugerida   | Para qué se usa                        | Dónde Descargar                   |
| :----------------- | :----------------- | :------------------------------------- | :-------------------------------- |
| **Node.js**        | `v18.x` o Superior | Ejecución de Backend y Frontend        | [Node.js](https://nodejs.org/)    |
| **npm**            | `v9.x` o Superior  | Gestor de paquetes nativo de Node      | Incluido en Node.js               |
| **Docker Desktop** | `v4.x` o Superior  | Despliegue aislado de la Base de Datos | [Docker](https://www.docker.com/) |

> [!TIP]
> **Autocomprobación Rápida:**
> Abre tu terminal y ejecuta `node -v`, `npm -v` y `docker --version`. Si los tres comandos devuelven una versión sin errores, ¡estás listo para continuar!

---

## 🗄️ Fase 1: Desplegar Base de Datos (PostgreSQL)

El sistema requiere de una base de datos **PostgreSQL**, la cual hemos configurado para ejecutarse ágilmente vía Docker a fin de evitar instalaciones pesadas.

1. Abre una terminal (Terminal 1) en la **raíz principal de tu proyecto** (la carpeta `SLA_prog`).
2. Ejecuta el comando de construcción en segundo plano (detached):

```bash
docker compose up -d
```

> [!NOTE]
> **Credenciales Integradas:**
> Tu contenedor expondrá el puerto `5432` a `localhost` con las siguientes credenciales hardcodedadas en el ambiente local:
>
> - **Usuario:** `Ramosa`
> - **Password:** `Ramosa3097`
> - **Base de Datos:** `hse_database`

---

## ⚙️ Fase 2: Configurar e Iniciar Backend (NestJS + Prisma)

El "cerebro" y API central de tu aplicación corre con **NestJS** y se conecta a Postgres usando **Prisma ORM**.

1. Abre una nueva terminal (Terminal 2) y navega al directorio del backend:

```bash
cd backend
```

2. Instala todas las dependencias del servidor:

```bash
npm install
```

3. Asegúrate de tener tu archivo `.env` configurado. Si no existe, créalo y pon lo siguiente:

```env
# Conexión principal a Base de Datos
DATABASE_URL="postgresql://Ramosa:Ramosa3097@localhost:5432/hse_database?schema=public"

# Parámetros de Seguridad JWT
JWT_SECRET="ClaveSeguraHSE2026_secreta"
JWT_EXPIRATION="24h"

# Puerto de despliegue de la API
PORT=3001
```

4. Prepara la Base de Datos. Genera los clientes de acceso e inicializa las tablas (migraciones):

```bash
npm run prisma:generate
npm run prisma:migrate deploy
```

_(Puedes correr `npm run prisma:seed` si un script semilla de datos prueba existiese)._

5. Levanta el servidor Backend:

```bash
npm run dev
```

> [!SUCCESS]
> **¡Éxito!** Deberías ver líneas verdes de `[NestApplication]` indicando que ha inicializado en el puerto 3001.

---

## 🎨 Fase 3: Iniciar el Frontend (React + Vite)

El portal visual para operadores, supervisores y jefatura.

1. Abre otra terminal adicional (Terminal 3) y mueve la ruta a `fronted`:

```bash
cd frontend
```

2. Realiza la instalación de paquetes de la vista:

```bash
npm install
```

3. Confirma tu `.env`. Vite requiere saber a dónde consultar la API. Crea o edita el `.env` del frontend:

```env
VITE_API_URL=http://localhost:3001/api
```

4. Despliega el entorno interactivo:

```bash
npm run dev
```

> [!SUCCESS]
> **¡En Vivo!** Recibirás la notificación de que Vite expuso Local: `http://localhost:5173/`. ¡Abre ese enlace en tu navegador (Recomendado: Chrome o Edge)!

---

## 🛠️ Herramientas Complementarias

### Prisma Studio (Trazabilidad Visual de Datos)

Si deseas entrar y revisar manualmente tablas CRUD de tu base de datos (Ej. trabajadores, amonestaciones), Prisma te ofrece un "workbench" web.

Abre una terminal en `backend` y ejecuta:

```bash
npm run prisma:studio
```

Esto abrirá un portal en tu explorador (Típicamente `localhost:5555`).

---

## 🔑 Credenciales de Acceso (Entorno de Desarrollo)

Al arrancar el sistema por primera vez, se pre-cargan los siguientes usuarios de prueba. Úsalos para navegar y probar cada módulo según su rol:

| Rol             | Email                 | Contraseña      | Acceso                                                |
| :-------------- | :-------------------- | :-------------- | :---------------------------------------------------- |
| **Coordinador** | `coordinador@hse.com` | `AdminHSE2026!` | Acceso total a todos los módulos                      |
| Supervisor 1    | `supervisor1@hse.com` | `AdminHSE2026!` | Operación (Trabajadores, Equipos, Inspecciones, etc.) |
| Supervisor 2    | `supervisor2@hse.com` | `AdminHSE2026!` | Operación (Trabajadores, Equipos, Inspecciones, etc.) |
| Gerencia        | `gerencia@hse.com`    | `AdminHSE2026!` | Dashboard y Reportes                                  |

> [!TIP]
> **Recomendación:** Inicia sesión como **Coordinador** para tener visibilidad completa del sistema durante pruebas.

---

## 📦 Módulos Funcionales del Sistema

El sistema se compone de los siguientes módulos. Cada uno tiene su propia sección en el panel lateral (sidebar) una vez autenticado.

### 📊 Dashboard (`/`)

- **Acceso:** Todos los roles
- **Descripción:** Panel principal con indicadores clave (KPIs), gráficas de tendencias, y resumen general del estado HSE de la organización.

---

### 👷 Trabajadores (`/trabajadores`)

- **Acceso:** Coordinador, Supervisor
- **Descripción:** Gestión del catálogo de trabajadores. Alta, edición y detalle individual (`/trabajadores/:id`). Incluye historial de amonestaciones y asignación de EPPs.

---

### 👔 Supervisores (`/supervisores`)

- **Acceso:** Solo Coordinador
- **Descripción:** Administración de cuentas de Supervisor. Registro, edición y detalle (`/supervisores/:id`).

---

### 🏢 Sucursales (`/sucursales`)

- **Acceso:** Coordinador, Supervisor (vista); Coordinador (creación/edición)
- **Descripción:** Catálogo de sucursales/plantas de la empresa. Cada sucursal agrupa trabajadores, equipos e inspecciones.

---

### 🛠️ Equipos (`/equipos`)

- **Acceso:** Coordinador, Supervisor
- **Descripción:** Inventario de equipos de protección personal y herramientas. Alta, edición y detalle (`/equipos/:id`). Control de estado y asignación.

---

### ✅ Inspecciones (`/inspecciones`)

- **Acceso:** Coordinador, Supervisor
- **Descripción:** Módulo central de inspecciones de seguridad en campo. Funcionalidades principales:
  - **Crear inspección:** Seleccionar supervisor, sucursal, ubicación y tipo de trabajo.
  - **Checklist automático:** Se genera un listado de verificación basado en la Matriz IPC según el tipo de trabajo seleccionado (EPPs obligatorios, herramientas requeridas, capacitaciones).
  - **Seguimiento de estado:** Cada inspección puede estar `EN_PROGRESO`, `COMPLETADA` o `CANCELADA`.
  - **Barra de progreso:** Visualización en tiempo real del avance de ítems aprobados vs. pendientes.
  - **Filtros y búsqueda:** Por tipo de trabajo, ubicación, sucursal y estado.

---

### ⚠️ Amonestaciones (`/amonestaciones`)

- **Acceso:** Coordinador, Supervisor
- **Descripción:** Registro y gestión de amonestaciones a trabajadores por incumplimiento de normas HSE. Permite documentar la falta, asociarla a un trabajador y dar seguimiento.

---

### 📋 Matriz IPC (`/matriz-ipc`)

- **Acceso:** Solo Coordinador
- **Descripción:** Matriz de Identificación de Peligros y Control. Define por cargo/tipo de trabajo los EPPs obligatorios, herramientas requeridas y capacitaciones necesarias. Esta matriz alimenta automáticamente el checklist de las **Inspecciones**.

---

### 📄 Reportes (`/reportes`)

- **Acceso:** Todos los roles
- **Descripción:** Generación y descarga de reportes semanales en formato PDF. Incluye estadísticas del período, resumen de inspecciones y tendencias de cumplimiento.

---

### 📷 Escáner QR (`/escaner`)

- **Acceso:** Coordinador, Supervisor
- **Descripción:** Lectura de códigos QR para identificación rápida de trabajadores y equipos en campo.

---

## 🗂️ Resumen de Rutas y Permisos

| Ruta              | Módulo         | Coordinador | Supervisor | Gerencia |
| :---------------- | :------------- | :---------: | :--------: | :------: |
| `/`               | Dashboard      |     ✅      |     ✅     |    ✅    |
| `/trabajadores`   | Trabajadores   |     ✅      |     ✅     |    ❌    |
| `/supervisores`   | Supervisores   |     ✅      |     ❌     |    ❌    |
| `/sucursales`     | Sucursales     |     ✅      |     ✅     |    ❌    |
| `/equipos`        | Equipos        |     ✅      |     ✅     |    ❌    |
| `/inspecciones`   | Inspecciones   |     ✅      |     ✅     |    ❌    |
| `/amonestaciones` | Amonestaciones |     ✅      |     ✅     |    ❌    |
| `/matriz-ipc`     | Matriz IPC     |     ✅      |     ❌     |    ❌    |
| `/reportes`       | Reportes       |     ✅      |     ✅     |    ✅    |
| `/escaner`        | Escáner QR     |     ✅      |     ✅     |    ❌    |

---

## 🔄 Sincronización entre Equipos (Trabajo ↔ Casa)

Esta sección detalla el flujo de trabajo diario para sincronizar la base de datos entre la PC del Trabajo (Docker Desktop estándar) y la PC de Casa (Virtualización Híbrida: Ubuntu + Vagrant + VirtualBox).

### 1. Salida (Desde la PC del Trabajo - Docker Desktop)

Abre tu terminal en Windows y exporta la base de datos:

```bash
docker exec -t hse_postgres_db pg_dumpall -c -U Ramosa > backup_hse.sql
```

Sube este archivo `backup_hse.sql` a tu repositorio, USB o nube.

### 2. Entrada (En la PC de Casa - Vagrant/LTSC)

Coloca el archivo `backup_hse.sql` dentro de la carpeta `mi-servidor-linux` en tu Windows.

Abre la terminal, entra al Linux con `vagrant ssh` y asegúrate de que Docker esté arriba.

Ejecuta la importación (Nota el uso de `sudo` y la ruta `/vagrant/`):

```bash
sudo docker exec -i hse_postgres_db psql -U Ramosa -d hse_database < /vagrant/backup_hse.sql
```

### 3. Actualización de Requisitos

> [!NOTE]
> El puerto `5432` está mapeado en ambas máquinas a `localhost`, por lo que el archivo `.env` del Backend **NO necesita cambios** al moverte de casa al trabajo. Como configuramos el Vagrantfile con `forwarded_port: 5432`, tu proyecto siempre creerá que la base de datos está en su propia PC.

---

## ⚠️ Troubleshooting (Problemas Comunes y Soluciones)

| Error de Terminal / CLI                                        | Causa Habitual                                                                                                                 | Solución Recomendada                                                                                                                          |
| :------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Error: listen EADDRINUSE: address already in use :::3001`** | Significa que ya dejaste corriendo el backend en otra pestaña o terminal y este chocó al intentar encender encima de sí mismo. | Ubica la terminal donde el backend está activo previamente y mátalo (`Ctrl + C`), o reinicia tu IDE para matar todas las terminales colgadas. |
| **Prisma: `Can't reach database...`**                          | Postgres no ha terminado de encender su contenedor Docker, o en su defecto olvidaste arrancar Docker Desktop.                  | Escribe `docker ps`, valida que `hse_postgres_db` diga `Up`, de lo contrario, vuelve a lanzar `docker-compose up -d`.                         |
| **Vite: `Network Error / Cors`**                               | El Frontend se está abriendo antes que el Backend, o se cayó el `.env`.                                                        | Revisa que el puerto `3001` diga `Nest application successfully started`.                                                                     |
| **NPM: `ETIMEDOUT / Cannot resolve host`**                     | Caché colgado de dependencias en npm al cambiar librerías.                                                                     | Lanza `npm cache clean --force` e intenta `npm install` de nuevo.                                                                             |

---

> _Sistema Documentado y Verificado. Última Generación Sistémica: Marzo 2026._
