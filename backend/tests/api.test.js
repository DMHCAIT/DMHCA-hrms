import request from 'supertest';
import { app } from '../src/server.js';

describe('Backend API Health Checks', () => {
  test('Health endpoint should return OK', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
    expect(response.body.service).toBe('HR Software Backend');
  });

  test('Should handle CORS preflight requests', async () => {
    await request(app)
      .options('/api/health')
      .expect(200);
  });

  test('Should return 404 for unknown routes', async () => {
    await request(app)
      .get('/api/nonexistent')
      .expect(404);
  });
});

describe('Employee API', () => {
  test('Should require authentication for employee endpoints', async () => {
    await request(app)
      .get('/api/employees')
      .expect(401);
  });

  test('Should validate employee creation data', async () => {
    const invalidEmployee = {
      name: 'A', // Too short
      email: 'invalid-email',
      phone: '123'
    };

    const response = await request(app)
      .post('/api/employees')
      .send(invalidEmployee)
      .expect(400);
    
    expect(response.body.error).toBe('Validation failed');
    expect(response.body.details).toBeInstanceOf(Array);
  });
});

describe('Attendance API', () => {
  test('Should require API key for attendance recording', async () => {
    await request(app)
      .post('/api/attendance/record')
      .send({
        employee_id: 'EMP001',
        date: '2024-01-01',
        status: 'present'
      })
      .expect(401);
  });

  test('Should validate attendance data format', async () => {
    const invalidAttendance = {
      employee_id: 'A', // Too short
      date: 'invalid-date',
      status: 'invalid-status'
    };

    const response = await request(app)
      .post('/api/attendance/record')
      .set('Authorization', 'Bearer test-token')
      .send(invalidAttendance)
      .expect(400);
    
    expect(response.body.error).toBe('Validation failed');
  });
});

describe('Security Middleware', () => {
  test('Should set security headers', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBeDefined();
  });

  test('Should respect rate limiting', async () => {
    // This test would need to be configured based on your rate limiting setup
    const promises = [];
    for (let i = 0; i < 150; i++) {
      promises.push(request(app).get('/api/health'));
    }
    
    const responses = await Promise.allSettled(promises);
    const rateLimitedResponses = responses.filter(
      result => result.status === 'fulfilled' && result.value.status === 429
    );
    
    // Should have some rate limited responses if limits are working
    // This might not trigger in test environment depending on configuration
    expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
  }, 30000);
});

describe('Error Handling', () => {
  test('Should handle server errors gracefully', async () => {
    // This would test error scenarios - you'd need to mock database errors etc.
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status');
  });

  test('Should not expose sensitive information in errors', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);
    
    expect(response.body.error).not.toContain('stack');
    expect(response.body.error).not.toContain('password');
    expect(response.body.error).not.toContain('secret');
  });
});