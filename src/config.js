import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function booleanFromEnv(value) {
  return String(value).toLowerCase() === "true";
}

export const config = {
  rootDir,
  host: process.env.HOST || "0.0.0.0",
  port: Number.parseInt(process.env.PORT || "3000", 10),
  dataDir: path.resolve(rootDir, process.env.DATA_DIR || "data"),
  demoMode: booleanFromEnv(process.env.DASHBOARDIA_DEMO_MODE),
};