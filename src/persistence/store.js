'use strict';

const fs = require('node:fs');
const path = require('node:path');
const initialMigration = require('./migrations/001-initial');

const dataDirectory = path.join(process.cwd(), '.data');
const dataFile = path.join(dataDirectory, 'helloword.json');

function readState() {
  if (!fs.existsSync(dataFile)) {
    return initialMigration.apply({});
  }

  try {
    const contents = fs.readFileSync(dataFile, 'utf8');
    return initialMigration.apply(JSON.parse(contents));
  } catch (error) {
    throw new Error(`Não foi possível ler a persistência local: ${error.message}`);
  }
}

function writeState(state) {
  fs.mkdirSync(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryFile, dataFile);
}

function ensureDatabase() {
  const state = readState();

  if (!Array.isArray(state.items) || state.items.length === 0) {
    state.items = [
      {
        id: 'welcome',
        name: 'Primeiro passo',
        description: 'Dados demonstrativos do projeto helloword.',
        createdAt: new Date().toISOString()
      }
    ];
  }

  writeState(state);
  return state;
}

function listItems() {
  return readState().items;
}

function addItem(name) {
  const state = readState();
  const item = {
    id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    description: '',
    createdAt: new Date().toISOString()
  };

  state.items.push(item);
  writeState(state);
  return item;
}

module.exports = {
  addItem,
  ensureDatabase,
  listItems
};