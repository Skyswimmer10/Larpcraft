import { describe, expect, it } from 'vitest';
import { makeLibrarySeed, makeProjectSeed } from '../data/seed.js';
import { createWorkspaceBackup, readWorkspaceBackup, WORKSPACE_FORMAT } from './workspaceTransfer.js';

describe('complete workspace transfer', () => {
  it('preserves custom library concepts and active-game nodes together', () => {
    const library = makeLibrarySeed();
    const project = makeProjectSeed();
    library.concepts['C-CUSTOM'] = { id: 'C-CUSTOM', name: 'Transferred concept', nodes: {}, edges: [] };
    project.nodes['N-CUSTOM'] = { id: 'N-CUSTOM', kind: 'event', title: 'Transferred event', x: 10, y: 20 };
    const restored = readWorkspaceBackup(JSON.stringify(createWorkspaceBackup(library, project)));
    expect(createWorkspaceBackup(library, project).format).toBe(WORKSPACE_FORMAT);
    expect(restored.library.concepts['C-CUSTOM'].name).toBe('Transferred concept');
    expect(restored.project.nodes['N-CUSTOM'].title).toBe('Transferred event');
  });

  it('rejects a game-only save as a complete workspace', () => {
    expect(() => readWorkspaceBackup(JSON.stringify(makeProjectSeed()))).toThrow(/complete workspace/i);
  });
});
