import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.usuario.count();
  const sucursales = await prisma.sucursal.count();
  const supervisores = await prisma.supervisor.count();
  const trabajadores = await prisma.trabajador.count();
  const equipos = await prisma.equipo.count();
  const inspecciones = await prisma.inspeccion.count();
  const amonestaciones = await prisma.amonestacion.count();
  const matriz = await prisma.matrizIpc.count();
  const entregas = await prisma.entregaEpp.count();
  const caps = await prisma.capacitacion.count();

  console.log('--- DISTRIBUCIÓN DE DATOS DE LA BASE DE DATOS ---');
  console.log(`Usuarios: ${users}`);
  console.log(`Sucursales: ${sucursales}`);
  console.log(`Supervisores: ${supervisores}`);
  console.log(`Trabajadores: ${trabajadores}`);
  console.log(`Equipos: ${equipos}`);
  console.log(`Inspecciones: ${inspecciones}`);
  console.log(`Amonestaciones: ${amonestaciones}`);
  console.log(`Matriz IPC: ${matriz}`);
  console.log(`Entregas EPP: ${entregas}`);
  console.log(`Capacitaciones: ${caps}`);
  console.log('------------------------------------------------');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
