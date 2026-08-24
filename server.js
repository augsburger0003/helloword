const path = require("node:path");
const express = require("express");
const db = require("./src/db");
const config = require("./src/config");
const { seedDemoData } = require("./src/seed");
const {
  createToken,
  hashPassword,
  tokenDigest,
  verifyPassword,
} = require("./src/security");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false }));

const demo = seedDemoData();

function timestamp() {
  return new Date().toISOString();
}

function parseCookies(header = "") {
  return header.split(";").reduce((cookies, piece) => {
    const separator = piece.indexOf("=");
    if (separator < 0) return cookies;
    const key = piece.slice(0, separator).trim();
    const value = piece.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `dashboardia_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${
      config.nodeEnv === "production" ? "; Secure" : ""
    }`,
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    "dashboardia_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
  );
}

function currentUser(req) {
  const token = parseCookies(req.headers.cookie).dashboardia_session;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT users.id, users.username, users.email, users.role
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_digest = ? AND sessions.expires_at > ?`,
    )
    .get(tokenDigest(token), timestamp());
  return row || null;
}

function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "Sua sessão expirou. Entre novamente." });
  req.user = user;
  return next();
}

function cleanText(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function validEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "dashboardia", demoMode: config.demoMode });
});

app.post("/api/auth/login", (req, res) => {
  const body = req.body || {};
  const identifier = cleanText(body.identifier);
  const password = typeof body.password === "string" ? body.password : "";
  if (!identifier || !password) {
    return res.status(400).json({ error: "Informe usuário ou e-mail e sua senha." });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE username = ? OR email = ?")
    .get(identifier, identifier);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Usuário ou senha inválidos." });
  }

  const token = createToken();
  const created = timestamp();
  db.prepare(
    "INSERT INTO sessions (token_digest, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
  ).run(tokenDigest(token), user.id, new Date(Date.now() + 8 * 3600000).toISOString(), created);
  setSessionCookie(res, token);
  return res.json({
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  });
});

app.get("/api/auth/me", (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  return res.json({ user });
});

app.post("/api/auth/logout", (req, res) => {
  const token = parseCookies(req.headers.cookie).dashboardia_session;
  if (token) db.prepare("DELETE FROM sessions WHERE token_digest = ?").run(tokenDigest(token));
  clearSessionCookie(res);
  return res.status(204).end();
});

app.get("/api/dashboard", requireAuth, (req, res) => {
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM projects) AS projects,
      (SELECT COUNT(*) FROM tasks WHERE status != 'done') AS open_tasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'done') AS completed_tasks,
      (SELECT COUNT(*) FROM users) AS team_members
  `).get();
  const projects = db.prepare(`
    SELECT projects.id, projects.project_key AS projectKey, projects.name,
      projects.description, projects.status, projects.progress,
      COUNT(tasks.id) AS taskCount,
      SUM(CASE WHEN tasks.status = 'done' THEN 1 ELSE 0 END) AS completedTasks
    FROM projects LEFT JOIN tasks ON tasks.project_id = projects.id
    GROUP BY projects.id ORDER BY projects.updated_at DESC LIMIT 5
  `).all();
  const tasks = db.prepare(`
    SELECT tasks.id, tasks.title, tasks.description, tasks.status, tasks.priority,
      tasks.assignee, tasks.due_date AS dueDate, projects.name AS projectName,
      projects.project_key AS projectKey
    FROM tasks JOIN projects ON projects.id = tasks.project_id
    ORDER BY CASE tasks.status WHEN 'in_progress' THEN 1 WHEN 'todo' THEN 2 ELSE 3 END,
      tasks.updated_at DESC LIMIT 8
  `).all();
  const activity = db.prepare(`
    SELECT activity.id, activity.activity_type AS type, activity.title,
      activity.description, activity.created_at AS createdAt,
      users.username FROM activity LEFT JOIN users ON users.id = activity.user_id
    ORDER BY activity.created_at DESC LIMIT 6
  `).all();
  const members = db.prepare(`
    SELECT id, username, email, role FROM users ORDER BY created_at ASC LIMIT 8
  `).all();
  return res.json({ stats, projects, tasks, activity, members, user: req.user });
});

app.get("/api/projects", requireAuth, (_req, res) => {
  const projects = db.prepare(`
    SELECT projects.id, project_key AS projectKey, name, description, status, progress,
      created_at AS createdAt, updated_at AS updatedAt,
      COUNT(tasks.id) AS taskCount,
      SUM(CASE WHEN tasks.status = 'done' THEN 1 ELSE 0 END) AS completedTasks
    FROM projects LEFT JOIN tasks ON tasks.project_id = projects.id
    GROUP BY projects.id ORDER BY updated_at DESC
  `).all();
  return res.json({ projects });
});

app.post("/api/projects", requireAuth, (req, res) => {
  const body = req.body || {};
  const name = cleanText(body.name);
  const projectKey = cleanText(body.projectKey).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!name || !projectKey) return res.status(400).json({ error: "Nome e chave do projeto são obrigatórios." });
  try {
    const time = timestamp();
    const result = db.prepare(`
      INSERT INTO projects (project_key, name, description, status, progress, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, 'planning', 0, ?, ?, ?)
    `).run(projectKey, name, cleanText(body.description), req.user.id, time, time);
    db.prepare(`
      INSERT INTO activity (user_id, activity_type, title, description, created_at)
      VALUES (?, 'project', ?, 'Novo projeto adicionado ao seu espaço.', ?)
    `).run(req.user.id, `Projeto ${name} criado`, time);
    return res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Essa chave de projeto já está em uso." });
    }
    throw error;
  }
});

app.post("/api/tasks", requireAuth, (req, res) => {
  const body = req.body || {};
  const title = cleanText(body.title);
  const projectId = Number(body.projectId);
  if (!title || !Number.isInteger(projectId)) {
    return res.status(400).json({ error: "Título e projeto são obrigatórios." });
  }
  const project = db.prepare("SELECT id, name FROM projects WHERE id = ?").get(projectId);
  if (!project) return res.status(404).json({ error: "Projeto não encontrado." });
  const time = timestamp();
  const result = db.prepare(`
    INSERT INTO tasks
      (project_id, title, description, status, priority, assignee, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    projectId,
    title,
    cleanText(body.description),
    validEnum(body.status, ["todo", "in_progress", "done"], "todo"),
    validEnum(body.priority, ["low", "medium", "high"], "medium"),
    cleanText(body.assignee, "Você"),
    cleanText(body.dueDate) || null,
    time,
    time,
  );
  db.prepare(`
    INSERT INTO activity (user_id, activity_type, title, description, created_at)
    VALUES (?, 'task', ?, ?, ?)
  `).run(req.user.id, "Nova tarefa adicionada", `${title} · ${project.name}`, time);
  return res.status(201).json({ id: result.lastInsertRowid });
});

app.patch("/api/tasks/:id", requireAuth, (req, res) => {
  const body = req.body || {};
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(Number(req.params.id));
  if (!task) return res.status(404).json({ error: "Tarefa não encontrada." });
  const status = validEnum(body.status, ["todo", "in_progress", "done"], task.status);
  db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, task.id);
  if (status !== task.status) {
    db.prepare(`
      INSERT INTO activity (user_id, activity_type, title, description, created_at)
      VALUES (?, 'task', ?, ?, ?)
    `).run(req.user.id, "Status de tarefa atualizado", `${task.title} · ${status === "done" ? "concluída" : "em andamento"}`, timestamp());
  }
  return res.json({ ok: true });
});

app.use(express.static(path.join(config.rootDir, "public"), { extensions: ["html"] }));
app.get("*", (_req, res) => res.sendFile(path.join(config.rootDir, "public", "index.html")));

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Dashboardia disponível em http://localhost:${config.port}`);
    console.log(`Banco: ${config.databasePath}`);
    if (demo.enabled) console.log("Modo demonstrativo ativo: acesso administrativo pronto.");
  });
}

module.exports = app;