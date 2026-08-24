const fs = require("node:fs");
const path = require("node:path");
const db = require("./db");
const config = require("./config");
const { hashPassword } = require("./security");

function now() {
  return new Date().toISOString();
}

function seedDemoData() {
  if (!config.demoMode) {
    return { enabled: false, created: false };
  }

  const timestamp = now();
  const seed = db.transaction(() => {
    let user = db
      .prepare("SELECT * FROM users WHERE username = ? OR email = ?")
      .get(config.demoUsername, config.demoEmail);

    if (!user) {
      const result = db
        .prepare(
          `INSERT INTO users
            (username, email, password_hash, role, created_at, updated_at)
           VALUES (?, ?, ?, 'admin', ?, ?)`,
        )
        .run(
          config.demoUsername,
          config.demoEmail,
          hashPassword(config.demoPassword),
          timestamp,
          timestamp,
        );
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    } else {
      db.prepare(
        "UPDATE users SET email = ?, password_hash = ?, role = 'admin' WHERE id = ?",
      ).run(config.demoEmail, hashPassword(config.demoPassword), user.id);
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    }

    const projectCount = db
      .prepare("SELECT COUNT(*) AS count FROM projects")
      .get().count;

    if (projectCount === 0) {
      const projectInsert = db.prepare(
        `INSERT INTO projects
          (project_key, name, description, status, progress, owner_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      const hello = projectInsert.run(
        "HELLO",
        "HelloWord",
        "Produto principal e experiência de boas-vindas.",
        "active",
        72,
        user.id,
        timestamp,
        timestamp,
      );
      const ops = projectInsert.run(
        "OPS",
        "Operações",
        "Rotinas internas e qualidade de entrega.",
        "active",
        46,
        user.id,
        timestamp,
        timestamp,
      );
      const taskInsert = db.prepare(
        `INSERT INTO tasks
          (project_id, title, description, status, priority, assignee, due_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      const tasks = [
        [hello.lastInsertRowid, "Revisar fluxo de onboarding", "Validar o primeiro acesso de novos clientes.", "in_progress", "high", "Você", "Hoje"],
        [hello.lastInsertRowid, "Publicar release notes", "Organizar as novidades da última entrega.", "todo", "medium", "Marina", "Amanhã"],
        [ops.lastInsertRowid, "Auditar métricas semanais", "Conferir dados e preparar o resumo semanal.", "done", "low", "Rafael", "Concluído"],
        [ops.lastInsertRowid, "Atualizar playbook de suporte", "Incluir respostas para os novos cenários.", "todo", "medium", "Você", "Sex, 18 out"],
      ];
      for (const task of tasks) {
        taskInsert.run(...task, timestamp, timestamp);
      }

      const activityInsert = db.prepare(
        `INSERT INTO activity
          (user_id, activity_type, title, description, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      );
      activityInsert.run(user.id, "project", "Projeto HelloWord criado", "Acompanhe o progresso no painel.", timestamp);
      activityInsert.run(user.id, "task", "3 tarefas foram concluídas", "A equipe manteve o ritmo nesta semana.", new Date(Date.now() - 3600000).toISOString());
      activityInsert.run(user.id, "team", "Novo membro no time", "Marina entrou no projeto HelloWord.", new Date(Date.now() - 86400000).toISOString());
      activityInsert.run(user.id, "milestone", "Marco alcançado", "O projeto ultrapassou 70% de progresso.", new Date(Date.now() - 172800000).toISOString());
      return { enabled: true, created: true, user };
    }

    return { enabled: true, created: false, user };
  });

  const result = seed();
  const dashboardDir = path.join(config.rootDir, ".dashboardia");
  fs.mkdirSync(dashboardDir, { recursive: true });
  fs.writeFileSync(
    path.join(dashboardDir, "demo-access.json"),
    `${JSON.stringify({ version: 1 }, null, 2)}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  return result;
}

module.exports = { seedDemoData };