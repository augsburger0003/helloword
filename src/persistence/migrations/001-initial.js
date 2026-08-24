'use strict';

const VERSION = 1;

function apply(state) {
  const next = state && typeof state === 'object' ? state : {};

  if (!Array.isArray(next.items)) {
    next.items = [];
  }

  if (!Number.isInteger(next.schemaVersion) || next.schemaVersion < VERSION) {
    next.schemaVersion = VERSION;
  }

  return next;
}

module.exports = { VERSION, apply };