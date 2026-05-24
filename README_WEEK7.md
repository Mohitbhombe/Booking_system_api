Week 7 — API Documentation, Testing, Versioning, and Performance
===============================================================

What I implemented in Week 7:

- **Swagger/OpenAPI**: Added OpenAPI spec generation via `swagger-jsdoc` (optional) and served docs at `/api-docs` (mounted at repo root).
- **API Versioning**: All API routes are now versioned under `/api/v1/*` (for example `/api/v1/hotels`).
- **Tests**: Added Jest + Supertest and a basic health-check test at `tests/health.test.js`.
- **Postman Collection**: `postman/BookingSystem.postman_collection.json` with a sample Health Check request.
- **Performance**: Added basic rate limiting (`express-rate-limit`) and simple GET caching (`apicache`) in `server.js`.

Files changed/added:

- `server.js` — versioned routes, swagger UI, rate limiter, caching, export `app` for tests.
- `config/swagger.js` — swagger-jsdoc configuration (optional - falls back to minimal spec if not installed).
- `tests/health.test.js` — basic Jest/Supertest test.
- `postman/BookingSystem.postman_collection.json` — Postman collection.

How to run locally

1. Install dependencies:

```bash
npm install
```

2. Run in development mode:

```bash
npm run dev
```

3. View Swagger UI:

Open `http://localhost:5000/api-docs` after server is running.

4. Run tests:

```bash
npm test
```

Notes and troubleshooting

- The repository may not have `swagger-jsdoc` installed by default in some environments — `config/swagger.js` falls back to a minimal spec so tests can run without Swagger dependencies.
- Tests run with `NODE_ENV=test` so the DB connection is skipped during unit tests. For integration tests against a real DB, set `MONGODB_URI` and remove the skip.
- If `npm install` fails with EBUSY on Windows, try closing editors or terminals holding files and re-run `npm install`.

Next steps

- Expand Jest/Supertest coverage to include Hotel CRUD, Booking logic, and Authentication.
- Add CI to run tests on push and publish generated Swagger JSON.
