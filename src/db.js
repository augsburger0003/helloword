const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const projectRoot = path.resolve(__dirname, '..');
const databasePath = path.resolve(
  projectRoot,
  process.env.DATABASE_PATH || 'data/helloword.sqlite'
);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const database = new sqlite3.Database(databasePath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    database.run(sql, params, function onRun(error) {
      if (error) return reject(error);
      return resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    database.get(sql, params, (error, row) => (error ? reject(error) : resolve(row)));
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    database.all(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
  });
}

function now() {
  return new Date().toISOString();
}

async function applyMigrations() {
  await run('PRAGMA foreign_keys = ON');
  await run(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`
  );

  const migrationDirectory = path.join(projectRoot, 'migrations');
  const migrations = fs.readdirSync(migrationDirectory)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const name of migrations) {
    const alreadyApplied = await get(
      'SELECT name FROM schema_migrations WHERE name = ?',
      [name]
    );
    if (!alreadyApplied) {
      const sql = fs.readFileSync(path.join(migrationDirectory, name), 'utf8');
      await run('BEGIN');
      try {
        await new Promise((resolve, reject) => database.exec(sql, (error) => (
          error ? reject(error) : resolve()
        )));
        await run('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)', [name, now()]);
        await run('COMMIT');
      } catch (error) {
        await run('ROLLBACK');
        throw error;
      }
    }
  }
}

async function seedDemoData() {
  if (String(process.env.SEED_DEMO_DATA).toLowerCase() === 'false') return;
  const existing = await get('SELECT id FROM categories LIMIT 1');
  if (existing) return;

  const createdAt = now();
  const categories = [
    ['focus', 'Focus', '#7c5cff'],
    ['growth', 'Growth', '#ef8568'],
    ['ops', 'Operations', '#37b8a5']
  ];
  await run('BEGIN');
  try {
    for (const category of categories) {
      await run(
        'INSERT INTO categories (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [...category, createdAt, createdAt]
      );
    }
    const tasks = [
      ['Shape the project narrative', 'Draft the short story that guides the next release.', 'focus', 'high', 'in_progress', '2025-04-28', 'Maya'],
      ['Review onboarding signals', 'Turn this week’s customer feedback into three clear actions.', 'growth', 'medium', 'todo', '2025-04-30', 'Leo'],
      ['Publish workspace guide', 'A concise reference for the new working agreement.', 'ops', 'low', 'done', '2025-04-22', 'Ari'],
      ['Plan the Friday showcase', 'Choose two outcomes worth sharing with the team.', 'focus', 'medium', 'todo', '2025-05-02', 'Maya']
    ];
    for (const task of tasks) {
      const result = await run(
        `INSERT INTO tasks
        (title, description, category_id, priority, status, due_date, owner, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...task, createdAt, createdAt]
      );
      await run(
        'INSERT INTO activity (task_id, message, created_at) VALUES (?, ?, ?)',
        [result.lastID, `Added “${task[0]}”`, createdAt]
      );
    }
    await run('COMMIT');
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

async function initializeDatabase() {
  await applyMigrations();
  await seedDemoData();
}

module.exports = { database, run, get, all, now, initializeDatabase };