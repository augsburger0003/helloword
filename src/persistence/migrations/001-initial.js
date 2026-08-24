/**
 * The first migration deliberately creates the complete document shape. Keeping
 * this separate from the repository makes future changes additive and
 * repeatable when the application starts against a clean data directory.
 */
export function up(state) {
  return {
    schemaVersion: 1,
    migrations: [...(state.migrations || []), "001-initial"],
    users: Array.isArray(state.users) ? state.users : [],
    projects: Array.isArray(state.projects) ? state.projects : [],
    tasks: Array.isArray(state.tasks) ? state.tasks : [],
    activities: Array.isArray(state.activities) ? state.activities : [],
  };
}