jest.mock('../models/User');

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Auth endpoints', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('POST /api/v1/auth/register creates a user', async () => {
    const payload = { name: 'Alice', email: 'alice@example.com', password: 'P@ssw0rd!' };

    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce({
      _id: 'u1',
      name: payload.name,
      email: payload.email,
      role: 'guest',
      phone: null
    });

    const res = await request(app).post('/api/v1/auth/register').send(payload).expect(201);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('email', payload.email);
  });

  test('POST /api/v1/auth/login returns token on valid credentials', async () => {
    const payload = { email: 'bob@example.com', password: 'secret' };

    const mockUser = {
      _id: 'u2',
      name: 'Bob',
      email: payload.email,
      role: 'guest',
      phone: null,
      matchPassword: jest.fn().mockResolvedValue(true)
    };

    User.findOne.mockResolvedValueOnce({ ...mockUser, select: () => mockUser });
    // When controller calls .select('+password'), our mock should return the mockUser
    User.findOne.mockResolvedValueOnce(mockUser);

    // Ensure findOne used in login returns mockUser
    User.findOne.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/v1/auth/login').send(payload).expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('token');
  });
});
