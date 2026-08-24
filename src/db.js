const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const config = require("./config");

fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });

const db = new Database(config.databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const migrationDir = path.join(config.rootDir, "src", "migrations");
  const files = fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const applied = new Set(
    db.prepare("SELECT version FROM schema_migrations").all().map((row) => row.version),
  );

  const apply = db.transaction(() => {
    for (const file of files) {
      if (applied.has(file)) continue;
      db.exec(fs.readFileSync(path.join(migrationDir, file), "utf8"));
      db.prepare(
        "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
      ).run(file, new Date().toISOString());
    }
  });
  apply();
}

runMigrations();

module.exports = db;