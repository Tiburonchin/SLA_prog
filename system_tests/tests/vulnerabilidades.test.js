const request = require('supertest');

// La URL de tu API backend corriendo localmente
const API_URL = 'http://localhost:3001/api';

describe('Pruebas de Seguridad y Vulnerabilidades del Sistema HSE', () => {

  describe('1. Autenticación y Autorización (Broken Authentication)', () => {
    
    it('Debe rechazar un inicio de sesión con credenciales inválidas (Prevención de Brute Force / Enumeración)', async () => {
      const resp = await request(API_URL)
        .post('/auth/login')
        .send({
          correo: 'coordinador@hse.com',
          contrasena: 'clave_incorrecta_123'
        });
      
      expect(resp.status).toBe(401);
      expect(resp.body.message).toMatch(/Credenciales incorrectas/i);
    });

    it('Debe normalizar el correo electrónico evitando bypass por espacios o mayúsculas', async () => {
      const resp = await request(API_URL)
        .post('/auth/login')
        .send({
          correo: '   CooRdiNador@hse.com  ',
          contrasena: 'AdminHSE2026!'
        });
      
      expect(resp.status).toBe(201); // NestJS POST devuelve 201 por defecto
      expect(resp.body).toHaveProperty('token');
    });

    it('No debe revelar información detallada sobre si el usuario existe o no al errar la clave', async () => {
      const resp1 = await request(API_URL)
        .post('/auth/login')
        .send({ correo: 'no_existe@hse.com', contrasena: 'admin123' });
      
      const resp2 = await request(API_URL)
        .post('/auth/login')
        .send({ correo: 'coordinador@hse.com', contrasena: 'clave_falsa' });

      // Ambas respuestas deben ser idénticas para no enumerar usuarios
      expect(resp1.status).toBe(401);
      expect(resp2.status).toBe(401);
      expect(resp1.body.message).toEqual(resp2.body.message);
    });
    
    it('Debe bloquear el acceso a rutas protegidas sin Token JWT', async () => {
      const resp = await request(API_URL).get('/usuarios/perfil');
      expect(resp.status).toBe(401);
    });
  });

  describe('2. Inyección SQL y Validación de Datos (Injection Prevention)', () => {
    
    it('Debe rechazar intentos de inyección SQL en el campo de correo', async () => {
      const resp = await request(API_URL)
        .post('/auth/login')
        .send({
          correo: "admin@hse.com' OR '1'='1",
          contrasena: "12345"
        });
      
      // Class-validator debería detener esto por no ser un email válido (400 Bad Request)
      expect(resp.status).toBe(400); 
    });

    it('Debe validar correctamente el formato UUID en parámetros de URL', async () => {
      // Intentamos pasar código malicioso en vez de un UUID válido
      const tokenRes = await request(API_URL).post('/auth/login').send({ correo: 'coordinador@hse.com', contrasena: 'AdminHSE2026!' });
      const token = tokenRes.body.token;

      const resp = await request(API_URL)
        .get('/trabajadores/un-id-malicioso-1234')
        .set('Authorization', `Bearer ${token}`);
      
      // ParseUUIDPipe debería capturarlo
      expect(resp.status).toBe(400);
      expect(resp.body.message).toMatch(/uuid es esperado/i);
    });
  });

  describe('3. Rate Limiting y DoS (Denegación de Servicio)', () => {
    // Nota: El ThrottlerModule suele configurarse a unos 10-100 requests por minuto.
    it('Debe responder con información estructurada a ráfagas normales', async () => {
      const tokenRes = await request(API_URL).post('/auth/login').send({ correo: 'coordinador@hse.com', contrasena: 'AdminHSE2026!' });
      const token = tokenRes.body.token;

      let successCount = 0;
      for(let i=0; i<5; i++) {
        const res = await request(API_URL).get('/sucursales').set('Authorization', `Bearer ${token}`);
        if(res.status === 200) successCount++;
      }
      expect(successCount).toBe(5);
    });
  });
});
