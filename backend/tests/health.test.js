const request = require('supertest');
const app = require('../src/app');

describe('Health Check & Server Status API', () => {
  it('GET / should return PhishGuard welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('PhishGuard');
    expect(res.body.healthCheck).toBe('/api/health');
  });

  it('GET /api/health should return system status, memory and database details', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database.provider).toBe('MongoDB Atlas');
    expect(res.body.system).toHaveProperty('nodeVersion');
  });

  it('GET /api/unknown-endpoint should return 404 in consistent JSON format', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Resource not found');
  });
});
