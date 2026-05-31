# SOLUTION

Design decisions, trade-offs, and AI-tool disclosure. Filled in as the build
progresses so the reasoning is captured while it's fresh.


## Storage choice & schema

I used PostgreSQL with Prisma. The data really has two different shapes, and one
relational database handles both, so I didn't need to bolt on a second store.

The first shape is raw signal: readings, alerts, recoveries. It's high-volume and
append-only. The second is the human workflow that sits on top of an alert:
status, who owns it, the resolution writeup, the audit log. That second half is
relational and needs transactions — an illegal status change has to be checked
and rejected in one atomic step — which is the kind of thing Postgres does well.

The tables:

- `devices`, `users`: seeded reference data.
- `sensor_readings`: one row per metric, not one row per message. A single reading
  message can carry current, frequency and temperature at once, and I split those
  into separate rows so per-metric time-series and the daily-stats kind of query
  stay trivial. Each row carries an `is_breach` flag and which bound it crossed.
- `alerts`: an ingested device alert plus its triage state, stored inline on the
  same row. Every alert has exactly one triage state, so a separate table would
  only add a join. `company` is denormalized onto the row so the scoped list
  queries don't have to join through `devices` on every request.
- `alert_timeline`: the audit log, one row per event, ordered by timestamp. It's
  append-only and one-to-many, so it lives on its own.
- `rejected_messages`: a dead-letter table for malformed input (see below).

I picked Postgres over SQLite partly because the Docker setup wanted a real,
separate DB service anyway, and over MongoDB because the triage side is relational
and I'd rather not hand-roll transactions on a document store. SQL names are
snake_case; the TypeScript stays camelCase through Prisma's `@map`/`@@map`.


## Duplicates, malformed messages, threshold-breach flagging

**Duplicates.** There's no message ID, so I treat a duplicate as identical content.
Each stored row gets a SHA-1 hash of its meaningful fields — for readings that's
`device + metric + timestamp + value`, for alerts it's
`device + alert_type + timestamp + severity` — and that hash is a unique column.
The data had four duplicate reading messages, which expand to 11 duplicate metric
rows; the hash drops them. A nice side effect is that re-running ingest is safe:
readings get rebuilt, alerts upsert on the hash, so nothing doubles up.

**Malformed messages.** Every message goes through a Zod validator. Anything that
fails lands in `rejected_messages` with a reason instead of crashing the run. The
ingest finished with 8 rejects, and three of them I didn't even spot on a first
read of the data: a reading whose `input_value` was the string `"85.5"`, a reading
with an empty `inputs` array, and a temperature reading sent to an elevator that
doesn't measure temperature (the spec asks for readings to match the device's
declared `reading_types`, so that one is a real reject). The other five are the
obvious ones — a null `device_id`, an `UNKNOWN-999` device, a null `message_type`,
a null timestamp, and an alert missing `severity`. One case is recoverable rather
than rejected: a timestamp that arrived as an ISO string instead of epoch ms gets
parsed and kept.

**Breach flagging.** Readings are checked against the device's `<metric>_high` and
`<metric>_low` thresholds and flagged on the row. I deliberately did not turn a
breaching reading into an alert, because the device already emits its own alert
messages and I didn't want to double-count the same event. So the breach flag is a
separate signal that lives on the reading. The run flags 9 breaches, including a
negative-current anomaly on ELV-001 and a few over-current readings on ELV-003.


## Status-transition enforcement (where it lives and why)

The rules live in one service, `api/src/services/triage.ts`, and every mutation
runs inside a Prisma transaction. The pattern is the same each time: load the
alert scoped to the caller's company, check the requested move is legal for the
current status, then update the row and append the timeline entry together. If the
move isn't allowed, it throws a 409 and nothing is written.

The map: `new → acknowledged`, `acknowledged → resolved`, `new|acknowledged →
dismissed`, and `resolved|dismissed → reopened` (reopen lands back at
`acknowledged` and clears the now-stale resolution). `assign` is allowed in any
non-terminal status and doesn't change the status — it's an independent side
channel, so you can assign a `new` alert before anyone acknowledges it, and you can
resolve an acknowledged one that was never assigned.

I put it in a service rather than the route handlers for two reasons. One, the rule
is then in a single place instead of scattered across the mutation endpoints. Two,
the integration test calls the same code through `app.inject()`, so the test
exercises the real transition logic. The frontend renders the right buttons for the
current status, but that's only a convenience — the server is the one that says no.


## Frontend state — Redux Toolkit / RTK Query structure

I split state by who owns it. Anything that comes from the server lives in RTK
Query: one `api` slice holds the alert list, the alert detail, devices, users, the
analytics stats/timeseries, and the mutations (acknowledge, assign, resolve, note,
dismiss, reopen, plus the two bulk variants). The cache uses tags — the list is
tagged `{Alert, LIST}`, each detail is tagged by id — and the mutations invalidate
both, so acknowledging an alert on the detail page also updates the queue and its
summary counts without me wiring anything by hand.

Anything that's purely UI lives in plain Redux slices: the queue filters and sort,
the bulk multi-select set, and the current user/token. The filters slice drives a
`useFilteredAlerts` selector
that derives the visible list from the cached data. Keeping the filters in client
state (instead of refetching on every keystroke) makes the queue feel instant and
lets the summary bar count across the whole list, not just the filtered view.


## Source of truth (server vs client) + optimistic vs pessimistic updates

The server is the source of truth for alert status, full stop. I went pessimistic:
a mutation fires, the server responds, the cache invalidates, and the UI re-renders
from the refetched data. There's no optimistic guess.

That's a real trade-off. Optimistic updates would feel a touch snappier, and they
were on the bonus list. But the whole point of the 409 path is that some actions
are not allowed, and a pessimistic flow can't show a success that the server then
rejects. If you try to resolve an alert that isn't acknowledged, you get the error
and the UI stays honest. I'd rather the screen be a beat slower than briefly lie.
With more time I'd add optimistic updates with rollback on the cheap actions
(acknowledge), where the failure case is rare.


## Bulk actions & analytics

Bulk acknowledge and bulk assign are real endpoints (`/alerts/bulk/...`), not a
client-side fan-out. Each loops the ids and calls the same single-item transition
service, catching per-item errors so the batch reports partial success —
"acknowledged 8, skipped 2 (already acknowledged)" instead of failing as a whole.
The multi-select set is client state; the action bar invalidates the cache on
success so the queue reconciles to the server.

The analytics screen is backed by `/alerts/stats` (counts via Prisma `groupBy`,
durations via a small raw-SQL `AVG(interval)`) and `/alerts/timeseries` (a
`date_trunc('day')` group-by). Two judgment calls worth flagging. I measure MTTR as
acknowledged → resolved (the actual handling time) rather than triggered →
resolved, because the sample data is months old and trigger-to-resolve would read
as "108 days". And the volume chart uses a now-relative window with an "All"
option, so it stays honest — recent windows are genuinely empty for this historical
data — instead of silently anchoring to the data and looking stuck. Charts use
`echarts` themed from the MUI palette.


## Trade-offs made under the time cap

A few things I did to stay inside the time budget:

- The API runs TypeScript directly with `tsx` instead of compiling to JS. Fewer
  moving parts; the cost is no separate build artifact.
- Types are hand-synced between the API (Prisma-generated) and the web app, rather
  than shared through a workspace package. A real shared package fights Next's
  bundling, and keeping two small type files aligned was the cheaper path.
- The queue filters client-side over the full company list. That's great at this
  scale (at most ~25 alerts per company) and gives accurate summary counts, but it
  wouldn't hold up at thousands of alerts without server-side filters and paging.
  The API already supports the filters; the UI just doesn't use them yet.
- The integration test runs against the dev Postgres and resets it, instead of
  spinning up an isolated test database. (So, I would recommend running test at the very beginning.)
- The stretch bonuses I left out are optimistic UI, pagination, keyboard shortcuts,
  and anomaly flagging. Bulk actions, dismiss/reopen, and the analytics screen all
  made it in.


## What I'd improve with another week

- Server-side filtering plus pagination on `/alerts`, so the queue scales.
- An isolated test database (testcontainers) and more coverage across the routes.
- Optimistic updates with rollback on the cheap actions (acknowledge, assign).
- Keyboard shortcuts on the queue (j/k to move the focused row, `a` to acknowledge
  the selection).
- Real authentication instead of seeded tokens. The demo user switcher would go
  away once there's an actual login.
- Anomaly flagging on readings that sit inside the thresholds but look off against
  recent history.


## Additional libraries added (and why)

Backend:
- Fastify — the HTTP server. Small, fast, good TypeScript story.
- Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`) — typed DB access and
  migrations. Prisma 7 connects through a driver adapter (which uses `pg`, the
  node-postgres driver, under the hood), hence `adapter-pg`.
- Zod — validates the messy ingest input and the request bodies.
- Luxon — IANA timezone math for the device-local readings endpoint.
- `@fastify/cors` — the browser app is on a different origin.
- dotenv — loads the repo-root `.env`.

Frontend (the mandated stack): MUI, Redux Toolkit + react-redux, Formik + Yup.
ECharts powers the analytics charts — I used `echarts` directly with a small
wrapper rather than `echarts-for-react`, to dodge a React 19 peer-dependency
conflict. Tests: Vitest, plus React Testing Library on the web side.


## AI tool disclosure

I used Claude code to build this project, I used it for initial boiler plate, debugging, architecture suggestions and getting familiar with new libraries. I'd say it's a pretty good tool for getting started with a new project, but as you dig deeper into the project, you start realizing the flaws in the code it generates, and you have to do more manual work to fix those flaws. So, I created a workflow (manually using pen and paper) worked on the architecture, tables and stuff like that, then I took snaps of that pages and sent it to Claude, it gave me some suggestions, later I divided the tasks in segments, built them one by one, did testing after every segment so that I dont have to fix too many things at once. I also used Claude to correct my sentences and grammer and formatting in the readme.md and solution.md file. I do not have grammarly, I would've used that otherwise. 


## Miscellaneous notes
- I have created a homebrew tap which is available at: https://github.com/rohitshidid/Homebrew-portman, it basically helps you see all active ports on your machine in one screen, it helps quite a lot when you are working with docker and/or kubernetes, helped me track progress as I was developing this application especially the docker part. (You can also use `brew install portmap` to install it)

## Some more notes

 - A recovery records the timestamp but keeps the human triage, if a device breaks, alerts, and then fixes itself ten minutes later, it sends a recovery message. I record when that happened and add a note to the timeline, but I don't auto-close the ticket. The machine being fine and the work being done are two different things — someone still has to look at why it broke. So the alert stays open until a human resolves it; the recovery is just context that says the device already cleared on its own.

 - Auth is a plain bearer token that maps to a seeded user (tok_alice_brookfield, and so on), not a full JWT login system. The assignment didn't ask for a login screen, and the spec explicitly allows a simple lookup. Readable tokens are easy to curl and easy to reason about, and they let me prove the auth and multi-tenant scoping work without spending hours on a sign-in flow I was told I didn't need.

 - Hard reset (testing) - There's a red "Hard reset" button on the queue page, disabled in production. It calls POST /dev/reset (which I wrote but only expose in dev), wipes the DB, and re-runs the seed → ingest pipeline. Use it if you want to clear the board and see the same ~25 alerts come in fresh. It won't touch your Docker volume, so if you want to clear persistent state too you'll need a `docker compose down -v`.

