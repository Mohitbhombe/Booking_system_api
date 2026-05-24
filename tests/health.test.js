const request = require('supertest');
const app = require('../server');

describe('Health Check', () => {
  test('GET /api/v1/health should return 200 and healthy message', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body).toHaveProperty('message');
  });
});
