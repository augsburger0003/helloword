# HelloWord

HelloWord is a lightweight, persistent workspace dashboard. It is intentionally
small: the dashboard at `/` is backed by an Express API and a SQLite database,
so additions and status changes made in the interface survive a restart.

## Start

1. Install Node.js 18 or newer.
2. Install dependencies: `npm install`
3. Optionally copy `.env.example` to `.env` and adjust the values.
4. Run `npm start`
5. Open [http://localhost:3000](http://localhost:3000).

On its first run the app creates `data/helloword.sqlite`, applies all SQL files
in `migrations/`, and adds a small sample workspace. Set
`SEED_DEMO_DATA=false` before the first start if an empty workspace is desired.
The migration ledger makes both migrations and the seed idempotent.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Dashboard summary, categories and recent activity |
| `GET` | `/api/tasks?status=&category=` | List tasks |
| `POST` | `/api/tasks` | Create a task (`title` is required) |
| `PATCH` | `/api/tasks/:id` | Update title, status, priority, category, due date, or owner |
| `DELETE` | `/api/tasks/:id` | Remove a task |

Dates and audit values are generated centrally by the persistence repository.

## Persistence

Schema changes live in `migrations/` and are applied in lexical order at server
startup. The application creates the database directory if needed. Do not edit
the generated SQLite file directly; add a new migration instead.