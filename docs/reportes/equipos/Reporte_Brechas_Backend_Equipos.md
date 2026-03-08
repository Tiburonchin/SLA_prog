# Reporte de Brechas: Backend — Módulo Gestión Integral de Equipos
**Fecha:** 07 de Marzo de 2026  
**Auditor:** CTO / Lead Backend HSE  
**Base:** Análisis de `backend/src/modules/equipos/`, `mantenimientos/`, `reportes/`, `notificaciones/` vs. requerimientos HSE del Frontend.

---

## Metodología de Auditoría

Se comparó el estado actual del backend (NestJS + Prisma) contra dos fuentes de verdad:
1. La interfaz construida en `frontend/src/pages/equipos/PaginaDetalleEquipo.tsx`
2. Los requerimientos legales HSE del `Reporte_Backend_Gestion_Equipos.md`

El semáforo de criticidad usado es:
- 🔴 **CRÍTICO** — Bloquea cumplimiento legal o falla de seguridad activa
- 🟡 **ALTO** — Funcionalidad requerida por el frontend sin soporte API
- 🟢 **MEDIO** — Mejora de integridad o trazabilidad necesaria

---

## Resumen Ejecutivo

| Área | Estado Actual | Brechas Identificadas |
|---|---|---|
| Endpoint POST Mantenimiento | ✅ Existe en `/mantenimientos` | 5 campos críticos ausentes en DTO + ruta no REST-ful |
| Validación evidencia obligatoria | ❌ `certificadoUrl` es `@IsOptional()` | Debe ser `@IsNotEmpty()` |
| GET Dossier PDF por Equipo | ❌ **No existe** | Endpoint completo faltante |
| CRON bloqueo automático por calibración vencida | ❌ Solo notifica, no bloquea | Trigger de estado faltante |
| Trigger de desbloqueo post-mantenimiento | ⚠ Parcial — solo pone EN_MANTENIMIENTO si `equipoFueraServicio=true` | No restaura a OPERATIVO |
| MTBF (Tiempo Medio entre Fallas) | ❌ **No existe** cálculo | Servicio de métricas faltante |
| Sello JWT en PDF | ❌ No captura quién exportó | Trazabilidad legal ausente |

---

## Brecha 1 — 🔴 DTO `CrearMantenimientoDto`: Campos HSE Legales Faltantes

### Estado Actual
El archivo `backend/src/modules/mantenimientos/dto/mantenimiento.dto.ts` NO incluye los campos requeridos por el formulario frontend de "Registrar Mantenimiento".

### Campos Faltantes en el DTO

| Campo | Tipo | Obligatoriedad | Norma |
|---|---|---|---|
| `aplicoLoto` | `boolean` | **Obligatorio si `requiereLoto=true`** | OSHA 1910.147 |
| `generoIncidente` | `boolean` | **Obligatorio** | Ley 29783 Art. 82 |
| `incidenteId` | `string (UUID)` | Obligatorio si `generoIncidente=true` | DS 005-2012-TR |
| `disposicionResiduos` | `string` | **Obligatorio** | ISO 14001:2015 |
| `certificacionTecnico` | `string` | Recomendado | NFPA 70E / DS 024-2016-EM |
| `reporteFirmaUrl` | `string` | **Obligatorio — campo renombrar** | Art. 26 DS 005-2012-TR |

### Brecha de Validación Crítica
```typescript
// ACTUAL (INSEGURO — permite evadir evidencia)
@IsOptional() @IsString()
certificadoUrl?: string;

// REQUERIDO (bloquea sin firma del técnico)
@IsString() @IsNotEmpty()
@IsUrl()
certificadoUrl: string;  // reporteFirmaUrl obligatorio, no opcional
```

### Brecha de Ruta REST
```
ACTUAL:   POST /mantenimientos        ← no identifica al equipo en la ruta
REQUERIDO: POST /equipos/:id/mantenimiento  ← REST-ful, semántico, con ID en path
```

---

## Brecha 2 — 🔴 Endpoint `GET /equipos/:id/dossier-pdf` — COMPLETAMENTE FALTANTE

### Estado Actual
El servicio `PdfService` (`backend/src/modules/reportes/pdf.service.ts`) **solo** puede generar un acta de inspección (`generarActaInspeccion`). No existe ningún método para generar el dossier legal de un equipo.

### Lo que debe existir (implementación requerida completa)

#### Método en `PdfService`
```typescript
async generarDossierEquipo(equipoId: string, usuarioJwt: { id: string; nombre: string }): Promise<Buffer> {
  // 1. JOIN masivo en Prisma
  const equipo = await this.prisma.equipo.findUnique({
    where: { id: equipoId },
    include: {
      sucursal: true,
      calibraciones: { orderBy: { fechaCalibracion: 'desc' } }, // TODAS
      mantenimientos: { orderBy: { fechaMantenimiento: 'desc' }, take: 5 },
      inspecciones: { orderBy: { creadoEn: 'desc' }, take: 10 },
      autorizaciones: { include: { trabajador: true } },
      ejecucionesLoto: { orderBy: { fechaBloqueo: 'desc' }, take: 5 },
    },
  });

  // 2. Evaluar conformidad de calibración
  const ultimaCal = equipo.calibraciones[0];
  const isNoConforme = !ultimaCal || new Date(ultimaCal.proximaCalibracion) < new Date();

  // 3. Datos de trazabilidad legal
  const selloPDF = {
    generadoPor: usuarioJwt.nombre,
    usuarioId: usuarioJwt.id,
    fechaGeneracion: new Date().toISOString(),
    estadoConformidad: isNoConforme ? 'EQUIPO NO CONFORME — RIESGO ALTO' : 'APTO PARA USO',
    marcaAgua: isNoConforme, // Si true → marca de agua roja en PDF
  };

  // 4. Renderizar con Handlebars + Puppeteer
  // La plantilla debe incluir watermark CSS condicional
  // Fuente: templates/dossier-equipo.hbs  ← FALTA CREAR ESTA PLANTILLA
}
```

#### Endpoint en `ReportesController`
```typescript
@Get('equipos/:id/dossier')
@Roles('COORDINADOR', 'JEFATURA', 'SUPERVISOR')
async descargarDossierEquipo(
  @Param('id', ParseUUIDPipe) equipoId: string,
  @Req() req: any,
  @Res() res: Response
) {
  const buffer = await this.pdfService.generarDossierEquipo(equipoId, {
    id: req.user.id,
    nombre: req.user.nombreCompleto,
  });
  res.set({ 'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=dossier_equipo_${equipoId}.pdf` });
  res.end(buffer);
}
```

#### Template Handlebars: `templates/dossier-equipo.hbs` — FALTA CREAR
Debe incluir:
- Header con logo, nombre empresa, número de dossier con timestamp
- Sección de estado legal (semáforo visual tipo CSS)
- Si `marcaAgua=true`: `position: fixed; opacity: 0.3; font-size: 80px; color: red; transform: rotate(-30deg)` con texto "NO CONFORME"
- Ficha técnica, historial de mantenimientos, tablas de calibraciones, operadores autorizados
- Footer con: `"Generado por: {{generadoPor}} | Fecha: {{fechaGeneracion}} | ID usuario: {{usuarioId}}"`

---

## Brecha 3 — 🔴 CRON: No Bloquea Equipos con Calibración Vencida

### Estado Actual
```typescript
// ACTUAL — Solo notifica (notificaciones.cron.ts)
@Cron(CronExpression.EVERY_DAY_AT_8AM)
async revisarCalibracionesPorVencer() {
  // Busca calibraciones que vencen en los próximos 30 DÍAS (futuro)
  // PROBLEMA: No revisa las que YA vencieron
  // PROBLEMA: No bloquea equipos automáticamente
}
```

### Lo que debe implementarse

```typescript
// NUEVO: Bloqueo automático de equipos con certificación vencida
@Cron(CronExpression.EVERY_DAY_AT_8AM)
async bloquearEquiposConCertificadoVencido() {
  const hoy = new Date();
  
  // 1. ALERTA PREVENTIVA (15 días antes)
  const en15Dias = new Date();
  en15Dias.setDate(hoy.getDate() + 15);
  const porVencer = await this.prisma.calibracion.findMany({
    where: { proximaCalibracion: { gte: hoy, lte: en15Dias } },
    include: { equipo: true },
  });
  if (porVencer.length > 0) {
    await this.notificaciones.enviarAlertaCalibracion(porVencer);
  }

  // 2. BLOQUEO AUTOMÁTICO (ya vencidas — NUEVO CRÍTICO)
  const equiposVencidos = await this.prisma.equipo.findMany({
    where: {
      estado: { not: 'BAJA_TECNICA' },
      calibraciones: {
        // El equipo más reciente está vencido
        none: { proximaCalibracion: { gte: hoy } }
      },
    },
  });
  
  for (const equipo of equiposVencidos) {
    await this.prisma.equipo.update({
      where: { id: equipo.id },
      data: { estado: 'EN_MANTENIMIENTO' }, // Bloquear → impide uso
    });
    await this.notificaciones.enviarAlertaEquipoBloqueado(equipo);
  }
}
```

> **Nota:** Para implementar esto correctamente, el enum `EstadoEquipo` en Prisma debe agregar un nuevo valor `BLOQUEADO_CERTIFICADO` para diferenciar de `EN_MANTENIMIENTO`. Ver Reporte de BD.

---

## Brecha 4 — 🟡 Trigger de Desbloqueo Post-Mantenimiento: Parcial

### Estado Actual
En `mantenimientos.service.ts` al crear un mantenimiento:
```typescript
if (dto.equipoFueraServicio) equipoUpdate.estado = 'EN_MANTENIMIENTO';
// PROBLEMA: Nunca restaura a 'OPERATIVO' cuando el trabajo finaliza
```

### Lógica Faltante
```typescript
// Si el equipo estaba bloqueado y el técnico indica que quedó operativo
if (dto.equipoQuedoOperativo === true) {
  equipoUpdate.estado = 'OPERATIVO';
}
// Si tenía LOTO activo → cerrar automáticamente la EjecucionLoto
if (equipo.requiereLoto) {
  await this.prisma.ejecucionLoto.updateMany({
    where: { equipoId: dto.equipoId, estadoEjecucion: 'BLOQUEADO' },
    data: { estadoEjecucion: 'DESBLOQUEADO', fechaDesbloqueo: new Date() },
  });
}
```

---

## Brecha 5 — 🟡 Servicio MTBF — No Existe

### Descripción
El frontend muestra un indicador de MTBF en la pestaña "Trazabilidad de Mantenimientos". **No existe ningún cálculo de este KPI en el backend.**

### Implementación Requerida en `EquiposService`
```typescript
async calcularMtbf(equipoId: string): Promise<{ mtbfHoras: number; tendencia: string }> {
  const correctivos = await this.prisma.mantenimiento.findMany({
    where: { equipoId, tipoMantenimiento: 'CORRECTIVO' },
    orderBy: { fechaMantenimiento: 'asc' },
  });
  if (correctivos.length < 2) return { mtbfHoras: 0, tendencia: 'INSUFICIENTE' };

  const intervalos: number[] = [];
  for (let i = 1; i < correctivos.length; i++) {
    const diff = new Date(correctivos[i].fechaMantenimiento).getTime()
      - new Date(correctivos[i - 1].fechaMantenimiento).getTime();
    intervalos.push(diff / 3_600_000); // Convertir ms a horas
  }
  const mtbfHoras = intervalos.reduce((a, b) => a + b, 0) / intervalos.length;
  return {
    mtbfHoras: Math.round(mtbfHoras),
    tendencia: mtbfHoras < 200 ? 'RIESGO_CRONICO' : mtbfHoras < 500 ? 'NORMAL' : 'BUENO',
  };
}
```
**Endpoint requerido:** `GET /equipos/:id/mtbf`

---

## Brecha 6 — 🟡 Sello JWT en Exportación PDF

### Descripción
El `PdfService` actual no recibe información del usuario autenticado. Es imposible saber quién generó cada dossier, violando la trazabilidad legal.

### Solución
Todos los endpoints de generación de PDF deben inyectar `@Req() req` para capturar `req.user` del `JwtStrategy` y pasarlo al servicio PDF para incrustar en el documento.

---

## Plan de Implementación Priorizado

| Prioridad | Brecha | Esfuerzo Estimado |
|---|---|---|
| P1 🔴 | Agregar campos HSE al `CrearMantenimientoDto` + schema Prisma | 2 horas |
| P1 🔴 | Hacer `certificadoUrl` obligatorio (`@IsNotEmpty()`) | 30 min |
| P1 🔴 | Crear `generarDossierEquipo()` en PdfService + template `.hbs` | 1 día |
| P1 🔴 | Endpoint `GET /equipos/:id/dossier` en `ReportesController` | 1 hora |
| P1 🔴 | CRON de bloqueo automático por calibración vencida | 3 horas |
| P2 🟡 | Trigger de desbloqueo + cierre de LOTO post-mantenimiento | 2 horas |
| P2 🟡 | Método `calcularMtbf()` + endpoint `/equipos/:id/mtbf` | 2 horas |
| P2 🟡 | Sello JWT en todos los endpoints de exportación PDF | 1 hora |
| P3 🟢 | Mover `POST /mantenimientos` a `POST /equipos/:id/mantenimiento` | 1 hora |

---

## Archivos a Crear/Modificar

```
backend/src/modules/
  mantenimientos/dto/mantenimiento.dto.ts   ← MODIFICAR: agregar 5 campos HSE
  mantenimientos/mantenimientos.service.ts  ← MODIFICAR: trigger desbloqueo + LOTO auto-close
  equipos/equipos.service.ts               ← MODIFICAR: método calcularMtbf()
  equipos/equipos.controller.ts            ← MODIFICAR: endpoint /mtbf
  reportes/pdf.service.ts                  ← MODIFICAR: método generarDossierEquipo() con sello JWT
  reportes/reportes.controller.ts           ← MODIFICAR: endpoint /equipos/:id/dossier
  reportes/templates/dossier-equipo.hbs    ← CREAR: plantilla Handlebars del dossier
  notificaciones/notificaciones.cron.ts    ← MODIFICAR: agregar lógica de bloqueo automático
```
