import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { config } from "./config.js";
import { Database } from "./persistence/database.js";
import { bootstrapDemo } from "./seed.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const database = new Database();
const sessions = new Map();

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function sendJson(response, status, value) {
  response.writeHead(status, jsonHeaders);
  response.end(JSON.stringify(value));
}

function sendError(response, status, message) {
  sendJson(response, status, { error: message });
}

async function readBody(request) {
  let contents = "";
  for await (const chunk of request) contents += chunk;
  if (!contents) return {};
  try {
    return JSON.parse(contents);
  } catch {
    throw new Error("O corpo da requisição precisa ser um JSON válido.");
  }
}

function text(value, label, max = 160) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} é obrigatório.`);
  if (value.trim().length > max) throw new Error(`${label} deve ter no máximo ${max} caracteres.`);
  return value.trim();
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 99) {
    throw new Error(`${label} deve ser um número entre 1 e 99.`);
  }
  return number;
}

function cartResponse() {
  const products = database.all("products");
  const items = database
    .all("cartItems")
    .map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) }))
    .filter((item) => item.product);
  return {
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.quantity * item.product.price, 0),
  };
}

function catalogResponse(requestUrl) {
  const query = requestUrl.searchParams.get("q")?.toLocaleLowerCase("pt-BR") || "";
  const category = requestUrl.searchParams.get("category") || "";
  const sort = requestUrl.searchParams.get("sort") || "recommended";
  const categories = database.all("categories");
  let products = database.all("products").filter((product) => {
    const matchesCategory = !category || product.categoryId === category;
    const categoryName = categories.find((item) => item.id === product.categoryId)?.name || "";
    const searchable = `${product.title} ${categoryName}`.toLocaleLowerCase("pt-BR");
    return matchesCategory && (!query || searchable.includes(query));
  });
  if (sort === "price-asc") products.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") products.sort((a, b) => b.price - a.price);
  if (sort === "rating") products.sort((a, b) => b.rating - a.rating);
  return { products, categories, total: products.length };
}

async function api(request, response, requestUrl) {
  const route = requestUrl.pathname;

  if (request.method === "GET" && route === "/api/health") {
    return sendJson(response, 200, { status: "ok", schemaVersion: database.state.schemaVersion });
  }
  if (request.method === "GET" && route === "/api/catalog") {
    return sendJson(response, 200, catalogResponse(requestUrl));
  }
  if (request.method === "GET" && route === "/api/cart") {
    return sendJson(response, 200, cartResponse());
  }

  if (request.method === "POST" && route === "/api/cart") {
    const input = await readBody(request);
    const productId = text(input.productId, "Produto", 80);
    const product = database.find("products", (item) => item.id === productId);
    if (!product) return sendError(response, 404, "Produto não encontrado.");
    const quantity = positiveInteger(input.quantity === undefined ? 1 : input.quantity, "Quantidade");
    const existing = database.find("cartItems", (item) => item.productId === productId);
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (nextQuantity > product.stock) return sendError(response, 409, "Quantidade indisponível em estoque.");
    if (existing) {
      await database.update("cartItems", existing.id, { quantity: nextQuantity });
    } else {
      await database.insert("cartItems", { productId, quantity }, {
        unique: [["productId", "O produto já está no carrinho."]],
      });
    }
    return sendJson(response, 200, cartResponse());
  }

  const cartMatch = route.match(/^\/api\/cart\/([^/]+)$/);
  if (cartMatch && request.method === "PATCH") {
    const input = await readBody(request);
    const item = database.find("cartItems", (entry) => entry.id === cartMatch[1]);
    if (!item) return sendError(response, 404, "Item não encontrado no carrinho.");
    const product = database.find("products", (entry) => entry.id === item.productId);
    const quantity = positiveInteger(input.quantity, "Quantidade");
    if (quantity > product.stock) return sendError(response, 409, "Quantidade indisponível em estoque.");
    await database.update("cartItems", item.id, { quantity });
    return sendJson(response, 200, cartResponse());
  }
  if (cartMatch && request.method === "DELETE") {
    const item = database.find("cartItems", (entry) => entry.id === cartMatch[1]);
    if (!item) return sendError(response, 404, "Item não encontrado no carrinho.");
    await database.remove("cartItems", item.id);
    return sendJson(response, 200, cartResponse());
  }

  if (request.method === "POST" && route === "/api/orders") {
    const currentCart = cartResponse();
    if (!currentCart.items.length) return sendError(response, 400, "Seu carrinho está vazio.");
    for (const item of currentCart.items) {
      if (item.quantity > item.product.stock) {
        return sendError(response, 409, `O produto ${item.product.title} ficou sem estoque.`);
      }
    }
    for (const item of currentCart.items) {
      await database.update("products", item.product.id, { stock: item.product.stock - item.quantity });
    }
    const order = await database.insert("orders", {
      number: `ML${Date.now().toString().slice(-8)}`,
      items: currentCart.items.map((item) => ({
        productId: item.product.id,
        title: item.product.title,
        quantity: item.quantity,
        price: item.product.price,
      })),
      total: currentCart.subtotal,
      status: "paid",
    });
    await database.clear("cartItems");
    return sendJson(response, 201, order);
  }

  if (request.method === "POST" && route === "/api/auth/login") {
    const input = await readBody(request);
    const login = text(input.login, "Login", 160);
    const password = text(input.password, "Senha", 200);
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

  return sendError(response, 404, "Rota de API não encontrada.");
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

async function staticFile(request, response, requestUrl) {
  let requested = requestUrl.pathname;
  if (requested === "/" || !path.extname(requested)) requested = "/index.html";
  const filePath = path.resolve(projectRoot, `.${requested}`);
  if (!filePath.startsWith(projectRoot)) return sendError(response, 403, "Acesso negado.");
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
  console.log(`Mercado Livre disponível em http://${config.host}:${config.port}`);
  if (demo.enabled) console.log(`Modo demo ativo para ${demo.email}`);
});

process.on("SIGTERM", () => server.close());