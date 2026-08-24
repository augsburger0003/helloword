# Helloword

Helloword is a small project workspace that turns a clean repository into a
usable dashboard. It has a zero-dependency Node.js server, a JSON persistence
layer with repeatable migrations, a project/task API, and a responsive browser
interface at `/`.

## Requirements

- Node.js 18 or newer
- No database server or package installation is required

## Run locally

```bash
npm start
```

Open [http://127.0.0.1:3000/](http://127.0.0.1:3000/). The server creates
`data/database.json` and runs pending migrations on its first start. The data
directory is intentionally ignored by git.

For development, use `npm run dev` to restart the server when source files
change. `PORT`, `HOST`, and `DATA_DIR` may be supplied as environment
variables.

## Demonstration data and admin access

Demo bootstrap is explicitly opt-in:

```bash
DASHBOARDIA_DEMO_MODE=true \
DASHBOARDIA_DEMO_USERNAME=admin \
DASHBOARDIA_DEMO_EMAIL=admin@example.com \
DASHBOARDIA_DEMO_PASSWORD='use-a-local-password' \
npm start
```

When enabled, startup is idempotent: it creates an admin account and a minimum
workspace of projects, tasks, and activity records only when they do not exist.
The supplied access is written to `.dashboardia/demo-access.json` with
`"version": 1`; this directory is ignored and should never be committed.

The login endpoint is available at `POST /api/auth/login` with a JSON body
containing `login` and `password`. The dashboard itself is intentionally
readable in a local preview so the root route can be reviewed immediately.

## API

- `GET /api/health` — process and schema health
- `GET /api/dashboard` — summary, projects with tasks, and recent activity
- `POST /api/projects` — create a project (`title`, optional `description`)
- `PATCH /api/tasks/:id` — move a task using `todo`, `in_progress`, or `done`
- `POST /api/auth/login` — issue an in-memory bearer token for an admin account

## Persistence and safety

`src/persistence/migrations/001-initial.js` defines the initial schema. The
database writes through a temporary file and rename, and all inserts/updates
pass through centralized audit callbacks in `src/persistence/database.js` so
`createdAt` and `updatedAt` are always present. Seeds use the same insert path,
including uniqueness checks for admin username and email.