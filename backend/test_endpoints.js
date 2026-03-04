// Test script - uses built-in fetch (Node 18+)
async function testApi() {
  const API_URL = 'http://localhost:3001/api';
  const results = [];

  // 1. Login
  console.log('=== LOGIN TEST ===');
  let token;
  try {
    const loginRes = await fetch(API_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'coordinador@hse.com', contrasena: 'admin123' })
    });
    console.log('Login status:', loginRes.status);
    if (!loginRes.ok) {
      const txt = await loginRes.text();
      console.log('LOGIN FAILED:', txt);
      results.push({ endpoint: '/auth/login', status: loginRes.status, error: txt });
      return;
    }
    const loginData = await loginRes.json();
    token = loginData.access_token;
    console.log('Login OK, token received');
  } catch (e) {
    console.log('LOGIN ERROR:', e.message);
    results.push({ endpoint: '/auth/login', status: 'NETWORK_ERROR', error: e.message });
    return;
  }

  // 2. Test each endpoint
  const endpoints = [
    '/dashboard/stats',
    '/trabajadores',
    '/amonestaciones',
    '/inspecciones',
    '/sucursales',
    '/equipos',
    '/supervisores',
    '/matriz-ipc',
    '/reportes/semanal',
    '/notificaciones'
  ];

  for (const ep of endpoints) {
    console.log('\n=== GET ' + ep + ' ===');
    try {
      const res = await fetch(API_URL + ep, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('Status:', res.status);
      if (!res.ok) {
        const errText = await res.text();
        console.log('ERROR:', errText.substring(0, 300));
        results.push({ endpoint: ep, status: res.status, error: errText.substring(0, 300) });
      } else {
        const data = await res.json();
        const info = Array.isArray(data) ? 'Array(' + data.length + ')' : JSON.stringify(data).substring(0, 200);
        console.log('OK:', info);
        results.push({ endpoint: ep, status: res.status, data: info });
      }
    } catch (e) {
      console.log('NETWORK ERROR:', e.message);
      results.push({ endpoint: ep, status: 'NETWORK_ERROR', error: e.message });
    }
  }

  // Summary
  console.log('\n\n=== SUMMARY ===');
  const failures = results.filter(r => r.error);
  const successes = results.filter(r => !r.error);
  console.log('OK:', successes.length, '| FAILED:', failures.length);
  if (failures.length > 0) {
    console.log('\nFailed endpoints:');
    failures.forEach(f => console.log('  -', f.endpoint, ':', f.status, '-', f.error.substring(0, 100)));
  }
}

testApi();
