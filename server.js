import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDirectory = join(root, "public");
const argumentValue = (name) => {
  const exactIndex = process.argv.indexOf(name);
  if (exactIndex !== -1) {
    return process.argv[exactIndex + 1];
  }

  const prefixedArgument = process.argv.find((argument) => argument.startsWith(`${name}=`));
  return prefixedArgument?.slice(name.length + 1);
};
const port = Number.parseInt(process.env.PORT || argumentValue("--port") || "3000", 10);
const host = process.env.HOST || argumentValue("--host") || "0.0.0.0";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function serve(request, response) {
  const requestPath = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`).pathname;
  const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const filePath = normalize(join(publicDirectory, relativePath));

  if (!filePath.startsWith(publicDirectory)) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "cache-control": "no-cache",
      "content-type": contentTypes[extname(filePath)] || "application/octet-stream",
    });
    response.end(body);
  } catch {
    const fallback = await readFile(join(publicDirectory, "index.html"));
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(fallback);
  }
}

createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { allow: "GET, HEAD" });
    response.end();
    return;
  }

  serve(request, response).catch(() => {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end("Internal server error");
  });
}).listen(port, host, () => {
  console.log(`helloword preview running at http://${host}:${port}`);
});