# game-master

- Role: authoritative game backend (room, state, events)
- Stack (proposed): Node.js, Express, Socket.io, Postgres (Prisma), Redis adapter
- Deploy: Docker + Cloud Run (WebSocket)

## Setup (local)

1. Copy env and install deps
   - Copy `.env.example` to `.env`
   - `npm install`
2. Prisma
   - `npx prisma generate`
   - `npx prisma migrate dev --name init`
3. Run
   - `npm run dev` (default port `3001`)

## DATABASE_URL formats

- Direct Postgres (user/pass):
  `postgresql://uname:password@HOST:5432/DBNAME?schema=public`
- Cloud SQL Connector (preferred on Cloud Run):
  `postgresql://uname:password@localhost:5432/DBNAME?schema=public`
  and attach the Cloud SQL connector to the service using your connection name `project:area:name`.

> For demos, ensure connection pooling (PgBouncer / Prisma Accelerate) or keep Cloud Run instances low with higher concurrency.


