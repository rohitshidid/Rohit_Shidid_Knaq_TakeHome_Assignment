# Knaq — IoT Alert Triage & Resolution System

A full-stack take-home: a backend that ingests ~800 raw IoT device messages
(readings / alerts / recoveries), validates and stores them, and a frontend to
triage the resulting alerts — acknowledge → assign → resolve, with an audit
timeline. Multi-tenant and timezone-aware. The frontend uses **no mock data**;
it reads and writes the real API.

## Stack

| Layer | Tech |
|---|---|
| Backend (`api/`) | Node + TypeScript, Fastify, Prisma 7, PostgreSQL, Zod, Luxon |
| Frontend (`web/`) | Next.js 16 (App Router), TypeScript (strict), MUI, Redux Toolkit + RTK Query, Formik + Yup, ECharts |
| Infra | Docker Compose (api + web + db) |

Ports: **web** `:3000`, **api** `:8000`, **db** `:5432`.

---

## Quick start — Docker (one command)

Requires Docker Desktop running.

```bash
cp .env.example .env          # optional for Docker (defaults are baked in)
docker compose up --build     # builds + starts db, api, web
```

Then open **http://localhost:3000**.

- The API container boots by running **migrate → seed → ingest → serve** (all
  idempotent), reading the messages from the mounted `./data`.
- Stop: `docker compose down`. Wipe data (fresh DB volume): `docker compose down -v`.

---

## Local development (without app containers)

Run Postgres in Docker, the two services on your host.

```bash
cp .env.example .env                 # REQUIRED locally (sets DATABASE_URL)
docker compose up -d --wait db       # Postgres only
```

**API** (terminal 1):
```bash
cd api
npm install
npm run db:migrate     # apply migrations
npm run seed           # 10 devices + 6 users
npm run ingest         # load + validate the messages
npm run dev            # http://localhost:8000
```

**Web** (terminal 2):
```bash
cd web
npm install
npm run dev            # http://localhost:3000
```

---

## Environment variables

All live in the repo-root `.env` (copy from `.env.example`):

| Var | Used by | Default |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | db container | `knaq` / `knaq_dev_pw` / `knaq` |
| `DATABASE_URL` | api (Prisma) | `postgresql://knaq:knaq_dev_pw@localhost:5432/knaq?schema=public` |
| `API_PORT` | api | `8000` |
| `NEXT_PUBLIC_API_URL` | web (browser → api) | `http://localhost:8000` |
| `NEXT_PUBLIC_API_TOKEN` | web (default logged-in user) | `tok_alice_brookfield` |

The web app has sensible code defaults, so it runs with no `.env`. The API needs
`DATABASE_URL` (provided by `.env` locally, or by Compose in Docker — where the
DB host is the service name `db`, not `localhost`).

---

## Seeded users & tokens (for testing)

Auth is a bearer token that resolves to a seeded user. The frontend ships with a
**user switcher** in the top bar — pick a user to change the "logged-in" identity
at runtime (the whole UI re-scopes to that user's company). Or set
`NEXT_PUBLIC_API_TOKEN` / send the token directly to the API.

| Name | Role | Company | Token |
|---|---|---|---|
| Alice Chen | Building Manager | Brookfield Properties | `tok_alice_brookfield` *(default)* |
| Bob Martinez | Field Technician | Brookfield Properties | `tok_bob_brookfield` |
| Carol Nguyen | Building Manager | Hines | `tok_carol_hines` |
| Dan Okafor | Field Technician | Hines | `tok_dan_hines` |
| Emi Tanaka | Building Manager | Mitsui Fudosan | `tok_emi_mitsui` |
| Frank Mueller | Field Technician | Mitsui Fudosan | `tok_frank_mitsui` |
| Unauthorized | — | — | *(invalid token — demos the 401 UX)* |

```bash
# Example: list Hines alerts as Carol
curl -s -H "Authorization: Bearer tok_carol_hines" http://localhost:8000/alerts | jq length
```

---

## API reference (brief)

All list endpoints are scoped to the caller's company. Errors use a consistent
envelope: `{ "error": { "code", "message" } }`.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/alerts` | Filters: `severity`, `status[]`, `device_id`, `assigned_to`, `q`, `from`, `to` |
| `GET` | `/alerts/:id` | Full alert + ordered `timeline[]` |
| `POST` | `/alerts/:id/acknowledge` | `new → acknowledged` |
| `POST` | `/alerts/:id/assign` | `{ assignee_id, note? }` (status unchanged) |
| `POST` | `/alerts/:id/resolve` | `{ resolution_type, root_cause, action_taken, preventive_measures?, time_spent_minutes? }` |
| `POST` | `/alerts/:id/notes` | `{ note }` |
| `POST` | `/alerts/:id/dismiss` | `{ note? }` — `new\|acknowledged → dismissed` |
| `POST` | `/alerts/:id/reopen` | `{ note? }` — `resolved\|dismissed → acknowledged` |
| `POST` | `/alerts/bulk/acknowledge` | `{ ids[] }` — partial success: `{ succeeded, failed }` |
| `POST` | `/alerts/bulk/assign` | `{ ids[], assignee_id, note? }` — partial success |
| `GET` | `/alerts/stats` | Resolution analytics (status counts, MTTR, dismissal rate) |
| `GET` | `/alerts/timeseries` | `?days=N` — volume by day + severity (`days=0` = all-time) |
| `GET` | `/devices` · `/devices/:id` | Company-scoped |
| `GET` | `/devices/:id/readings` | **`start`/`end` required**, in device-local time; response times in device-local time |
| `GET` | `/users` | Team members in the caller's company |
| `GET` | `/health` | Liveness |
| `POST` | `/dev/reset` | Testing only (disabled when `NODE_ENV=production`) — wipes triage + re-ingests |

Invalid status transitions return **409**; bad/missing token **401**; another
company's resource **404**.

---

## Testing

```bash
# API integration tests (need the DB up): auth, company scoping, 409 transitions
docker compose up -d --wait db
cd api && npm test

# Frontend component tests
cd web && npm test
```

Type-check / build: `cd api && npm run typecheck`, `cd web && npm run build`.

---

## Testing affordances

- **Hard reset (testing)** button on the queue → resets the DB to default values
  (calls `POST /dev/reset`). Disabled in production.
- **Unauthorized** entry in the user switcher → sends an invalid token to demo the
  401 error UX.
- **Dark / light** toggle in the top bar (persisted).

---

## Project structure

```
api/
  prisma/        schema + migrations + seed
  src/
    ingest/      parse → validate → dedup → flag breaches → store + dead-letter
    routes/      health, users, devices, alerts, analytics, dev
    services/    triage transitions (acknowledge / assign / resolve / notes / dismiss / reopen)
    auth.ts errors.ts db.ts config.ts
web/
  src/
    app/         App Router pages (/alerts, /alerts/[id], /analytics)
    features/    alerts, devices, users, auth, analytics, dev (types, components, hooks, slices)
    lib/         store, api (RTK Query), theme, config
data/            devices.json + sensor_messages.json (provided)
docker-compose.yml
```

See **[SOLUTION.md](./SOLUTION.md)** for design decisions, schema reasoning, and
trade-offs.
