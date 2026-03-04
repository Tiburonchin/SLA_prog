-- DropForeignKey
ALTER TABLE "calibraciones" DROP CONSTRAINT "calibraciones_equipoId_fkey";

-- DropForeignKey
ALTER TABLE "capacitaciones" DROP CONSTRAINT "capacitaciones_trabajadorId_fkey";

-- DropForeignKey
ALTER TABLE "entregas_epp" DROP CONSTRAINT "entregas_epp_trabajadorId_fkey";

-- DropForeignKey
ALTER TABLE "fotos_amonestacion" DROP CONSTRAINT "fotos_amonestacion_amonestacionId_fkey";

-- DropForeignKey
ALTER TABLE "fotos_inspeccion" DROP CONSTRAINT "fotos_inspeccion_inspeccionId_fkey";

-- DropForeignKey
ALTER TABLE "inspeccion_trabajador" DROP CONSTRAINT "inspeccion_trabajador_inspeccionId_fkey";

-- DropForeignKey
ALTER TABLE "supervisor_sucursal" DROP CONSTRAINT "supervisor_sucursal_sucursalId_fkey";

-- DropForeignKey
ALTER TABLE "supervisor_sucursal" DROP CONSTRAINT "supervisor_sucursal_supervisorId_fkey";

-- DropForeignKey
ALTER TABLE "supervisores" DROP CONSTRAINT "supervisores_usuarioId_fkey";

-- AddForeignKey
ALTER TABLE "supervisores" ADD CONSTRAINT "supervisores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_sucursal" ADD CONSTRAINT "supervisor_sucursal_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "supervisores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_sucursal" ADD CONSTRAINT "supervisor_sucursal_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibraciones" ADD CONSTRAINT "calibraciones_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas_epp" ADD CONSTRAINT "entregas_epp_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacitaciones" ADD CONSTRAINT "capacitaciones_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspeccion_trabajador" ADD CONSTRAINT "inspeccion_trabajador_inspeccionId_fkey" FOREIGN KEY ("inspeccionId") REFERENCES "inspecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_inspeccion" ADD CONSTRAINT "fotos_inspeccion_inspeccionId_fkey" FOREIGN KEY ("inspeccionId") REFERENCES "inspecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos_amonestacion" ADD CONSTRAINT "fotos_amonestacion_amonestacionId_fkey" FOREIGN KEY ("amonestacionId") REFERENCES "amonestaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
