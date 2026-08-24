const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

// Node does not load .env automatically on every supported runtime. Keep the
// loader intentionally small so local startup works without an extra package;
// real environment variables always have precedence.
const envFile = path.join(rootDir, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

module.exports = {
  rootDir,
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  databasePath: path.resolve(
    rootDir,
    process.env.DATABASE_PATH || ".dashboardia/dashboardia.sqlite",
  ),
  demoMode: process.env.DASHBOARDIA_DEMO_MODE === "true",
  demoUsername: process.env.DASHBOARDIA_DEMO_USERNAME || "admin",
  demoEmail:
    process.env.DASHBOARDIA_DEMO_EMAIL || "admin@dashboardia.local",
  demoPassword:
    process.env.DASHBOARDIA_DEMO_PASSWORD || "dashboardia-demo",
};