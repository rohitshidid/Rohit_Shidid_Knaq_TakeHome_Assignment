# Knaq — IoT Alert Triage & Resolution System

Full-stack take-home: a backend that ingests raw IoT device messages, validates
and stores them, and a frontend to triage the resulting alerts (acknowledge →
assign → resolve, with an audit timeline).

## Repository layout

```
api/    backend service   — Node + TypeScript + Fastify + Prisma + Postgres
web/    frontend           — Next.js 14 (App Router) + TS + MUI + Redux Toolkit / RTK Query
shared/ types shared by api + web (the Alert/Device/User contract)
data/   provided device registry + ~800 raw sensor messages
```

## Status

Work in progress — built in small, committed segments. Full setup and run
instructions land in Phase 6 (`README` + `SOLUTION.md`).

## Quick start

_TBD — documented once the services exist._
