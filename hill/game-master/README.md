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

## Deploy (Cloud Run)

- Source: GitHub monorepo
  - Repository: board-hill
  - Subdirectory: `hill/game-master`
  - Build: Use Google Cloud’s buildpacks
- Service config
  - Container port: `3001`
  - Env vars:
    - `PORT=3001`
    - `DATABASE_URL=postgresql://<DB_USER>:<DB_PASSWORD>@127.0.0.1:5432/<DB_NAME>?schema=public`
  - Connections: Add Cloud SQL instance (`project:region:instance`)
  - Auth: Allow unauthenticated（演示）
  - Autoscaling: min 0/1, max 1–2, concurrency 60–80
- Prisma migrate via Cloud Run Job
  - Image: same as service
  - Command: `npx`
  - Args: `prisma migrate deploy`
  - Env/Connections: same as service


