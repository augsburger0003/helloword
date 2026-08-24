import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import { config } from "./config.js";

function passwordHash(password, salt = randomBytes(16).toString("hex")) {
  return {
    salt,
    passwordHash: scryptSync(password, salt, 64).toString("hex"),
  };
}

function valueOrGenerated(value, fallbackFactory) {
  return value && value.trim() ? value.trim() : fallbackFactory();
}

export async function bootstrapDemo(database) {
  if (!config.demoMode) return { enabled: false, seeded: false };

  const accessDir = path.join(config.rootDir, ".dashboardia");
  let previousAccess = null;
  try {
    previousAccess = JSON.parse(await fs.readFile(path.join(accessDir, "demo-access.json"), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const username = valueOrGenerated(process.env.DASHBOARDIA_DEMO_USERNAME, () => "admin");
  const email = valueOrGenerated(
    process.env.DASHBOARDIA_DEMO_EMAIL,
    () => `${username}@example.com`,
  );
  const password = valueOrGenerated(
    process.env.DASHBOARDIA_DEMO_PASSWORD,
    () => previousAccess?.password || randomBytes(12).toString("base64url"),
  );

  let user = database.find("users", (item) => item.email === email || item.username === username);
  if (!user) {
    user = await database.insert(
      "users",
      {
        username,
        email,
        role: "admin",
        ...passwordHash(password),
      },
      {
        unique: [
          ["username", "O nome de usuário já está em uso."],
          ["email", "O e-mail já está em uso."],
        ],
      },
    );
  } else {
    // Keep the opt-in credentials and the stored account in sync across
    // restarts, while Database.update preserves the original createdAt.
    user = await database.update("users", user.id, passwordHash(password));
  }

  if (database.all("projects").length === 0) {
    const launch = await database.insert("projects", {
      title: "Website launch",
      description: "A primeira entrega do produto, do conceito ao ar.",
      status: "active",
      color: "#6d5dfc",
      ownerId: user.id,
    });
    const discovery = await database.insert("projects", {
      title: "Research & discovery",
      description: "Perguntas que ajudam o time a tomar decisões melhores.",
      status: "active",
      color: "#2bbf9f",
      ownerId: user.id,
    });
    const archive = await database.insert("projects", {
      title: "Brand refresh",
      description: "Arquivos de referência da atualização visual.",
      status: "completed",
      color: "#f2aa61",
      ownerId: user.id,
    });

    await database.insert("tasks", {
      projectId: launch.id,
      title: "Polish onboarding flow",
      status: "in_progress",
      priority: "high",
      assignee: "You",
    });
    await database.insert("tasks", {
      projectId: launch.id,
      title: "Review analytics events",
      status: "todo",
      priority: "medium",
      assignee: "Maya",
    });
    await database.insert("tasks", {
      projectId: discovery.id,
      title: "Interview three customers",
      status: "done",
      priority: "high",
      assignee: "Noah",
    });
    await database.insert("tasks", {
      projectId: discovery.id,
      title: "Map the main opportunity",
      status: "in_progress",
      priority: "low",
      assignee: "You",
    });
    await database.insert("tasks", {
      projectId: archive.id,
      title: "Approve final color tokens",
      status: "done",
      priority: "medium",
      assignee: "Maya",
    });

    await database.insert("activities", {
      type: "project_created",
      message: "You created Website launch",
      projectId: launch.id,
      actor: "You",
    });
    await database.insert("activities", {
      type: "task_completed",
      message: "Noah completed Interview three customers",
      projectId: discovery.id,
      actor: "Noah",
    });
    await database.insert("activities", {
      type: "project_created",
      message: "You created Research & discovery",
      projectId: discovery.id,
      actor: "You",
    });
  }

  await fs.mkdir(accessDir, { recursive: true });
  await fs.writeFile(
    path.join(accessDir, "demo-access.json"),
    `${JSON.stringify({ version: 1, username, email, password }, null, 2)}\n`,
    "utf8",
  );

  return { enabled: true, seeded: true, username, email };
}