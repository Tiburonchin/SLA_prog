import 'dotenv/config';
import { PrismaClient, Rol, EstadoSalud, EstadoEquipo, SeveridadFalta, EstadoInspeccion } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { fakerES as faker } from '@faker-js/faker';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Eliminando datos anteriores...');
  await prisma.incidente.deleteMany();
  await prisma.fotoAmonestacion.deleteMany();
  await prisma.amonestacion.deleteMany();
  await prisma.fotoInspeccion.deleteMany();
  await prisma.inspeccionTrabajador.deleteMany();
  await prisma.inspeccion.deleteMany();
  await prisma.capacitacion.deleteMany();
  await prisma.entregaEpp.deleteMany();
  await prisma.trabajador.deleteMany();
  await prisma.supervisorSucursal.deleteMany();
  await prisma.supervisor.deleteMany();
  await prisma.sucursal.deleteMany();
  await prisma.notificacion.deleteMany();
  await prisma.registroAuditoria.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.calibracion.deleteMany();
  await prisma.equipo.deleteMany();
  await prisma.matrizIpc.deleteMany();

  console.log('🌱 Sembrando datos ficticios masivos (60 trabajadores)...');

  // ===== 1. USUARIOS =====
  const contrasenaHash = await bcrypt.hash('AdminHSE2026!', 10);

  await prisma.usuario.create({
    data: { correo: 'coordinador@hse.com', contrasena: contrasenaHash, nombreCompleto: 'Carlos Martínez López', rol: Rol.COORDINADOR },
  });

  const supervisorUser1 = await prisma.usuario.create({
    data: { correo: 'supervisor1@hse.com', contrasena: contrasenaHash, nombreCompleto: 'Roberto Sánchez García', rol: Rol.SUPERVISOR },
  });

  const supervisorUser2 = await prisma.usuario.create({
    data: { correo: 'supervisor2@hse.com', contrasena: contrasenaHash, nombreCompleto: 'Ana Torres Mendoza', rol: Rol.SUPERVISOR },
  });

  await prisma.usuario.create({
    data: { correo: 'gerencia@hse.com', contrasena: contrasenaHash, nombreCompleto: 'María Fernández Rivera', rol: Rol.JEFATURA },
  });

  // ===== 2. SUCURSALES =====
  const sucursal1 = await prisma.sucursal.create({
    data: { nombre: 'Planta Norte - Monterrey', direccion: 'Av. Industrial 1450', latitud: 25.6866, longitud: -100.3161 },
  });

  const sucursal2 = await prisma.sucursal.create({
    data: { nombre: 'Planta Sur - Guadalajara', direccion: 'Blvd. Manufacturas 320', latitud: 20.6597, longitud: -103.3496 },
  });

  const sucursal3 = await prisma.sucursal.create({
    data: { nombre: 'Oficina Central - CDMX', direccion: 'Paseo de la Reforma 505', latitud: 19.4326, longitud: -99.1332 },
  });

  const sucursales = [sucursal1, sucursal2, sucursal3];

  // ===== 3. SUPERVISORES =====
  const sup1 = await prisma.supervisor.create({
    data: { usuarioId: supervisorUser1.id, telefono: '+52 81 1234 5678' },
  });

  const sup2 = await prisma.supervisor.create({
    data: { usuarioId: supervisorUser2.id, telefono: '+52 33 9876 5432' },
  });

  await prisma.supervisorSucursal.createMany({
    data: [
      { supervisorId: sup1.id, sucursalId: sucursal1.id },
      { supervisorId: sup1.id, sucursalId: sucursal3.id },
      { supervisorId: sup2.id, sucursalId: sucursal2.id },
    ],
  });

  const supervisoresIds = [sup1.id, sup2.id];

  // ===== 4. EQUIPOS Y CALIBRACIONES =====
  const equipo1 = await prisma.equipo.create({
    data: {
      nombre: 'Multímetro Digital Fluke 87V', marca: 'Fluke', modelo: '87V', numeroSerie: 'SN-MULT-2024-001', estado: EstadoEquipo.OPERATIVO, descripcion: 'Multímetro de precisión'
    }
  });

  const equipo2 = await prisma.equipo.create({
    data: {
      nombre: 'Arnés de Seguridad 3M', marca: '3M', modelo: 'DBI-SALA', numeroSerie: 'SN-ARNES-2023-045', estado: EstadoEquipo.OPERATIVO,
    }
  });

  const equipo3 = await prisma.equipo.create({
    data: {
      nombre: 'Detector de Gases MSA', marca: 'MSA', modelo: 'ALTAIR 5X', numeroSerie: 'SN-DETECT-2024-012', estado: EstadoEquipo.EN_MANTENIMIENTO,
    }
  });

  await prisma.calibracion.createMany({
    data: [
      { equipoId: equipo1.id, fechaCalibracion: new Date('2025-12-15'), proximaCalibracion: new Date('2026-06-15'), observaciones: 'OK' },
      { equipoId: equipo2.id, fechaCalibracion: new Date('2025-10-01'), proximaCalibracion: new Date('2026-04-01'), observaciones: 'Próxima a vencer' },
      { equipoId: equipo3.id, fechaCalibracion: new Date('2025-08-20'), proximaCalibracion: new Date('2025-02-20'), observaciones: 'Vencida' },
    ]
  });

  // ===== 5. MATRIZ IPC =====
  await prisma.matrizIpc.createMany({
    data: [
      {
        cargo: 'Electricista Industrial', ubicacion: 'Subestación Eléctrica',
        eppsObligatorios: ['Casco dieléctrico', 'Guantes dieléctricos'], herramientasRequeridas: ['Multímetro'], capacitacionesRequeridas: ['Riesgo Eléctrico']
      },
      {
        cargo: 'Técnico en Altura', ubicacion: 'Torres y Estructuras',
        eppsObligatorios: ['Arnés', 'Casco'], herramientasRequeridas: ['Línea de vida'], capacitacionesRequeridas: ['Trabajo en Altura']
      },
      {
        cargo: 'Soldador', ubicacion: 'Taller de Manufactura',
        eppsObligatorios: ['Careta', 'Guantes de carnaza'], herramientasRequeridas: ['Soldadora'], capacitacionesRequeridas: ['Soldadura segura']
      },
      {
        cargo: 'Mecánico', ubicacion: 'Área de Calderas',
        eppsObligatorios: ['Casco', 'Botas', 'Gafas'], herramientasRequeridas: ['Llaves'], capacitacionesRequeridas: ['Mecánica Industrial']
      },
      {
        cargo: 'Ayudante General', ubicacion: 'Patio Central',
        eppsObligatorios: ['Casco', 'Chaleco reflectante'], herramientasRequeridas: ['Escoba', 'Pala'], capacitacionesRequeridas: ['Inducción HSE']
      }
    ]
  });

  const cargos = ['Electricista Industrial', 'Técnico en Altura', 'Soldador', 'Mecánico', 'Ayudante General'];

  // ===== 6. TRABAJADORES MASIVOS (60) =====
  const estadosSalud = [EstadoSalud.APTO, EstadoSalud.APTO, EstadoSalud.APTO, EstadoSalud.APTO, EstadoSalud.APTO_CON_RESTRICCIONES, EstadoSalud.NO_APTO];
  const tallas = ['S', 'M', 'L', 'XL'];
  const trabajadores = [];

  for (let i = 0; i < 60; i++) {
    const sucursalAsignada = faker.helpers.arrayElement(sucursales);
    
    const t = await prisma.trabajador.create({
      data: {
        dni: `DNI-${faker.string.numeric(6)}`,
        nombreCompleto: faker.person.fullName(),
        cargo: faker.helpers.arrayElement(cargos),
        tipoSangre: faker.helpers.arrayElement(['O+', 'A+', 'B+', 'AB+', 'O-']),
        telefonoEmergencia: faker.phone.number(),
        contactoEmergencia: faker.person.fullName(),
        estadoSalud: faker.helpers.arrayElement(estadosSalud),
        tallaCasco: faker.helpers.arrayElement(tallas),
        tallaCamisa: faker.helpers.arrayElement(tallas),
        tallaPantalon: faker.helpers.arrayElement(['30', '32', '34', '36']),
        tallaCalzado: faker.helpers.arrayElement(['26', '27', '28', '29']),
        tallaGuantes: faker.helpers.arrayElement(tallas),
        sucursalId: sucursalAsignada.id,
        codigoQr: `QR-TRAB-${faker.string.alphanumeric(8).toUpperCase()}`,
        creadoEn: faker.date.past({ years: 1 })
      }
    });
    trabajadores.push(t);

    // Entregas de EPP
    const numEntregas = faker.number.int({ min: 1, max: 4 });
    for (let j = 0; j < numEntregas; j++) {
      await prisma.entregaEpp.create({
        data: {
          trabajadorId: t.id,
          tipoEpp: faker.helpers.arrayElement(['Casco', 'Guantes', 'Arnés', 'Botas', 'Gafas', 'Tapones Auditivos']),
          marca: faker.company.name(),
          fechaEntrega: faker.date.past({ years: 1 }),
          fechaVencimiento: faker.date.future({ years: 2 })
        }
      });
    }

    // Capacitaciones
    const numCaps = faker.number.int({ min: 0, max: 3 });
    for (let j = 0; j < numCaps; j++) {
      const fechaRealizacion = faker.date.past({ years: 1.5 });
      const fechaVencimiento = new Date(fechaRealizacion);
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
      const vigente = fechaVencimiento > new Date();

      await prisma.capacitacion.create({
        data: {
          trabajadorId: t.id,
          nombreCurso: faker.helpers.arrayElement(['Trabajo en Altura', 'Riesgo Eléctrico', 'Primeros Auxilios', 'LOTO', 'Manejo de Extintores']),
          institucion: 'STPS Certificados',
          fechaRealizacion,
          fechaVencimiento,
          vigente,
        }
      });
    }
  }

  // ===== 7. INSPECCIONES GENERADAS RANDOM (40) =====
  const estadosInspeccion = [EstadoInspeccion.EN_PROGRESO, EstadoInspeccion.COMPLETADA, EstadoInspeccion.CANCELADA];
  const ubicaciones = ['Área de Calderas', 'Patio Central', 'Taller', 'Subestación', 'Almacén'];
  for (let i = 0; i < 40; i++) {
    const sucursal = faker.helpers.arrayElement(sucursales);
    // Find workers in this sucursal
    const trabSucursal = trabajadores.filter(t => t.sucursalId === sucursal.id);
    if (trabSucursal.length === 0) continue;

    const numTrabInvolucrados = faker.number.int({ min: 1, max: 3 });
    const involucrados = faker.helpers.arrayElements(trabSucursal, Math.min(numTrabInvolucrados, trabSucursal.length));

    const estado = faker.helpers.arrayElement(estadosInspeccion);
    const completado = estado === EstadoInspeccion.COMPLETADA;

    await prisma.inspeccion.create({
      data: {
        supervisorId: faker.helpers.arrayElement(supervisoresIds),
        sucursalId: sucursal.id,
        ubicacion: faker.helpers.arrayElement(ubicaciones),
        tipoTrabajo: faker.helpers.arrayElement(['Excavación', 'Altura', 'Soldadura', 'Eléctrico', 'Mantenimiento General']),
        estado: estado,
        checklist: { preparacion: completado, epp: true, herramientas: true },
        observaciones: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.6 }) || null,
        firmaSupervisor: completado,
        fechaCierre: completado ? faker.date.recent({ days: 30 }) : null,
        creadoEn: faker.date.recent({ days: 60 }),
        trabajadores: {
          create: involucrados.map(t => ({ trabajadorId: t.id }))
        }
      }
    });
  }

  // ===== 8. AMONESTACIONES GENERADAS RANDOM (25) =====
  const severidades = [SeveridadFalta.LEVE, SeveridadFalta.GRAVE, SeveridadFalta.CRITICA];
  const motivosFalta = ['No uso de EPP', 'Acto inseguro', 'Llegada tarde a turno', 'Desvío de protocolo de seguridad', 'Falta de orden y limpieza', 'Uso inadecuado de herramientas'];
  for (let i = 0; i < 25; i++) {
    const trabajador = faker.helpers.arrayElement(trabajadores);
    await prisma.amonestacion.create({
      data: {
        trabajadorId: trabajador.id,
        supervisorId: faker.helpers.arrayElement(supervisoresIds),
        sucursalId: trabajador.sucursalId,
        motivo: faker.helpers.arrayElement(motivosFalta),
        severidad: faker.helpers.arrayElement(severidades),
        descripcion: faker.lorem.paragraph(),
        testimonios: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.5 }) || null,
        fechaEvento: faker.date.recent({ days: 90 }),
      }
    });
  }

  console.log('✅ Datos masivos creados (60 Trabajadores, ~40 Inspecciones, ~25 Amonestaciones)');
  console.log('\n📋 Credenciales de acceso oficiales (Actualizadas a parámetros de seguridad):');
  console.log('   Coordinador:  coordinador@hse.com  / AdminHSE2026!');
  console.log('   Supervisor 1: supervisor1@hse.com  / AdminHSE2026!');
  console.log('   Supervisor 2: supervisor2@hse.com  / AdminHSE2026!');
  console.log('   Gerencia:     gerencia@hse.com     / AdminHSE2026!');
}

main()
  .catch((e) => {
    console.error('❌ Error al sembrar datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
