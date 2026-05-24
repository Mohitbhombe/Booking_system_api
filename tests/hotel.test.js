jest.mock('../models/Hotel');

const request = require('supertest');
const app = require('../server');
const Hotel = require('../models/Hotel');

describe('Hotel endpoints', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('GET /api/v1/hotels returns list with pagination', async () => {
    const mockHotels = [
      { _id: '1', name: 'Test Hotel A', city: 'CityA' },
      { _id: '2', name: 'Test Hotel B', city: 'CityB' }
    ];

    const makeQuery = (result = []) => {
      const q = {
        getFilter: () => ({}),
        find: () => q,
        select: () => q,
        sort: () => q,
        skip: () => q,
        limit: () => q,
        then: (resolve) => resolve(result),
        catch: () => q
      };
      return q;
    };

    Hotel.find.mockReturnValueOnce(makeQuery(mockHotels));

    Hotel.countDocuments.mockResolvedValueOnce(2);

    const res = await request(app).get('/api/v1/hotels').expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBe(2);
  });

  test('GET /api/v1/hotels/:id returns single hotel', async () => {
    const hotelId = 'abc123';
    const mockHotel = { _id: hotelId, name: 'Single Hotel' };

    Hotel.findById.mockResolvedValueOnce(mockHotel);

    const res = await request(app).get(`/api/v1/hotels/${hotelId}`).expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toMatchObject({ _id: hotelId, name: 'Single Hotel' });
  });
});
