const request = require('supertest');
const app = require('../src/app');

describe('Phase 6 Verification: Authentication, Authorization & Admin Controls', () => {
  let adminToken;
  let userToken;
  const adminEmail = `admin_${Date.now()}@test.org`;
  const userEmail = `analyst_${Date.now()}@test.org`;

  it('POST /api/auth/register should register first user as admin and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Lead Cyber Admin',
        email: adminEmail,
        password: 'SuperSecurePassword123!'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', adminEmail);
    expect(res.body.user).toHaveProperty('role', 'admin');
    expect(res.headers['set-cookie']).toBeDefined();

    adminToken = res.body.token;
  });

  it('POST /api/auth/register should register second user as regular analyst', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Junior Analyst',
        email: userEmail,
        password: 'AnalystPassword123!'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('user');

    userToken = res.body.token;
  });

  it('POST /api/auth/register should reject duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Guy',
        email: adminEmail,
        password: 'AnotherPassword123!'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login should authenticate with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'SuperSecurePassword123!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /api/auth/login should reject incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'WrongPassword999!'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me should return authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(adminEmail);
  });

  it('GET /api/admin/users should be forbidden (403) for regular users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Administrator privileges required');
  });

  it('GET /api/admin/users should allow access (200) for admin users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/admin/model-metrics should return ML evaluation metrics', async () => {
    const res = await request(app)
      .get('/api/admin/model-metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('evaluationMetrics');
  });

  it('POST /api/feedback should allow submitting false assessment reports', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        scanId: '650000000000000000000001',
        feedbackType: 'false_positive',
        description: 'Verified official corporate subdomain belonging to our company.'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reviewStatus).toBe('pending');
  });
});
