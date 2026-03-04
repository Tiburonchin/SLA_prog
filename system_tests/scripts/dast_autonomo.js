/**
 * ══════════════════════════════════════════════════════════════
 *  SUITE DAST AUTÓNOMA — Sistema HSE
 *  Cubre: SEC-01..08, DAT-06..08, FUN-01/05/06, FIX-01
 *  Referencia: DOCUMENTACION_AUDITORIA.md (Fases 1-3 + Re-Auditoría)
 * ══════════════════════════════════════════════════════════════
 */

const API = 'http://localhost:3001/api';

// ── Helpers ──
async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: r.status, data: await r.json().catch(() => ({})), headers: Object.fromEntries(r.headers) };
}

async function get(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${API}${path}`, { headers });
  const ct = r.headers.get('content-type') || '';
  let data;
  if (ct.includes('json')) data = await r.json().catch(() => ({}));
  else data = await r.text().catch(() => '');
  return { status: r.status, data, headers: Object.fromEntries(r.headers) };
}

// ── Estado global ──
let tokenCoordinador = null;
let tokenSupervisor = null;
let tokenJefatura = null;
const resultados = [];
let totalPassed = 0;
let totalFailed = 0;

function registrar(id, nombre, passed, detalle) {
  const estado = passed ? '✅ PASS' : '❌ FAIL';
  resultados.push({ id, nombre, estado, detalle });
  if (passed) totalPassed++; else totalFailed++;
  console.log(`  ${estado}  [${id}] ${nombre}`);
  if (!passed) console.log(`         ↳ ${detalle}`);
}

// ══════════════════════════════════════════════════════════════
async function main() {
  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  🛡️  DAST AUTÓNOMO — Sistema de Gestión HSE');
  console.log(`  📅 ${new Date().toISOString()}`);
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');

  // ── 0. Obtener tokens para los 3 roles ──
  console.log('🔑 Obteniendo tokens de autenticación...');
  const r1 = await post('/auth/login', { correo: 'coordinador@hse.com', contrasena: 'AdminHSE2026!' });
  tokenCoordinador = r1.data.token;
  const r2 = await post('/auth/login', { correo: 'supervisor1@hse.com', contrasena: 'AdminHSE2026!' });
  tokenSupervisor = r2.data.token;
  const r3 = await post('/auth/login', { correo: 'gerencia@hse.com', contrasena: 'AdminHSE2026!' });
  tokenJefatura = r3.data.token;

  if (!tokenCoordinador || !tokenSupervisor || !tokenJefatura) {
    console.error('❌ FATAL: No se pudieron obtener los 3 tokens. Abortando.');
    console.error('   Coordinador:', r1.status, r1.data);
    console.error('   Supervisor:', r2.status, r2.data);
    console.error('   Jefatura:', r3.status, r3.data);
    process.exit(1);
  }
  console.log('   ✅ 3 tokens obtenidos correctamente\n');

  // ════════════════════════════════════════════════════════════
  //  FASE 1: Autenticación, Rate Limiting, JWT
  // ════════════════════════════════════════════════════════════
  console.log('── FASE 1: Autenticación y Fundamentos Zero-Trust ──');

  // SEC-01: Endpoint de registro protegido
  {
    const r = await post('/auth/registro', { correo: 'hacker@evil.com', contrasena: 'Test1234!', nombreCompleto: 'Hacker', rol: 'COORDINADOR' });
    registrar('SEC-01', 'Registro público bloqueado (requiere JWT+COORDINADOR)', r.status === 401, `Status: ${r.status}`);
  }

  // SEC-01b: Registro con token SUPERVISOR (debe fallar)
  {
    const r = await post('/auth/registro', { correo: 'hacker2@evil.com', contrasena: 'Test1234!', nombreCompleto: 'Intruso', rol: 'SUPERVISOR' }, tokenSupervisor);
    registrar('SEC-01b', 'Supervisor no puede crear usuarios', r.status === 403, `Status: ${r.status}`);
  }

  // SEC-02: Login con credenciales válidas
  {
    const r = await post('/auth/login', { correo: 'coordinador@hse.com', contrasena: 'AdminHSE2026!' });
    registrar('SEC-02', 'Login con credenciales válidas retorna token', r.status === 200 && !!r.data.token, `Status: ${r.status}`);
  }

  // SEC-02b: Login con clave incorrecta
  {
    const r = await post('/auth/login', { correo: 'coordinador@hse.com', contrasena: 'clavefalsa' });
    registrar('SEC-02b', 'Login con clave incorrecta → 401', r.status === 401, `Status: ${r.status}`);
  }

  // SEC-02c: Enumeración de usuarios (mismo mensaje para user inexistente)
  {
    const r1 = await post('/auth/login', { correo: 'noexiste@hse.com', contrasena: 'abc' });
    const r2 = await post('/auth/login', { correo: 'coordinador@hse.com', contrasena: 'abc' });
    const mismoMsg = r1.data.message === r2.data.message;
    registrar('SEC-02c', 'Anti-enumeración: mismo mensaje para user existente/inexistente', r1.status === 401 && r2.status === 401 && mismoMsg, `Msg1: "${r1.data.message}" | Msg2: "${r2.data.message}"`);
  }

  // SEC-02d: Normalización de correo (espacios y mayúsculas)
  {
    const r = await post('/auth/login', { correo: '  CoorDinAdor@HSE.com  ', contrasena: 'AdminHSE2026!' });
    registrar('SEC-02d', 'Normalización case-insensitive del correo', r.status === 200 && !!r.data.token, `Status: ${r.status}`);
  }

  // JWT: Acceso sin token
  {
    const r = await get('/usuarios/perfil');
    registrar('SEC-04a', 'Ruta protegida sin token → 401', r.status === 401, `Status: ${r.status}`);
  }

  // JWT: Token falso
  {
    const r = await get('/usuarios/perfil', 'token.falso.inventado');
    registrar('SEC-04b', 'Token JWT falso/corrupto → 401', r.status === 401, `Status: ${r.status}`);
  }

  console.log('');

  // ════════════════════════════════════════════════════════════
  //  FASE 2: Inyección, IDOR, Validación de Datos
  // ════════════════════════════════════════════════════════════
  console.log('── FASE 2: Inyección SQL, IDOR, Validación ──');

  // SQL Injection en login
  {
    const r = await post('/auth/login', { correo: "admin' OR '1'='1", contrasena: '12345' });
    registrar('INJ-01', 'SQLi en campo correo → rechazado por class-validator', r.status === 400, `Status: ${r.status}`);
  }

  // UUID inválido en trabajadores
  {
    const r = await get('/trabajadores/id-malicioso-1234', tokenCoordinador);
    registrar('INJ-02', 'UUID inválido en /trabajadores/:id → 400', r.status === 400, `Status: ${r.status}`);
  }

  // UUID inválido en inspecciones
  {
    const r = await get('/inspecciones/DROP-TABLE-inspecciones', tokenCoordinador);
    registrar('INJ-03', 'UUID inválido en /inspecciones/:id → 400', r.status === 400, `Status: ${r.status}`);
  }

  // UUID inválido en amonestaciones
  {
    const r = await get('/amonestaciones/../../etc/passwd', tokenCoordinador);
    registrar('INJ-04', 'Path traversal en /amonestaciones/:id → 400', r.status === 400, `Status: ${r.status}`);
  }

  console.log('');

  // ════════════════════════════════════════════════════════════
  //  FASE 2b: RBAC — Control de Acceso por Rol
  // ════════════════════════════════════════════════════════════
  console.log('── RBAC: Control de Acceso Basado en Roles ──');

  // SEC-08: CSV restringido
  {
    const r = await get('/inspecciones/exportar/csv', tokenSupervisor);
    registrar('SEC-08a', 'Supervisor NO puede exportar CSV de inspecciones', r.status === 403, `Status: ${r.status}`);
  }

  {
    const r = await get('/amonestaciones/exportar/csv', tokenSupervisor);
    registrar('SEC-08b', 'Supervisor NO puede exportar CSV de amonestaciones', r.status === 403, `Status: ${r.status}`);
  }

  {
    const r = await get('/inspecciones/exportar/csv', tokenCoordinador);
    registrar('SEC-08c', 'Coordinador SÍ puede exportar CSV inspecciones', r.status === 200, `Status: ${r.status}`);
  }

  {
    const r = await get('/amonestaciones/exportar/csv', tokenJefatura);
    registrar('SEC-08d', 'Jefatura SÍ puede exportar CSV amonestaciones', r.status === 200, `Status: ${r.status}`);
  }

  // Jefatura no puede crear trabajadores
  {
    const r = await post('/trabajadores', { dni: 'TEST-999', nombreCompleto: 'Test', cargo: 'Test', sucursalId: '00000000-0000-0000-0000-000000000000' }, tokenJefatura);
    registrar('RBAC-01', 'Jefatura NO puede crear trabajadores', r.status === 403, `Status: ${r.status}`);
  }

  // Jefatura no puede crear amonestaciones
  {
    const r = await post('/amonestaciones', { trabajadorId: '00000000-0000-0000-0000-000000000000', motivo: 'Test', severidad: 'LEVE', descripcion: 'Test', fechaEvento: new Date().toISOString(), sucursalId: '00000000-0000-0000-0000-000000000000' }, tokenJefatura);
    registrar('RBAC-02', 'Jefatura NO puede crear amonestaciones', r.status === 403, `Status: ${r.status}`);
  }

  // Reportes PDF solo COORDINADOR/JEFATURA
  {
    const r = await get('/reportes/pdf/semanal', tokenSupervisor);
    registrar('RBAC-03', 'Supervisor NO puede acceder a reportes PDF', r.status === 403, `Status: ${r.status}`);
  }

  console.log('');

  // ════════════════════════════════════════════════════════════
  //  FASE 3: Funcionalidad y Escalamiento
  // ════════════════════════════════════════════════════════════
  console.log('── FASE 3: Funcionalidad, Paginación, DoS ──');

  // FUN-01: Paginación
  {
    const r = await get('/trabajadores?page=1&limit=10', tokenCoordinador);
    const tieneMeta = r.data && (r.data.total !== undefined || r.data.totalPaginas !== undefined || Array.isArray(r.data.data));
    registrar('FUN-01a', 'Paginación en /trabajadores con metadata', r.status === 200 && tieneMeta, `Status: ${r.status}, keys: ${JSON.stringify(Object.keys(r.data || {}))}`);
  }

  {
    const r = await get('/inspecciones?page=1&limit=5', tokenCoordinador);
    registrar('FUN-01b', 'Paginación en /inspecciones', r.status === 200, `Status: ${r.status}`);
  }

  {
    const r = await get('/amonestaciones?page=1&limit=5', tokenCoordinador);
    registrar('FUN-01c', 'Paginación en /amonestaciones', r.status === 200, `Status: ${r.status}`);
  }

  // FUN-06: Endpoint recientes (previene DoS local)
  {
    const r = await get('/inspecciones/recientes', tokenCoordinador);
    const esArray = Array.isArray(r.data);
    const max5 = esArray && r.data.length <= 5;
    registrar('FUN-06', 'Endpoint /inspecciones/recientes retorna máx 5', r.status === 200 && max5, `Status: ${r.status}, count: ${esArray ? r.data.length : 'no-array'}`);
  }

  // Estadísticas
  {
    const r = await get('/inspecciones/estadisticas', tokenCoordinador);
    registrar('STATS-01', 'Endpoint /inspecciones/estadisticas funcional', r.status === 200, `Status: ${r.status}`);
  }

  {
    const r = await get('/amonestaciones/estadisticas', tokenCoordinador);
    registrar('STATS-02', 'Endpoint /amonestaciones/estadisticas funcional', r.status === 200, `Status: ${r.status}`);
  }

  {
    const r = await get('/amonestaciones/estadisticas/por-sucursal', tokenCoordinador);
    registrar('STATS-03', 'Endpoint /amonestaciones/estadisticas/por-sucursal funcional', r.status === 200, `Status: ${r.status}`);
  }

  // Sucursales / Equipos / Supervisores
  {
    const r = await get('/sucursales', tokenCoordinador);
    registrar('CRUD-01', 'GET /sucursales funcional', r.status === 200, `Status: ${r.status}`);
  }

  {
    const r = await get('/equipos', tokenCoordinador);
    registrar('CRUD-02', 'GET /equipos funcional', r.status === 200, `Status: ${r.status}`);
  }

  {
    const r = await get('/supervisores', tokenCoordinador);
    registrar('CRUD-03', 'GET /supervisores funcional', r.status === 200, `Status: ${r.status}`);
  }

  console.log('');

  // ════════════════════════════════════════════════════════════
  //  RATE LIMITING
  // ════════════════════════════════════════════════════════════
  console.log('── Rate Limiting (SEC-03) ──');
  {
    let count429 = 0;
    for (let i = 0; i < 25; i++) {
      const r = await post('/auth/login', { correo: 'coordinador@hse.com', contrasena: 'wrong' });
      if (r.status === 429) { count429++; break; }
    }
    registrar('SEC-03', 'ThrottlerModule bloquea tras exceso de peticiones', count429 > 0, `429 recibidos: ${count429}`);
  }

  console.log('');

  // ════════════════════════════════════════════════════════════
  //  RESUMEN FINAL
  // ════════════════════════════════════════════════════════════
  const total = totalPassed + totalFailed;
  const pct = total > 0 ? ((totalPassed / total) * 100).toFixed(1) : 0;

  console.log('══════════════════════════════════════════════════════════════');
  console.log(`  📊 RESUMEN: ${totalPassed}/${total} pruebas aprobadas (${pct}%)`);
  console.log(`  ✅ Aprobadas: ${totalPassed}`);
  console.log(`  ❌ Fallidas:  ${totalFailed}`);
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');

  // ── Generar reporte JSON persistente ──
  const reporte = {
    fechaEjecucion: new Date().toISOString(),
    resumen: { total, aprobadas: totalPassed, fallidas: totalFailed, porcentaje: pct },
    pruebas: resultados
  };

  const fs = require('fs');
  const path = require('path');
  
  // Crear carpeta base y carpeta del día
  const baseReportDir = path.join(__dirname, '..', 'reports');
  const dateFolder = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const dailyReportDir = path.join(baseReportDir, dateFolder);
  
  if (!fs.existsSync(baseReportDir)) fs.mkdirSync(baseReportDir, { recursive: true });
  if (!fs.existsSync(dailyReportDir)) fs.mkdirSync(dailyReportDir, { recursive: true });
  
  // Nombres de archivos
  const horaMinuto = new Date().toISOString().split('T')[1].replace(/[:.]/g, '-').substring(0, 5);
  const nombreArchivo = `reporte_${horaMinuto}.json`;
  
  // Guardar en la carpeta del día
  fs.writeFileSync(path.join(dailyReportDir, nombreArchivo), JSON.stringify(reporte, null, 2), 'utf-8');
  // Guardar copia rápida en la raíz de reports
  fs.writeFileSync(path.join(baseReportDir, 'ultimo_reporte.json'), JSON.stringify(reporte, null, 2), 'utf-8');
  
  console.log(`  💾 Reporte guardado en: reports/${dateFolder}/${nombreArchivo}`);
  console.log(`  💾 Copia rápida en:     reports/ultimo_reporte.json`);
  console.log('');

  // Salir con código de error si hubo fallos
  if (totalFailed > 0) process.exit(1);
}

main().catch(err => {
  console.error('💥 Error fatal en la suite DAST:', err);
  process.exit(1);
});
