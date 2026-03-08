# Reporte Arquitectónico y Base de Datos: Módulo de Gestión Integral de Equipos
**Área:** Backend (NestJS) y Base de Datos (PostgreSQL + Prisma)
**Enfoque:** Cumplimiento HSE Ocupacional

Para dar soporte a la interfaz de "Detalles de Equipo" y cumplir con las garantías legales exigidas en la auditoría HSE, el backend y el esquema de base de datos requieren las siguientes estructuras y lógicas de validación críticas.

---

## 1. Actualizaciones en el Esquema de Base de Datos (Prisma ORM)

El modelo de datos debe expandirse para incluir trazabilidad estricta, firmas digitales y control de residuos.

### A. Modelo `Mantenimiento`
Se debe agregar soporte para cumplimiento ISO 14001 y trazabilidad LOTO.

```prisma
model Mantenimiento {
  id                      String    @id @default(uuid())
  equipoId                String
  fechaMantenimiento      DateTime
  tipoIntervencion        TipoMantenimiento // PREVENTIVO, CORRECTIVO, CALIBRACION
  
  // -- Trazabilidad HSE --
  aplicoLoto              Boolean   @default(false)
  generoIncidente         Boolean   @default(false)
  incidenteId             String?   // FK opcional a la tabla Accidentes/Incidentes
  
  // -- Certificación y Evidencia --
  tecnicoResponsable      String
  certificacionTecnico    String?   // Ej: "NFPA 70E - Riesgo Eléctrico"
  repuestosCambiados      String?
  disposicionResiduos     String?   // Cumplimiento Medioambiental ISO 14001
  reporteFirmaUrl         String?   // Enlace obligatorio a AWS S3 / Blob Storage
  
  // -- Programación --
  proximaFechaProgramada  DateTime?
  horasEquipoAlMomento    Int?

  creadoEn                DateTime  @default(now())
  equipo                  Equipo    @relation(fields: [equipoId], references: [id])
}
```

### B. Modelo `Equipo`
Debe consolidar el "Semáforo Legal" y bloquear su uso a nivel de base de datos para evitar operaciones por API no autorizadas.

```prisma
model Equipo {
  id                      String    @id @default(uuid())
  // ... campos existentes (nombre, serie, etc.)

  condicionActual         EstadoOperativo // OPERATIVO, BLOQUEADO_POR_FALLA, MANTENIMIENTO, BAJA
  esBloqueoAutomatico     Boolean   @default(false) // Si un operario falla un checklist pre-uso, esto pasa a "true"
  
  eppObligatorio          Json      // Array de EPPs [{ tipo: "Arnés", obligatorio: true }]
  matrizRiesgosId         String?   // FK hacia la matriz de peligros IPC
  manualFabricanteUrl     String?
}
```

### C. Modelo `Calibracion`
Indispensable para equipos críticos. Un certificado vencido debe gatillar alertas.

```prisma
model Calibracion {
  id                      String    @id @default(uuid())
  equipoId                String
  fechaCalibracion        DateTime
  proximaCalibracion      DateTime
  
  numeroCertificado       String
  entidadCertificadora    String    // Ej: SGS, Bureau Veritas
  certificadoUrl          String?   // PDF subido al servidor
  
  estadoResultado         EstadoCalibracion // CONFORME, NO_CONFORME
  equipo                  Equipo    @relation(fields: [equipoId], references: [id])
}
```

---

## 2. Requerimientos para el Backend (Controladores y Servicios NestJS)

El backend no solo debe hacer operaciones CRUD; debe actuar como el  **Guardia de Seguridad** del flujo de la información.

### A. Endpoint: `POST /equipos/:id/mantenimiento`
*Lógica de Negocio y Validación Exigida:*
1. **Validación de Evidencia:** El request DEBE contener el archivo del reporte firmado (`reporteFirmaUrl`). Si viene vacío, lanzar un `400 Bad Request`.
2. **Validación Incidente:** Si `tipoIntervencion == CORRECTIVO` y `generoIncidente == TRUE`, exigir el `incidenteId`.
3. **Auto-Cálculo de Próxima Fecha:** Si el usuario no envía la `proximaFechaProgramada`, el backend debe calcularla automáticamente usando la `vidaUtilMeses` o frecuencia paramétrica del equipo.
4. **Trigger de Desbloqueo:** Si el equipo estaba en estado `BLOQUEADO_POR_FALLA`, la inserción exitosa de un mantenimiento debe colocar automáticamente el equipo en `OPERATIVO`.

### B. Endpoint: `GET /equipos/:id/dossier-pdf` (Generación de Reporte)
*Lógica de Auditoría:*
1. **Recolección Integral:** Este endpoint debe hacer un `JOIN` masivo (`include` en Prisma) trayendo: Datos del equipo, últimos 5 mantenimientos, últimas 10 inspecciones y TODAS las calibraciones.
2. **Inyección de Marca de Agua:** El backend debe evaluar en tiempo de ejecución:
   `const isVencido = equipo.calibraciones[0]?.proximaCalibracion < new Date()`
   Si es verdadero, el PDF generado por librerías (ej. Puppeteer o PDFKit) debe imprimir de forma superpuesta en color rojo gigante: **"EQUIPO NO CONFORME - RIESGO ALTO"**.
3. **Sello de Trazabilidad:** El backend debe incrustar la fecha/hora del servidor y el usuario JWT que solicitó la exportación en el pie de página del PDF para trazabilidad legal.

### C. CRON Job: Monitoreo de Calibraciones y MTBF
Se requiere implementar un `@Cron` diario (`@nestjs/schedule`) que ejecute:
1. Buscar certificados de calibración donde `proximaCalibracion - 15 dias == HOY`.
2. Enviar notificaciones (Push, Email) al `Supervisor HSE`.
3. Buscar certificados donde `proximaCalibracion < HOY`. Cambiar automáticamente el estado de la máquina a `BLOQUEADO_POR_FALLA`.

---

## Conclusión Backend

La responsabilidad legal del sistema no recae en el frontend. Si el Supervisor intenta hacer un POST sin firmar, la validación estricta de NestJS con `class-validator` debe detenerlo con un `HttpException`. Los DTOs deben ser infalibles frente a la evasión de campos obligatorios LOTO y gestión de residuos.