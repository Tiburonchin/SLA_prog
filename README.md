# 🛡️ Sistema de Gestión HSE (Health, Safety & Environment)

[![GitHub](https://img.shields.io/badge/GitHub-SLA__prog-blue?logo=github)](https://github.com/Tiburonchin/SLA_prog)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green?logo=node.js)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-Framework-red?logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-TypeScript-blue?logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?logo=postgresql)](https://www.postgresql.org/)

Sistema web integral para la gestión de seguridad laboral (HSE) que permite digitalizar, centralizar y agilizar los procesos críticos de inspección, control de equipos, registro de amonestaciones y gestión del personal.

## 📖 Descripción del Proyecto

El **Sistema de Gestión HSE** es una aplicación web diseñada específicamente para Coordinadores de Seguridad, Supervisores de campo y Jefaturas, con el objetivo de eliminar el uso de papel en las inspecciones operativas, prevenir incidentes graves mediante bloqueos automatizados de equipos defectuosos y mantener un expediente digital 360° de cada trabajador disponible en tiempo real.

### 🎯 Objetivos Principales

- **Centralización Total:** Base de datos única y auditable para trabajadores, supervisores, ubicaciones y calibraciones
- **Visibilidad en Tiempo Real:** Información instantánea del estado de seguridad en todas las operaciones
- **Prevención Activa:** Bloqueos automáticos para evitar tareas de alto riesgo sin EPPs o herramientas adecuadas
- **Trazabilidad Completa:** Registro inmutable de todas las acciones para auditorías y peritajes legales

## ✨ Características Principales

### 🔹 Módulos Core

#### 1. **Base de Datos Maestra**
- Gestión completa de trabajadores con expedientes 360°
- Registro de supervisores con permisos por zonas
- Inventario de equipos/herramientas con control de calibraciones
- Matrices IPC (Identificación de Peligros por Cargo)

#### 2. **Perfil del Trabajador**
- Dashboard individual con datos médicos y laborales
- Historial de EPPs entregados y amonestaciones
- Semáforo de certificaciones vigentes
- Código QR dinámico para acceso rápido en campo

#### 3. **Inspecciones y Permisos**
- Checklists dinámicos según ubicación y matriz IPC
- Captura de evidencia fotográfica con metadatos
- Validación automática de herramientas vs. calibraciones
- Registro GPS en tiempo real

#### 4. **Gestión de Amonestaciones**
- Formulario ágil de registro (<1 minuto)
- Tipificación estructurada de faltas (Leve/Grave/Crítica)
- Adjuntos visuales y descripción de hechos
- Notificaciones automáticas a RRHH

#### 5. **Dashboard y Reportes**
- Analytics en tiempo real con gráficos dinámicos
- Sistema de alertas automáticas (calibraciones vencidas)
- Exportación a PDF/CSV
- Reportes ejecutivos automatizados

### 🔹 Características Técnicas

- **Mobile-First:** Optimizado para tablets y smartphones en campo
- **Diseño Responsivo:** Interfaces adaptables desde móvil hasta dashboards de escritorio
- **Modo Offline (PWA):** Capacidad de trabajo sin conexión mediante Service Workers
- **Audit Trail:** Registro inmutable de todas las operaciones
- **Alta Seguridad:** RBAC, JWT, bcrypt, HTTPS/TLS

## 🏗️ Arquitectura y Stack Tecnológico

### Frontend
- **React 18** con **TypeScript**
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Estilización utility-first
- **Zustand** - Gestión de estado global
- **shadcn/ui** - Componentes UI accesibles

### Backend
- **NestJS** con **TypeScript**
- **Prisma ORM** - Interfaz type-safe con PostgreSQL
- **JWT** - Autenticación y autorización
- **Puppeteer** - Generación de reportes PDF

### Base de Datos
- **PostgreSQL 15+** - Base de datos relacional
- **Docker Compose** - Orquestación de contenedores

### DevOps & Testing
- **Docker** - Contenedorización
- **Jest** - Testing de seguridad y vulnerabilidades
- **ESLint** - Linting de código

## 📁 Estructura del Proyecto

```
SLA_prog/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── modules/           # Módulos funcionales
│   │   │   ├── auth/          # Autenticación
│   │   │   ├── trabajadores/  # Gestión de trabajadores
│   │   │   ├── inspecciones/  # Inspecciones y permisos
│   │   │   ├── amonestaciones/# Registro de faltas
│   │   │   ├── equipos/       # Control de equipos
│   │   │   └── reportes/      # Generación de reportes
│   │   ├── common/            # Interceptors y filtros
│   │   └── prisma/            # Servicio Prisma
│   ├── prisma/
│   │   ├── schema.prisma      # Modelo de datos
│   │   ├── migrations/        # Migraciones de BD
│   │   └── seed.ts            # Datos semilla
│   └── test_endpoints.js      # Tests de integración
│
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── pages/             # Vistas por módulo
│   │   ├── components/        # Componentes reutilizables
│   │   ├── services/          # Clientes API
│   │   └── stores/            # Estado global (Zustand)
│   └── public/                # Assets estáticos
│
├── docs/                       # Documentación del proyecto
│   ├── core/                  # PRD y Tech Stack
│   ├── fases/                 # Histórico de desarrollo
│   └── seguridad/             # Auditorías y seguridad
│
├── system_tests/               # Suite de testing de seguridad
│   ├── tests/                 # Tests de vulnerabilidades
│   ├── reports/               # Reportes de auditoría
│   └── docs/                  # Documentación de tests
│
├── docker-compose.yml          # Orquestación Docker
├── INDEX_PROYECTO.md           # Índice para Agentes IA
├── GUIA_EJECUCION.md          # Guía de despliegue
└── README.md                   # Este archivo
```

## 🚀 Instalación y Configuración

### Requisitos Previos

| Software | Versión | Descarga |
|----------|---------|----------|
| Node.js | 18.x+ | [nodejs.org](https://nodejs.org/) |
| npm | 9.x+ | Incluido con Node.js |
| Docker Desktop | 4.x+ | [docker.com](https://www.docker.com/) |

**Verificación rápida:**
```bash
node -v    # Debe retornar v18.x o superior
npm -v     # Debe retornar v9.x o superior
docker --version  # Debe retornar la versión instalada
```

### 📦 Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/Tiburonchin/SLA_prog.git
cd SLA_prog
```

### 🗄️ Paso 2: Levantar Base de Datos (PostgreSQL)

```bash
docker compose up -d
```

**Credenciales de desarrollo:**
- **Usuario:** `Ramosa`
- **Password:** `Ramosa3097`
- **Base de Datos:** `hse_database`
- **Puerto:** `5432`

### ⚙️ Paso 3: Configurar Backend

```bash
cd backend
npm install
```

**Crear archivo `.env` en `/backend`:**
```env
# Conexión a Base de Datos
DATABASE_URL="postgresql://Ramosa:Ramosa3097@localhost:5432/hse_database?schema=public"

# Seguridad JWT
JWT_SECRET="ClaveSeguraHSE2026_secreta"
JWT_EXPIRATION="24h"

# Puerto del servidor
PORT=3001
```

**Inicializar Prisma y Base de Datos:**
```bash
npm run prisma:generate
npm run prisma:migrate deploy
npm run prisma:seed  # Opcional: Cargar datos de prueba
```

**Iniciar servidor backend:**
```bash
npm run dev
```

✅ El backend estará disponible en: `http://localhost:3001`

### 🎨 Paso 4: Configurar Frontend

**En una nueva terminal:**
```bash
cd frontend
npm install
```

**Crear archivo `.env` en `/frontend`:**
```env
VITE_API_URL=http://localhost:3001/api
```

**Iniciar servidor de desarrollo:**
```bash
npm run dev
```

✅ El frontend estará disponible en: `http://localhost:5173`

## 🔑 Acceso al Sistema

### Usuarios de Desarrollo

| Rol | Email | Contraseña | Permisos |
|-----|-------|-----------|----------|
| **Coordinador HSE** | `coordinador@hse.com` | `AdminHSE2026!` | Acceso total |
| Supervisor 1 | `supervisor1@hse.com` | `AdminHSE2026!` | Operación en campo |

### 🛠️ Herramientas Adicionales

**Prisma Studio** (Explorador visual de BD):
```bash
cd backend
npm run prisma:studio
```
Abre automáticamente en: `http://localhost:5555`

## 📚 Documentación

### Para Desarrolladores

- **[INDEX_PROYECTO.md](INDEX_PROYECTO.md)** - Punto de entrada para Agentes IA y desarrolladores
- **[GUIA_EJECUCION.md](GUIA_EJECUCION.md)** - Guía detallada de despliegue
- **[PRD - Sistema de Gestión HSE.md](docs/core/PRD%20-%20Sistema%20de%20Gestión%20HSE.md)** - Requisitos del producto
- **[Tech Stack - Sistema HSE.md](docs/core/Tech%20Stack%20-%20Sistema%20HSE.md)** - Decisiones tecnológicas

### Histórico de Desarrollo (Fases)

- **[DOC_FASE_0.md](docs/fases/DOC_FASE_0.md)** - Diseño base y modelado de BD
- **[DOC_FASE_1.md](docs/fases/DOC_FASE_1.md)** - Implementación CRUD
- **[DOC_FASE_2.md](docs/fases/DOC_FASE_2.md)** - Desarrollo UI/UX
- **[DOC_FASE_3.md](docs/fases/DOC_FASE_3.md)** - Seguridad y logs

### Seguridad y Auditorías

- **[DOCUMENTACION_AUDITORIA.md](docs/seguridad/DOCUMENTACION_AUDITORIA.md)** - Políticas de seguridad
- **[REGISTRO_AUDITORIAS.md](system_tests/REGISTRO_AUDITORIAS.md)** - Bitácora de tests
- **[HIGH_LEVEL_SUMMARY.md](system_tests/docs/HIGH_LEVEL_SUMMARY.md)** - Resumen ejecutivo de tests
- **[DETAILED_REPORT.md](system_tests/docs/DETAILED_REPORT.md)** - Reporte técnico de vulnerabilidades

## 🧪 Testing

### Ejecutar Tests de Seguridad

```bash
cd system_tests
npm install
npm test
```

Los reportes se generan automáticamente en `/system_tests/reports/`

### Tests Disponibles

- ✅ **SQL Injection** - Validación de inputs
- ✅ **XSS (Cross-Site Scripting)** - Sanitización
- ✅ **CSRF Protection** - Tokens de seguridad
- ✅ **Authentication & Authorization** - Control de acceso
- ✅ **Rate Limiting** - Prevención de ataques DoS

## 📊 Características de Seguridad

- **Autenticación JWT** con tokens de corta duración
- **Encriptación bcrypt** para contraseñas
- **RBAC** (Role-Based Access Control)
- **HTTPS/TLS** en producción
- **Helmet.js** para headers seguros
- **CORS** configurado estrictamente
- **Audit Trail** inmutable de todas las operaciones
- **Validación de inputs** en frontend y backend
- **Sanitización** contra XSS e inyecciones

## 🚀 Despliegue a Producción

### Opción 1: DigitalOcean (Recomendada)
- **Backend:** DigitalOcean App Platform
- **Frontend:** Netlify/Vercel
- **Base de Datos:** DigitalOcean Managed PostgreSQL

### Opción 2: Supabase
- **Backend:** Render
- **Frontend:** Vercel
- **Base de Datos:** Supabase PostgreSQL

Consulta [GUIA_EJECUCION.md](GUIA_EJECUCION.md) para instrucciones detalladas de despliegue.

## 🤝 Contribuciones

Este es un proyecto educativo en desarrollo activo. Las contribuciones son bienvenidas siguiendo estos lineamientos:

1. Fork del repositorio
2. Crear una rama feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit de cambios (`git commit -m 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abrir un Pull Request

### Estándares de Código

- **TypeScript** obligatorio (frontend y backend)
- **ESLint** para linting
- **Prettier** para formato
- **Conventional Commits** para mensajes de commit

## 📝 Roadmap

### Fase Actual (v1.0)
- [x] Sistema CRUD completo para todos los módulos
- [x] Autenticación y autorización RBAC
- [x] Dashboard analítico
- [x] Sistema de notificaciones
- [x] Exportación PDF/CSV
- [x] Suite de tests de seguridad

### Próximas Funcionalidades (v2.0)
- [ ] PWA completa con Service Workers
- [ ] Modo 100% offline con sincronización
- [ ] Portal del empleado (autogestión)
- [ ] App móvil nativa (React Native)
- [ ] Integración con sistemas de RRHH
- [ ] IA para predicción de riesgos

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👥 Equipo

Desarrollado como proyecto educativo para la gestión de seguridad laboral.

## 📞 Contacto y Soporte

- **GitHub:** [Tiburonchin/SLA_prog](https://github.com/Tiburonchin/SLA_prog)
- **Issues:** [Reportar un problema](https://github.com/Tiburonchin/SLA_prog/issues)

## 🙏 Agradecimientos

- Comunidad de NestJS por el robusto framework backend
- Equipo de React por la excelente documentación
- Prisma por simplificar el work con bases de datos
- Todos los contribuidores del proyecto

---

<div align="center">

**⚠️ Desarrollado con 💙 para mejorar la seguridad laboral**

[Documentación](docs/) • [Reportar Bug](https://github.com/Tiburonchin/SLA_prog/issues) • [Solicitar Feature](https://github.com/Tiburonchin/SLA_prog/issues)

</div>
