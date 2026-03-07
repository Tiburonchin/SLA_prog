import 'dotenv/config';
import { PrismaClient, Rol, EstadoEMO, EstadoLaboral, EstadoEquipo, SeveridadFalta, EstadoInspeccion, TipoExamenMedico, TipoInstalacion, NivelRiesgo, CategoriaIncendio, ResultadoInspeccionSUNAFIL } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { fakerES as faker } from '@faker-js/faker';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Helpers de fecha para datos de prueba dinámicos ────────────────────────
const hoy = new Date();
const enDias = (dias: number): Date => {
  const d = new Date(hoy);
  d.setDate(d.getDate() + dias);
  return d;
};
const enMeses = (meses: number): Date => {
  const d = new Date(hoy);
  d.setMonth(d.getMonth() + meses);
  return d;
};

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
  await prisma.examenMedico.deleteMany();  // FASE 2: limpiar antes de trabajadores (onDelete: Restrict)
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

  // ===== 2. SUCURSALES (con datos SUNAFIL / INDECI / Ley 29783) =====
  const sucursal1 = await prisma.sucursal.create({
    data: {
      nombre: 'Planta Norte - Monterrey',
      direccion: 'Av. Industrial 1450',
      latitud: 25.6866,
      longitud: -100.3161,
      // Clasificación
      tipoInstalacion: TipoInstalacion.PLANTA_INDUSTRIAL,
      nivelRiesgo: NivelRiesgo.ALTO,
      categoriaIncendio: CategoriaIncendio.ALTO,
      // Datos legales
      codigoCIIU: 'C2599',
      codigoEstablecimientoINDECI: 'INDECI-MTY-2024-001',
      numeroCertificadoDC: 'CDC-2024-NL-1450',
      vencimientoCertificadoDC: new Date('2025-06-30'),
      fechaProximaRevisionDC: new Date('2026-05-01'),
      // Infraestructura
      aforoMaximo: 320,
      areaM2: 4800.0,
      numeroPisos: 2,
      anioConstruccion: 2008,
      zonaRiesgoSismico: 3,
      // Gestión emergencias
      responsableSSTNombre: 'Ing. Pedro Villarreal',
      responsableSSTTelefono: '+52 81 9900 1122',
      medicoOcupacionalNombre: 'Dra. Lucía Herrera',
      centroMedicoMasCercano: 'Hospital General de Zona #17 IMSS',
      telefonoCentroMedico: '+52 81 8040 0000',
      cantidadExtintores: 28,
      tieneDesfibriladorDEA: true,
      ubicacionDEA: 'Recepción principal, pared norte junto a salida de emergencia',
      cantidadBotiquines: 8,
      tieneEnfermeria: true,
      telefonoEmergenciasSede: '+52 81 9900 0000',
      // Plan de emergencia
      planEmergenciaVigente: true,
      fechaVencimientoPlanEmergencia: new Date('2026-12-31'),
      fechaUltimoSimulacro: new Date('2025-09-15'),
      cantidadSimulacrosAnio: 2,
      // JSONB
      brigadasEmergencia: [
        { tipo: 'Evacuación', jefe: 'Mario Castillo', miembros: 12, certificado: true },
        { tipo: 'Primeros Auxilios', jefe: 'Carmen López', miembros: 6, certificado: true },
        { tipo: 'Contra Incendio', jefe: 'Luis Moreno', miembros: 8, certificado: true },
      ],
      peligrosIdentificados: [
        { tipo: 'Eléctrico', nivel: 'ALTO', zona: 'Sala de compresores', control: 'Interruptores diferenciales + EPP dieléctrico' },
        { tipo: 'Caída a distinto nivel', nivel: 'ALTO', zona: 'Línea de producción piso 2', control: 'Barandas + arnés obligatorio' },
        { tipo: 'Ruido', nivel: 'MEDIO', zona: 'Toda la planta', control: 'Tapones auditivos 3M 1100 obligatorios' },
      ],
      // Trazabilidad SUNAFIL
      fechaUltimaInspeccionSUNAFIL: new Date('2025-03-10'),
      resultadoUltimaInspeccion: ResultadoInspeccionSUNAFIL.OBSERVADO,
      observacionesLegalesActivas: 'OBS-SUNAFIL-2025-03: Señalización de vías de evacuación incompleta en piso 2. Plazo subsanación: 30 días.',
    },
  });

  const sucursal2 = await prisma.sucursal.create({
    data: {
      nombre: 'Planta Sur - Guadalajara',
      direccion: 'Blvd. Manufacturas 320',
      latitud: 20.6597,
      longitud: -103.3496,
      tipoInstalacion: TipoInstalacion.ALMACEN,
      nivelRiesgo: NivelRiesgo.MEDIO,
      categoriaIncendio: CategoriaIncendio.ORDINARIO,
      codigoCIIU: 'G4690',
      codigoEstablecimientoINDECI: 'INDECI-GDL-2024-002',
      numeroCertificadoDC: 'CDC-2024-JA-0320',
      vencimientoCertificadoDC: new Date('2026-08-15'),
      fechaProximaRevisionDC: new Date('2026-07-01'),
      aforoMaximo: 150,
      areaM2: 2200.5,
      numeroPisos: 1,
      anioConstruccion: 2015,
      zonaRiesgoSismico: 4,
      responsableSSTNombre: 'Lic. Sandra Rojas',
      responsableSSTTelefono: '+52 33 3300 4455',
      medicoOcupacionalNombre: 'Dr. Alejandro Reyes',
      centroMedicoMasCercano: 'Hospital Civil de Guadalajara',
      telefonoCentroMedico: '+52 33 3614 7070',
      cantidadExtintores: 14,
      tieneDesfibriladorDEA: false,
      ubicacionDEA: null,
      cantidadBotiquines: 4,
      tieneEnfermeria: false,
      telefonoEmergenciasSede: '+52 33 3300 0000',
      planEmergenciaVigente: true,
      fechaVencimientoPlanEmergencia: new Date('2026-11-30'),
      fechaUltimoSimulacro: new Date('2026-01-20'),
      cantidadSimulacrosAnio: 1,
      brigadasEmergencia: [
        { tipo: 'Evacuación', jefe: 'Roberto Navarro', miembros: 8, certificado: true },
        { tipo: 'Primeros Auxilios', jefe: 'Sofía Mendez', miembros: 4, certificado: false },
      ],
      peligrosIdentificados: [
        { tipo: 'Incendio', nivel: 'MEDIO', zona: 'Área de almacenamiento materiales inflamables', control: 'Extintores CO2 + gabinete contraincendios' },
        { tipo: 'Ergonómico', nivel: 'MEDIO', zona: 'Zona de carga y descarga', control: 'Fajas lumbares + capacitación levantamiento manual' },
      ],
      fechaUltimaInspeccionSUNAFIL: new Date('2025-07-22'),
      resultadoUltimaInspeccion: ResultadoInspeccionSUNAFIL.CONFORME,
      observacionesLegalesActivas: null,
    },
  });

  const sucursal3 = await prisma.sucursal.create({
    data: {
      nombre: 'Oficina Central - CDMX',
      direccion: 'Paseo de la Reforma 505',
      latitud: 19.4326,
      longitud: -99.1332,
      tipoInstalacion: TipoInstalacion.OFICINA,
      nivelRiesgo: NivelRiesgo.BAJO,
      categoriaIncendio: CategoriaIncendio.BAJO,
      codigoCIIU: 'M7010',
      codigoEstablecimientoINDECI: 'INDECI-CDMX-2024-003',
      numeroCertificadoDC: 'CDC-2024-DF-0505',
      vencimientoCertificadoDC: new Date('2027-01-31'),
      fechaProximaRevisionDC: new Date('2026-12-15'),
      aforoMaximo: 80,
      areaM2: 650.0,
      numeroPisos: 4,
      anioConstruccion: 1998,
      zonaRiesgoSismico: 4,
      responsableSSTNombre: 'Ing. Patricia Ruiz',
      responsableSSTTelefono: '+52 55 5000 6677',
      medicoOcupacionalNombre: 'Dr. Carlos Mendoza',
      centroMedicoMasCercano: 'Hospital ABC Santa Fe',
      telefonoCentroMedico: '+52 55 5230 8000',
      cantidadExtintores: 6,
      tieneDesfibriladorDEA: true,
      ubicacionDEA: 'Recepción piso 1, junto al elevador principal',
      cantidadBotiquines: 2,
      tieneEnfermeria: false,
      telefonoEmergenciasSede: '+52 55 5000 0000',
      planEmergenciaVigente: true,
      fechaVencimientoPlanEmergencia: new Date('2027-01-31'),
      fechaUltimoSimulacro: new Date('2025-11-05'),
      cantidadSimulacrosAnio: 2,
      brigadasEmergencia: [
        { tipo: 'Evacuación', jefe: 'Claudia Torres', miembros: 6, certificado: true },
        { tipo: 'Primeros Auxilios', jefe: 'Miguel Ángel Cruz', miembros: 3, certificado: true },
      ],
      peligrosIdentificados: [
        { tipo: 'Sísmico', nivel: 'ALTO', zona: 'Todo el edificio - CDMX zona IV', control: 'Simulacros sísmicos trimestrales + kit de emergencia por piso' },
        { tipo: 'Ergonómico / Visual', nivel: 'BAJO', zona: 'Áreas de trabajo en pantalla', control: 'Pausas activas + configuración ergonómica de estaciones' },
      ],
      fechaUltimaInspeccionSUNAFIL: new Date('2024-11-18'),
      resultadoUltimaInspeccion: ResultadoInspeccionSUNAFIL.CONFORME,
      observacionesLegalesActivas: null,
    },
  });

  // ── SUCURSALES DE PRUEBA DIRIGIDA (alertas UI + Cron Job DC) ─────────────

  // ALERTA ROJA: certificado vence en exactamente 15 días → dispara cron
  const sucursalCallao = await prisma.sucursal.create({
    data: {
      nombre: 'Planta Industrial Callao',
      direccion: 'Av. Néstor Gambetta 4380, Callao',
      latitud: -12.0464,
      longitud: -77.0927,
      tipoInstalacion: TipoInstalacion.PLANTA_INDUSTRIAL,
      nivelRiesgo: NivelRiesgo.CRITICO,
      categoriaIncendio: CategoriaIncendio.ALTO,
      codigoCIIU: 'C2410',
      codigoEstablecimientoINDECI: 'INDECI-CALLAO-2024-010',
      numeroCertificadoDC: 'CDC-2024-CALLAO-010',
      vencimientoCertificadoDC: enDias(15),          // ← dispara alerta roja del cron
      fechaProximaRevisionDC: enDias(10),
      aforoMaximo: 450,
      areaM2: 7200.0,
      numeroPisos: 3,
      anioConstruccion: 2005,
      zonaRiesgoSismico: 4,
      responsableSSTNombre: 'Ing. César Quispe Flores',
      responsableSSTTelefono: '+51 1 480 0001',
      medicoOcupacionalNombre: 'Dr. Raúl Mendoza',
      centroMedicoMasCercano: 'Hospital Daniel A. Carrión – Callao',
      telefonoCentroMedico: '+51 1 453 0000',
      cantidadExtintores: 42,
      tieneDesfibriladorDEA: true,
      ubicacionDEA: 'Portería principal, columna A-01',
      cantidadBotiquines: 12,
      tieneEnfermeria: true,
      telefonoEmergenciasSede: '+51 1 480 0000',
      planEmergenciaVigente: true,
      fechaVencimientoPlanEmergencia: enMeses(2),
      fechaUltimoSimulacro: enDias(-45),
      cantidadSimulacrosAnio: 3,
      brigadasEmergencia: [
        { tipo: 'Evacuación',       jefe: 'Jorge Ramírez',  miembros: 14, certificado: true  },
        { tipo: 'Primeros Auxilios', jefe: 'Silvia Cano',   miembros: 7,  certificado: true  },
        { tipo: 'Contra Incendio',  jefe: 'Víctor Palomino', miembros: 10, certificado: true },
        { tipo: 'Comunicaciones',   jefe: 'Luciana Torres', miembros: 4,  certificado: false },
      ],
      peligrosIdentificados: [
        { tipo: 'Explosivo / Presión', nivel: 'CRITICO', zona: 'Sala de calderas B-2', control: 'Válvulas de seguridad + monitoreo continuo' },
        { tipo: 'Químico',             nivel: 'ALTO',    zona: 'Almacén de insumos',  control: 'Ventilación forzada + hojas MSDS' },
        { tipo: 'Eléctrico BT/MT',     nivel: 'ALTO',    zona: 'Subestación E-01',    control: 'Interbloqueos + EPP dieléctrico' },
        { tipo: 'Ruido Industrial',    nivel: 'ALTO',    zona: 'Toda la planta',      control: 'Tapones 3M 1100 obligatorios' },
      ],
      fechaUltimaInspeccionSUNAFIL: enDias(-30),
      resultadoUltimaInspeccion: ResultadoInspeccionSUNAFIL.OBSERVADO,
      observacionesLegalesActivas: 'OBS-SUNAFIL-2026-01: Renovar certificado DC para evitar paralización. Plazo: inmediato.',
    },
  });

  // ESTADO NORMAL: todo en regla, certificado vigente por 1 año
  const sucursalOficina = await prisma.sucursal.create({
    data: {
      nombre: 'Oficina Administrativa Lima',
      direccion: 'Av. República de Panamá 3660, San Isidro',
      latitud: -12.0953,
      longitud: -77.0311,
      tipoInstalacion: TipoInstalacion.OFICINA,
      nivelRiesgo: NivelRiesgo.BAJO,
      categoriaIncendio: CategoriaIncendio.BAJO,
      codigoCIIU: 'M7010',
      codigoEstablecimientoINDECI: 'INDECI-LIMA-2025-020',
      numeroCertificadoDC: 'CDC-2025-LIMA-020',
      vencimientoCertificadoDC: enDias(365),          // ← vigente, no dispara alertas
      fechaProximaRevisionDC: enDias(335),
      aforoMaximo: 90,
      areaM2: 720.0,
      numeroPisos: 5,
      anioConstruccion: 2010,
      zonaRiesgoSismico: 4,
      responsableSSTNombre: 'Lic. Patricia Núñez',
      responsableSSTTelefono: '+51 1 610 5500',
      medicoOcupacionalNombre: 'Dra. Mónica Salas',
      centroMedicoMasCercano: 'Clínica Ricardo Palma',
      telefonoCentroMedico: '+51 1 224 2224',
      cantidadExtintores: 8,
      tieneDesfibriladorDEA: true,
      ubicacionDEA: 'Recepción piso 1, junto al elevador',
      cantidadBotiquines: 3,
      tieneEnfermeria: false,
      telefonoEmergenciasSede: '+51 1 610 5555',
      planEmergenciaVigente: true,
      fechaVencimientoPlanEmergencia: enMeses(11),
      fechaUltimoSimulacro: enDias(-20),
      cantidadSimulacrosAnio: 2,
      brigadasEmergencia: [
        { tipo: 'Evacuación',       jefe: 'Carmen Vidal',   miembros: 8, certificado: true },
        { tipo: 'Primeros Auxilios', jefe: 'Andrés Pinto',  miembros: 4, certificado: true },
      ],
      peligrosIdentificados: [
        { tipo: 'Sísmico',             nivel: 'ALTO', zona: 'Todo el edificio', control: 'Simulacros sísmicos + kit de emergencia por piso' },
        { tipo: 'Ergonómico / Visual', nivel: 'BAJO', zona: 'Estaciones de trabajo', control: 'Pausas activas + evaluación ergonómica anual' },
      ],
      fechaUltimaInspeccionSUNAFIL: enDias(-60),
      resultadoUltimaInspeccion: ResultadoInspeccionSUNAFIL.CONFORME,
      observacionesLegalesActivas: null,
    },
  });

  const sucursales = [sucursal1, sucursal2, sucursal3, sucursalCallao, sucursalOficina];

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

  // ===== 6. TRABAJADORES DE PRUEBA DIRIGIDA (Planta Callao) =====
  // Estos 4 registros permiten probar todas las variantes de alerta de la UI.

  // T1 — APTO_RESTRICCION + alergia crítica → alerta visual amarilla + badge médico
  const trabajadorT1 = await prisma.trabajador.create({
    data: {
      dni: 'DNI-T1-TEST01',
      nombreCompleto: 'Miguel Ángel Huanca Quispe',
      cargo: 'Operario de Producción',
      tipoSangre: 'O+',
      telefonoEmergencia: '+51 987 001 001',
      contactoEmergencia: 'Rosa Quispe (esposa)',
      estadoEMO: EstadoEMO.APTO_RESTRICCION,
      fechaVencimientoEMO: enMeses(3),
      estadoLaboral: EstadoLaboral.ACTIVO,
      alergiasCriticas: 'Penicilina',
      condicionesPreexistentes: 'Asma leve controlada',
      eps: 'EsSalud',
      tallaCasco: 'M',
      tallaCamisa: 'L',
      tallaPantalon: '32',
      tallaCalzado: '27',
      tallaGuantes: 'M',
      sucursalId: sucursalCallao.id,
      codigoQr: 'QR-TEST-T1-CALLAO',
      fechaIngreso: enDias(-730),
    },
  });

  // T2 — APTO sin restricciones → estado verde de referencia
  const trabajadorT2 = await prisma.trabajador.create({
    data: {
      dni: 'DNI-T2-TEST02',
      nombreCompleto: 'Carlos Enrique Mendoza Vega',
      cargo: 'Soldador Industrial',
      tipoSangre: 'A+',
      telefonoEmergencia: '+51 987 002 002',
      contactoEmergencia: 'Elena Vega (madre)',
      estadoEMO: EstadoEMO.APTO,
      fechaVencimientoEMO: enMeses(10),
      estadoLaboral: EstadoLaboral.ACTIVO,
      alergiasCriticas: null,
      condicionesPreexistentes: null,
      eps: 'Rímac Seguros',
      tallaCasco: 'L',
      tallaCamisa: 'XL',
      tallaPantalon: '34',
      tallaCalzado: '28',
      tallaGuantes: 'L',
      sucursalId: sucursalCallao.id,
      codigoQr: 'QR-TEST-T2-CALLAO',
      fechaIngreso: enDias(-1095),
    },
  });

  // T3 — NO_APTO → alerta roja "detención de labores" (Ley 29783 Art. 49)
  const trabajadorT3 = await prisma.trabajador.create({
    data: {
      dni: 'DNI-T3-TEST03',
      nombreCompleto: 'Luis Alberto Paredes Castro',
      cargo: 'Técnico de Mantenimiento',
      tipoSangre: 'B+',
      telefonoEmergencia: '+51 987 003 003',
      contactoEmergencia: 'María Castro (madre)',
      estadoEMO: EstadoEMO.NO_APTO,
      fechaVencimientoEMO: enDias(-10),   // EMO vencido y NO_APTO
      estadoLaboral: EstadoLaboral.ACTIVO,
      alergiasCriticas: null,
      condicionesPreexistentes: 'Hernia lumbar L4-L5 diagnosticada',
      eps: 'Pacífico Seguros',
      tallaCasco: 'S',
      tallaCamisa: 'M',
      tallaPantalon: '30',
      tallaCalzado: '26',
      tallaGuantes: 'S',
      sucursalId: sucursalCallao.id,
      codigoQr: 'QR-TEST-T3-CALLAO',
      fechaIngreso: enDias(-400),
    },
  });

  // T4 — CESADO → soft-delete de rol laboral; NO debe aparecer en listas activas
  await prisma.trabajador.create({
    data: {
      dni: 'DNI-T4-TEST04',
      nombreCompleto: 'Fernando José Rivas Salas',
      cargo: 'Ex-Supervisor de Seguridad',
      tipoSangre: 'AB-',
      telefonoEmergencia: '+51 987 004 004',
      contactoEmergencia: 'Norma Salas (cónyuge)',
      estadoEMO: EstadoEMO.APTO,
      estadoLaboral: EstadoLaboral.CESADO,  // ← no aparece en listas activas
      activo: false,
      deletedAt: enDias(-30),               // soft-delete explícito
      alergiasCriticas: null,
      eps: 'EsSalud',
      tallaCasco: 'M',
      tallaCamisa: 'L',
      tallaPantalon: '32',
      tallaCalzado: '27',
      tallaGuantes: 'M',
      sucursalId: sucursalCallao.id,
      codigoQr: 'QR-TEST-T4-CALLAO-CESADO',
      fechaIngreso: enDias(-1460),
    },
  });

  console.log('🎯 Datos de prueba dirigida creados: 2 sucursales específicas + 4 trabajadores de prueba.');

  // ===== 7. TRABAJADORES MASIVOS (60) =====
  const estadosEMO = [EstadoEMO.APTO, EstadoEMO.APTO, EstadoEMO.APTO, EstadoEMO.APTO, EstadoEMO.APTO_RESTRICCION, EstadoEMO.NO_APTO];
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
        estadoEMO: faker.helpers.arrayElement(estadosEMO),
        estadoLaboral: EstadoLaboral.ACTIVO,
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

  // ===== 8. INSPECCIONES GENERADAS RANDOM (40) =====
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

  // ===== 9. AMONESTACIONES GENERADAS RANDOM (25) =====
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

  // ===== 10. EXÁMENES MÉDICOS OCUPACIONALES — FASE 2 =====
  // Genera historial real de EMO para 30 trabajadores aleatorios
  const tiposExamen = [TipoExamenMedico.INGRESO, TipoExamenMedico.PERIODICO, TipoExamenMedico.REINTEGRO];
  const estadosEmo  = [EstadoEMO.APTO, EstadoEMO.APTO_RESTRICCION, EstadoEMO.NO_APTO];
  const instituciones = ['Clínica Salud Laboral SA', 'Centro Médico IMSS', 'Preventiva Ocupacional Norte', 'Médicos Industriales SRL'];

  for (let i = 0; i < 40; i++) {
    const trabajador  = faker.helpers.arrayElement(trabajadores);
    const tipo        = faker.helpers.arrayElement(tiposExamen);
    const estado      = faker.helpers.arrayElement(estadosEmo);
    const fechaExamen = faker.date.recent({ days: 365 });
    const proximoVencimiento = new Date(fechaExamen);
    proximoVencimiento.setFullYear(proximoVencimiento.getFullYear() + 1);

    await prisma.examenMedico.create({
      data: {
        trabajadorId:        trabajador.id,
        tipoExamen:          tipo,
        fechaExamen,
        estado,
        restricciones:       estado === EstadoEMO.APTO_RESTRICCION
                               ? faker.helpers.arrayElement(['No trabajo en altura', 'Máx 4 horas operación de maquinaria', 'Sin exposición a ruido >85dB'])
                               : null,
        observaciones:       faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.4 }) || null,
        medicoEvaluador:     faker.person.fullName(),
        institucion:         faker.helpers.arrayElement(instituciones),
        documentoUrl:        null,
        proximoVencimiento,
      }
    });
  }

  console.log('✅ Datos masivos creados (60 Trabajadores aleatorios + 4 dirigidos, ~40 Inspecciones, ~25 Amonestaciones, 40 EMO).');
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
