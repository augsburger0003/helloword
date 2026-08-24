import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { up as initialMigration } from "./migrations/001-initial.js";

const migrations = [{ name: "001-initial", up: initialMigration }];

function now() {
  return new Date().toISOString();
}

function audited(record, timestamp = now()) {
  return {
    ...record,
    createdAt: record.createdAt || timestamp,
    updatedAt: timestamp,
  };
}

function assertCollection(collection) {
  if (!Array.isArray(collection)) {
    throw new Error("A persistência recebeu uma coleção inválida.");
  }
}

export class Database {
  constructor(filePath = path.join(config.dataDir, "database.json")) {
    this.filePath = filePath;
    this.state = null;
  }

  async init() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    let stored;
    try {
      stored = JSON.parse(await fs.readFile(this.filePath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      stored = {};
    }

    this.state = stored;
    for (const migration of migrations) {
      const completed = this.state.migrations || [];
      if (!completed.includes(migration.name)) {
        this.state = migration.up(this.state);
      }
    }
    await this.persist();
    return this;
  }

  async persist() {
    const temporaryPath = `${this.filePath}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(this.state, null, 2)}\n`, "utf8");
    await fs.rename(temporaryPath, this.filePath);
  }

  all(collection) {
    assertCollection(this.state[collection]);
    return this.state[collection].map((item) => ({ ...item }));
  }

  find(collection, predicate) {
    assertCollection(this.state[collection]);
    const found = this.state[collection].find(predicate);
    return found ? { ...found } : null;
  }

  async insert(collection, record, { unique = [] } = {}) {
    assertCollection(this.state[collection]);
    for (const [field, message] of unique) {
      if (this.state[collection].some((item) => item[field] === record[field])) {
        throw new Error(message || `${field} precisa ser único.`);
      }
    }
    const entity = audited({ id: record.id || randomUUID(), ...record });
    this.state[collection].push(entity);
    await this.persist();
    return { ...entity };
  }

  async update(collection, id, changes) {
    assertCollection(this.state[collection]);
    const index = this.state[collection].findIndex((item) => item.id === id);
    if (index === -1) return null;
    const current = this.state[collection][index];
    const entity = audited({ ...current, ...changes, id: current.id }, now());
    this.state[collection][index] = entity;
    await this.persist();
    return { ...entity };
  }

  async clear(collection) {
    assertCollection(this.state[collection]);
    this.state[collection] = [];
    await this.persist();
  }
}

export { audited };