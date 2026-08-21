CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seed_key TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published'
        CHECK (status IN ('published', 'archived')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ideas_status_created_at
    ON ideas (status, created_at DESC);