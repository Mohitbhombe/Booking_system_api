# Week 8 — Production Preparation, Security, Logging, CI

What I implemented for Week 8:

- Added security middleware: `helmet` for headers and `compression` for gzip responses.
- Added request logging via `morgan` and application logging via `winston` (config at `config/logger.js`).
- Kept Swagger/API docs available at `/api-docs` (only in non-test env).
- Added GitHub Actions CI workflow at `.github/workflows/ci.yml` to install dependencies and run tests on push.
- Updated `server.js` to load production middleware conditionally (tests skip long-running middleware).

## Run locally

Install new deps and run tests:

```bash
npm install
npm test
```

Start server locally:

```bash
npm run dev
# or
npm start
```

## Deployment notes

Implement production CORS by setting `CORS_ORIGINS` to a comma-separated list of allowed domains, for example:

```bash
CORS_ORIGINS=https://myapp.example.com,http://localhost:3000
```

- Set `NODE_ENV=production` and provide environment variables: `PORT`, `MONGODB_URI`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, email config, and `JWT_SECRET`.
- On platforms like Railway/Render, set environment vars in the project settings.
- Ensure the `CLIENT_URL` env var is set for password reset links.
- For automated GitHub deployment to Render, configure repository secrets:
  - `RENDER_API_KEY`
  - `RENDER_SERVICE_ID`
- The workflow `.github/workflows/deploy.yml` runs tests and triggers a Render deploy on push to `week-1`.
- A `render.yaml` file has been added to support Render service configuration.

## Next steps

- Add monitoring/alerting and log rotation for `winston` transports.
- Harden CORS settings to production domain only.
- Add automated deployment on merge to `main` using workflows.
