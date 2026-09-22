# Playwright E2E Testing

DevPulse's Playwright suite runs Chromium against the real Vite frontend and Express backend. It covers public loading and login behavior, protected-route redirects, the seeded dashboard, build logs, and the stored AI diagnostic report. The AI service is intentionally not called by the ordinary E2E suite, so tests do not require a Gemini key or incur external costs.

## Files

- `frontend/playwright.config.ts` starts Vite on port 3000 and the backend on port 5000.
- `frontend/e2e/devpulse.spec.ts` contains the E2E tests.
- `.github/workflows/playwright.yml` runs Chromium E2E tests with disposable PostgreSQL and Redis services.
- `frontend/package.json` contains the Playwright scripts.

## Local setup

Docker Desktop must be running for the database. Start the infrastructure from the repository root:

```powershell
docker compose up -d postgres redis
cd backend
npm ci
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
cd ..\frontend
npm ci
npx playwright install chromium
```

The backend reads `backend/.env`, which supplies `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, and the port settings. Do not point this setup at a production database. The seed command is intended for a disposable local database; it creates the documented demo user `demo@devpulse.io` with password `password123` and sample projects/builds.

The Compose file uses the PostgreSQL password `postgrespassword`. The checked-in `backend/.env` may contain a different local password, so set the E2E database URL in the current PowerShell session before preparing the database and running tests:

```powershell
$env:DATABASE_URL = 'postgresql://postgres:postgrespassword@localhost:5432/devpulse?schema=public'
```

This environment variable is inherited by the Playwright-started backend and takes precedence over values loaded from `.env`.

Run the suite from `frontend`:

```powershell
npm run test:e2e
npm run test:e2e:headed
npx playwright test e2e/devpulse.spec.ts -g "failed build"
npm run test:e2e:report
```

Playwright starts Vite and the backend automatically. If either server is already running, it reuses it outside CI. The backend still needs PostgreSQL to support authentication and dashboard data. Redis is used when available; the existing internal event-bus fallback is sufficient for these tests.

## GitHub Actions

The workflow runs on pushes and pull requests targeting `main`, and via `workflow_dispatch`. It installs both npm projects from their lockfiles, starts disposable PostgreSQL and Redis service containers, generates the Prisma client, pushes the schema, seeds test data, installs Chromium with system dependencies, and uploads the HTML report even when tests fail. No repository secrets are required by the current suite.

## Known limitations

The suite does not call the external Gemini-backed AI service and does not claim to validate Socket.IO event delivery. Those paths require a separately controlled AI service and a deterministic real-time test fixture. The seed data is designed for an isolated E2E database and must not be run against production.
