# Plan

## Current Reality Snapshot (March 5, 2026)
- **Repo split is in place**:
  - `frontend/` static retro UI (HTML/CSS/JS)
  - `backend/` Express + TypeScript API
  - `docs/` planning + contracts
  - `db/` SQL init scripts for local MySQL
- **OpenAPI contract exists and is served** by backend:
  - Source: `backend/openapi.yaml`
  - Served at `GET /openapi.yaml`
  - Swagger UI at `GET /docs`
- **Dockerized local development exists** via root `docker-compose.yml`:
  - `frontend` (nginx)
  - `backend` (node)
  - `mysql` (persistent named volume + init SQL)
  - `adminer` for DB inspection
- **Integrations are still mocked** for now:
  - Runway
  - Storage
  - Payments
  - Email

## MVP Checklist
- [x] Repo structure split into `frontend/` and `backend/`
- [x] Docker Compose for local stack
- [x] MySQL service + named volume + DB init SQL
- [x] User auth endpoints with JWT (`/v1/auth/register`, `/v1/auth/login`, `/v1/auth/me`)
- [x] Backend auth middleware for bearer token parsing and protected job routes
- [x] Admin bootstrap user on backend startup (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- [x] Job orchestration and events in-memory for MVP
- [x] Segmentation planning endpoint in backend
- [x] Mock integration interfaces and mock providers wired
- [ ] Runway real integration TODO
- [ ] Storage real integration TODO (S3/R2 + presigned uploads)
- [ ] Payments real integration TODO (Stripe subscription + credits ledger)
- [ ] Email real integration TODO (transactional provider)
- [ ] Observability TODO (structured logs, traces, metrics, alerts)

## Backend Architecture (MVP)
- API: Express + TypeScript
- Contract: OpenAPI-first (`backend/openapi.yaml`)
- Auth: email/password + JWT bearer auth
- User management: **MySQL** `users` table
- Jobs: in-memory store (temporary until DB-backed jobs are implemented)

## Database (MySQL)
`users` schema used by backend auth:
- `id` (PK, auto increment)
- `email` (unique)
- `password_hash`
- `role` (`admin` | `user`)
- `created_at`

Local dev defaults in compose (must be changed outside local dev):
- `MYSQL_DATABASE=cinemify`
- `MYSQL_USER=cinemify`
- `MYSQL_PASSWORD=cinemify_password`
- `MYSQL_ROOT_PASSWORD=root_password`

## Auth Notes
- Register: `POST /v1/auth/register`
- Login: `POST /v1/auth/login` returns JWT
- Current user: `GET /v1/auth/me` with `Authorization: Bearer <token>`
- Server startup ensures default admin user exists from env vars:
  - `ADMIN_EMAIL` (default `admin@cinemify.local`)
  - `ADMIN_PASSWORD` (default `admin12345`)

## Long-form Render Strategy (still planned)
1. Ingest upload and register job
2. Normalize/transcode for stable processing
3. Segment under provider limits (currently size-based planning)
4. Render fan-out through provider adapter
5. Stitch outputs + preserve original audio
6. Deliver final asset + status updates

## Open Items
- Persist jobs/segments/events in MySQL instead of in-memory
- Move mock providers to real providers incrementally (Runway, storage, payments, email)
- Add production-grade observability and operations tooling
