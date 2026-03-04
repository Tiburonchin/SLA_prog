-- DropForeignKey
ALTER TABLE "notificaciones" DROP CONSTRAINT "notificaciones_destinatarioId_fkey";

-- DropForeignKey
ALTER TABLE "registros_auditoria" DROP CONSTRAINT "registros_auditoria_usuarioId_fkey";

-- AddForeignKey
ALTER TABLE "registros_auditoria" ADD CONSTRAINT "registros_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
