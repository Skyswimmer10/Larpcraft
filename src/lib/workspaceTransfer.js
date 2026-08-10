import { LIB_REV, SEED_REV, migrateLibrary, migrateProject } from '../data/seed.js';

export const WORKSPACE_FORMAT = 'larpcraft-workspace';
export const WORKSPACE_VERSION = 1;

export function createWorkspaceBackup(library, project) {
  return {
    format: WORKSPACE_FORMAT,
    version: WORKSPACE_VERSION,
    exportedAt: new Date().toISOString(),
    schema: { library: LIB_REV, project: SEED_REV },
    library,
    project,
  };
}

export function readWorkspaceBackup(text) {
  const data = JSON.parse(text);
  if (data?.format !== WORKSPACE_FORMAT || !data.library || !data.project) {
    throw new Error('This is not a Larpcraft complete workspace file.');
  }
  return {
    library: migrateLibrary(data.library),
    project: migrateProject(data.project),
    exportedAt: data.exportedAt || null,
  };
}
