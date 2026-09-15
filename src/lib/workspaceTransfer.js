import { LIB_REV, SEED_REV, migrateLibrary, migrateProject } from '../data/seed.js';
import { enforceStorageOwnership } from './storageOwnership.js';

export const WORKSPACE_FORMAT = 'larpcraft-workspace';
export const WORKSPACE_VERSION = 1;

export function createWorkspaceBackup(library, project) {
  const owned = enforceStorageOwnership(library, project);
  return {
    format: WORKSPACE_FORMAT,
    version: WORKSPACE_VERSION,
    exportedAt: new Date().toISOString(),
    schema: { library: LIB_REV, project: SEED_REV },
    library: owned.library,
    project: owned.project,
  };
}

export function readWorkspaceBackup(text) {
  const data = JSON.parse(text);
  if (data?.format !== WORKSPACE_FORMAT || !data.library || !data.project) {
    throw new Error('This is not a Larpcraft complete workspace file.');
  }
  const owned = enforceStorageOwnership(migrateLibrary(data.library), migrateProject(data.project));
  return {
    library: owned.library,
    project: owned.project,
    exportedAt: data.exportedAt || null,
  };
}
