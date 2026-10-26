const request = require('supertest');
const app = require('../src/app');

describe('Phase 3 Verification: MongoDB Scan Schemas & REST Endpoints', () => {
  let createdScanId;

  it('POST /api/scans should analyze URL and return 201 with scan assessment', async () => {
    const res = await request(app)
      .post('/api/scans')
      .send({ url: 'http://192.168.1.1/paypal/verify-account.php' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.riskCategory).toBe('high');
    expect(res.body.data.riskScore).toBeGreaterThanOrEqual(70);
    expect(res.body.data.indicators.length).toBeGreaterThan(0);
    expect(res.body.data.hostname).toBe('192.168.1.1');
    expect(res.body.data).toHaveProperty('scannedAt');

    createdScanId = res.body.data._id;
  });

  it('POST /api/scans should reject invalid or empty URL with 400', async () => {
    const res = await request(app)
      .post('/api/scans')
      .send({ url: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/scans should list scans with pagination metadata', async () => {
    const res = await request(app)
      .get('/api/scans?limit=5&page=1');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page', 1);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/scans/:id should return detailed report for a valid scan ID', async () => {
    const res = await request(app)
      .get(`/api/scans/${createdScanId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id.toString()).toBe(createdScanId.toString());
  });

  it('GET /api/scans/:id should return 400 for malformed MongoDB ObjectId', async () => {
    const res = await request(app)
      .get('/api/scans/invalid-non-hex-id');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid scan ID format');
  });

  it('GET /api/scans/export/csv should return CSV file content with proper headers', async () => {
    const res = await request(app)
      .get('/api/scans/export/csv');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Scan ID,Submitted URL,Hostname,Risk Category,Risk Score,Scanned At,Indicators Triggered');
  });
});
