import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { config } from "./config.js";
import { Database } from "./persistence/database.js";
import { bootstrapDemo } from "./seed.js";

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");
const database = new Database();
const sessions = new Map();

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function sendJson(response, status, body) {
  response.writeHead(status, jsonHeaders);
  response.end(JSON.stringify(body));
}

function sendError(response, status, message) {
  sendJson(response, status, { error: message });
}

async function body(request) {
  let contents = "";
  for await (const chunk of request) contents += chunk;
  if (!contents) return {};
  try {
    return JSON.parse(contents);
  } catch {
    throw new Error("O corpo da requisição precisa ser um JSON válido.");
  }
}

function userFromRequest(request) {
  const token = request.headers.authorization?.replace("Bearer ", "");
  return token ? sessions.get(token) : null;
}

function dashboard() {
  const projects = database.all("projects");
  const tasks = database.all("tasks");
  const activities = database
    .all("activities")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
  const enrichedProjects = projects.map((project) => ({
    ...project,
    tasks: tasks
      .filter((task) => task.projectId === project.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }));
  const done = tasks.filter((task) => task.status === "done").length;
  return {
    summary: {
      projects: projects.length,
      openTasks: tasks.filter((task) => task.status !== "done").length,
      completedTasks: done,
      completion: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    },
    projects: enrichedProjects,
    activities,
  };
}

function validateText(value, label, max = 100) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} é obrigatório.`);
  if (value.trim().length > max) throw new Error(`${label} deve ter no máximo ${max} caracteres.`);
  return value.trim();
}

async function api(request, response, requestUrl) {
  const route = requestUrl.pathname;
  if (request.method === "GET" && route === "/api/health") {
    return sendJson(response, 200, { status: "ok", schemaVersion: database.state.schemaVersion });
  }
  if (request.method === "GET" && route === "/api/dashboard") {
    return sendJson(response, 200, dashboard());
  }
  if (request.method === "POST" && route === "/api/auth/login") {
    const input = await body(request);
    const login = validateText(input.login, "Login");
    const password = validateText(input.password, "Senha", 200);
    const account = database.find(
      "users",
      (item) => item.email === login || item.username === login,
    );
    if (!account) return sendError(response, 401, "Login ou senha inválidos.");
    const candidate = scryptSync(password, account.salt, 64);
    const expected = Buffer.from(account.passwordHash, "hex");
    if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
      return sendError(response, 401, "Login ou senha inválidos.");
    }
    const token = randomUUID();
    sessions.set(token, { id: account.id, username: account.username, role: account.role });
    return sendJson(response, 200, { token, user: sessions.get(token) });
  }

  if (request.method === "POST" && route === "/api/projects") {
    const input = await body(request);
    const title = validateText(input.title, "Título");
    if (database.find("projects", (item) => item.title.toLowerCase() === title.toLowerCase())) {
      return sendError(response, 409, "Já existe um projeto com esse título.");
    }
    const project = await database.insert("projects", {
      title,
      description: typeof input.description === "string" ? input.description.trim().slice(0, 240) : "",
      status: "active",
      color: input.color || "#6d5dfc",
      ownerId: userFromRequest(request)?.id || null,
    });
    await database.insert("activities", {
      type: "project_created",
      message: `You created ${project.title}`,
      projectId: project.id,
      actor: "You",
    });
    return sendJson(response, 201, project);
  }

  const taskMatch = route.match(/^\/api\/tasks\/([^/]+)$/);
  if (request.method === "PATCH" && taskMatch) {
    const input = await body(request);
    const allowed = ["todo", "in_progress", "done"];
    if (!allowed.includes(input.status)) return sendError(response, 400, "Status de tarefa inválido.");
    const existing = database.find("tasks", (task) => task.id === taskMatch[1]);
    if (!existing) return sendError(response, 404, "Tarefa não encontrada.");
    const task = await database.update("tasks", existing.id, { status: input.status });
    if (input.status === "done" && existing.status !== "done") {
      await database.insert("activities", {
        type: "task_completed",
        message: `You completed ${task.title}`,
        projectId: task.projectId,
        actor: "You",
      });
    }
    return sendJson(response, 200, task);
  }

  return sendError(response, 404, "Rota de API não encontrada.");
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

async function staticFile(request, response, requestUrl) {
  const requested = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.resolve(publicDir, `.${requested}`);
  if (!filePath.startsWith(publicDir)) return sendError(response, 403, "Acesso negado.");
  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(content);
  } catch {
    sendError(response, 404, "Arquivo não encontrado.");
  }
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  try {
    if (requestUrl.pathname.startsWith("/api/")) {
      await api(request, response, requestUrl);
    } else if (request.method === "GET") {
      await staticFile(request, response, requestUrl);
    } else {
      sendError(response, 405, "Método não permitido.");
    }
  } catch (error) {
    console.error(error);
    sendError(response, error.message.includes("obrigatório") ? 400 : 500, error.message);
  }
});

await database.init();
const demo = await bootstrapDemo(database);
server.listen(config.port, config.host, () => {
  console.log(`Helloword disponível em http://${config.host}:${config.port}`);
  if (demo.enabled) console.log(`Modo demo ativo para ${demo.email}`);
});

process.on("SIGTERM", () => server.close());