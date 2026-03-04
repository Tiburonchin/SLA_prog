-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('COORDINADOR', 'SUPERVISOR', 'JEFATURA');

-- CreateEnum
CREATE TYPE "EstadoSalud" AS ENUM ('APTO', 'NO_APTO', 'APTO_CON_RESTRICCIONES');

-- CreateEnum
CREATE TYPE "EstadoEquipo" AS ENUM ('OPERATIVO', 'EN_MANTENIMIENTO', 'BAJA_TECNICA');

-- CreateEnum
CREATE TYPE "SeveridadFalta" AS ENUM ('LEVE', 'GRAVE', 'CRITICA');

-- CreateEnum
CREATE TYPE "EstadoInspeccion" AS ENUM ('EN_PROGRESO', 'COMPLETADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sucursales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trabajadores" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "tipoSangre" TEXT,
    "telefonoEmergencia" TEXT,
    "contactoEmergencia" TEXT,
    "estadoSalud" "EstadoSalud" NOT NULL DEFAULT 'APTO',
    "tallaCasco" TEXT,
    "tallaCamisa" TEXT,
    "tallaPantalon" TEXT,
    "tallaCalzado" TEXT,
    "tallaGuantes" TEXT,
    "codigoQr" TEXT,
    "sucursalId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trabajadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisores" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "telefono" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisor_sucursal" (
    "id" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,

    CONSTRAINT "supervisor_sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "numeroSerie" TEXT NOT NULL,
    "estado" "EstadoEquipo" NOT NULL DEFAULT 'OPERATIVO',
    "descripcion" TEXT,
    "manualUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibraciones" (
    "id" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "fechaCalibracion" TIMESTAMP(3) NOT NULL,
    "proximaCalibracion" TIMESTAMP(3) NOT NULL,
    "certificadoUrl" TEXT,
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriz_ipc" (
    "id" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "eppsObligatorios" JSONB NOT NULL,
    "herramientasRequeridas" JSONB NOT NULL,
    "capacitacionesRequeridas" JSONB NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriz_ipc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entregas_epp" (
    "id" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "tipoEpp" TEXT NOT NULL,
    "marca" TEXT,
    "talla" TEXT,
    "fechaEntrega" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "observaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entregas_epp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacitaciones" (
    "id" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "nombreCurso" TEXT NOT NULL,
    "institucion" TEXT,
    "fechaRealizacion" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "certificadoUrl" TEXT,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capacitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspecciones" (
    "id" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "tipoTrabajo" TEXT NOT NULL,
    "estado" "EstadoInspeccion" NOT NULL DEFAULT 'EN_PROGRESO',
    "checklist" JSONB NOT NULL,
    "observaciones" TEXT,
    "firmaSupervisor" BOOLEAN NOT NULL DEFAULT false,
    "latitudCierre" DOUBLE PRECISION,
    "longitudCierre" DOUBLE PRECISION,
    "fechaCierre" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspeccion_trabajador" (
    "id" TEXT NOT NULL,
    "inspeccionId" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,

    CONSTRAINT "inspeccion_trabajador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_inspeccion" (
    "id" TEXT NOT NULL,
    "inspeccionId" TEXT NOT NULL,
    "rutaArchivo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaCaptura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadatos" JSONB,

    CONSTRAINT "fotos_inspeccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amonestaciones" (
    "id" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "severidad" "SeveridadFalta" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "testimonios" TEXT,
    "fechaEvento" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amonestaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_amonestacion" (
    "id" TEXT NOT NULL,
    "amonestacionId" TEXT NOT NULL,
    "rutaArchivo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaCaptura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_amonestacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidentes" (
    "id" TEXT NOT NULL,
    "trabajadorId" TEXT NOT NULL,
    "amonestacionId" TEXT,
    "descripcion" TEXT NOT NULL,
    "ubicacion" TEXT,
    "fechaEvento" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalles" JSONB,
    "ip" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "enviadaPorEmail" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_nombre_key" ON "sucursales"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_dni_key" ON "trabajadores"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_codigoQr_key" ON "trabajadores"("codigoQr");

-- CreateIndex
CREATE UNIQUE INDEX "supervisores_usuarioId_key" ON "supervisores"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "supervisor_sucursal_supervisorId_sucursalId_key" ON "supervisor_sucursal"("supervisorId", "sucursalId");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_numeroSerie_key" ON "equipos"("numeroSerie");

-- CreateIndex
CREATE UNIQUE INDEX "matriz_ipc_cargo_ubicacion_key" ON "matriz_ipc"("cargo", "ubicacion");

-- CreateIndex
CREATE UNIQUE INDEX "inspeccion_trabajador_inspeccionId_trabajadorId_key" ON "inspeccion_trabajador"("inspeccionId", "trabajadorId");

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisores" ADD CONSTRAINT "supervisores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_sucursal" ADD CONSTRAINT "supervisor_sucursal_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "supervisores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_sucursal" ADD CONSTRAINT "supervisor_sucursal_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibraciones" ADD CONSTRAINT "calibraciones_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas_epp" ADD CONSTRAINT "entregas_epp_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacitaciones" ADD CONSTRAINT "capacitaciones_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "supervisores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspeccion_trabajador" ADD CONSTRAINT "inspeccion_trabajador_inspeccionId_fkey" FOREIGN KEY ("inspeccionId") REFERENCES "inspecciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspeccion_trabajador" ADD CONSTRAINT "inspeccion_trabajador_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_inspeccion" ADD CONSTRAINT "fotos_inspeccion_inspeccionId_fkey" FOREIGN KEY ("inspeccionId") REFERENCES "inspecciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amonestaciones" ADD CONSTRAINT "amonestaciones_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amonestaciones" ADD CONSTRAINT "amonestaciones_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "supervisores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amonestaciones" ADD CONSTRAINT "amonestaciones_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_amonestacion" ADD CONSTRAINT "fotos_amonestacion_amonestacionId_fkey" FOREIGN KEY ("amonestacionId") REFERENCES "amonestaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidentes" ADD CONSTRAINT "incidentes_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidentes" ADD CONSTRAINT "incidentes_amonestacionId_fkey" FOREIGN KEY ("amonestacionId") REFERENCES "amonestaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_auditoria" ADD CONSTRAINT "registros_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
