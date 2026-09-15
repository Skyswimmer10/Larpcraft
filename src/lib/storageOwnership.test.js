import { describe, expect, it } from 'vitest';
import { makeLibrarySeed, makeProjectSeed } from '../data/seed.js';
import {
  enforceStorageOwnership,
  MASTER_LIBRARY_COLLECTIONS,
  masterCollectionForAction,
  stripMasterCollectionsFromProject,
} from './storageOwnership.js';

describe('master-library storage ownership', () => {
  it('accounts for every collection that exists only in the master-library schema', () => {
    const library = makeLibrarySeed();
    const project = makeProjectSeed();
    const libraryOnly = Object.keys(library)
      .filter((key) => key !== 'rev' && !Object.prototype.hasOwnProperty.call(project, key))
      .sort();
    expect([...MASTER_LIBRARY_COLLECTIONS].sort()).toEqual(libraryOnly);
  });

  it('identifies direct and graph-scoped master-library actions', () => {
    expect(masterCollectionForAction({ type: 'ADD_ENTITY', coll: 'concepts' })).toBe('concepts');
    expect(masterCollectionForAction({ type: 'GRAPH_ADD_NODE', scope: { coll: 'mechStructures' } })).toBe('mechStructures');
    expect(masterCollectionForAction({ type: 'ADD_ENTITY', coll: 'nodes' })).toBe(null);
    expect(masterCollectionForAction({ type: 'ADD_ENTITY', coll: 'items' })).toBe(null);
  });

  it('moves misplaced master records into the library and removes their project copies', () => {
    const library = { concepts: { A: { id: 'A', name: 'Small' } }, items: { LI: {} } };
    const project = {
      concepts: { A: { id: 'A', name: 'Full concept', nodes: { N1: {} } }, B: { id: 'B' } },
      stories: { S: { id: 'S' } },
      items: { PI: {} },
      nodes: { N: {} },
    };

    const owned = enforceStorageOwnership(library, project);
    expect(owned.library.concepts).toEqual(project.concepts);
    expect(owned.library.stories).toEqual(project.stories);
    expect(owned.project).not.toHaveProperty('concepts');
    expect(owned.project).not.toHaveProperty('stories');
    expect(owned.project.items).toBe(project.items);
    expect(owned.project.nodes).toBe(project.nodes);
  });

  it('returns untouched stores when ownership is already correct', () => {
    const library = { concepts: { A: {} } };
    const project = { nodes: { N: {} }, items: {} };
    const owned = enforceStorageOwnership(library, project);
    expect(owned.library).toBe(library);
    expect(owned.project).toBe(project);
  });

  it('strips master collections before a project-only save', () => {
    const project = { nodes: { N: {} }, concepts: { A: {} }, mechStructures: { M: {} } };
    expect(stripMasterCollectionsFromProject(project)).toEqual({ nodes: { N: {} } });
    expect(project).toHaveProperty('concepts');
  });
});
