import { describe, expect, it } from 'vitest';
import { storyWizardSources, storyToolInsertion } from './storyTools.js';
import { makeLibrarySeed, makeEmptyProject, SUBNODE_BLANK } from '../data/seed.js';
import { reducer, locateGraph } from '../state/reducer.js';
const libraryFixture = () => {
  const lib = makeLibrarySeed();
  lib.narrative.support = { id: 'support', name: 'Comment template', nodeClass: 'subnode', subKind: 'comment', template: SUBNODE_BLANK('support', 'comment') };
  return lib;
};

describe('combined Story Wizard catalogue', () => {
  it('retains all tool categories while keeping created products separate and sources unchanged', () => {
    const lib = libraryFixture();
    lib.concepts.finished = { id: 'finished', name: 'My finished story', narrativeWizard: { answers: {} } };
    const before = JSON.stringify(lib);
    const rows = storyWizardSources(lib);
    expect(new Set(rows.map(row => row.type))).toEqual(new Set(['framework', 'concept', 'structure', 'template']));
    expect(rows.some(row => row.source.id === 'finished')).toBe(false);
    expect(rows.filter(row => row.source.id === 'larpcraftGroupFoundations')).toHaveLength(1);
    expect(rows.filter(row => !row.canWizard).every(row => ['structure', 'template'].includes(row.type))).toBe(true);
    expect(storyWizardSources(lib, { includeSubnodes: false }).some(row => row.type === 'template')).toBe(false);
    expect(JSON.stringify(lib)).toBe(before);
  });

  it('inserts an independent copy of every tool kind through the existing reducer', () => {
    const lib = libraryFixture(), original = JSON.stringify(lib);
    let game = makeEmptyProject('Tools');
    for (const type of ['framework', 'concept', 'structure', 'template']) {
      const row = storyWizardSources(lib).find(row => row.type === type);
      const insertion = storyToolInsertion(lib, row.payload, game, null, { x: 130, y: 170 });
      game = reducer(game, insertion.action);
      const coll = type === 'framework' ? 'frameworks' : type === 'template' ? 'subnodes' : 'nodes';
      const node = game[coll][insertion.selection.id];
      expect(node).toMatchObject({ x: 130, y: 170 });
      if (type === 'concept') node.sub.nodes.extra = { id: 'extra', title: 'Only in this game' };
      if (type === 'template') expect(node.parentRef).toBeNull();
    }
    expect(Object.keys(game.nodes)).toHaveLength(2);
    expect(Object.keys(game.frameworks)).toHaveLength(1);
    expect(Object.keys(game.subnodes)).toHaveLength(1);
    expect(JSON.stringify(lib)).toBe(original);
  });

  it('places manual references in the current nested canvas, without touching the root or master source', () => {
    const lib = makeLibrarySeed();
    let game = { ...makeEmptyProject('Nested'), nodes: { container: { id: 'container', kind: 'concept', sub: { nodes: {}, edges: [] } } } };
    const scope = { coll: 'nodes', parentPath: ['container'] };
    for (const type of ['framework', 'concept', 'structure']) {
      const item = storyWizardSources(lib).find(row => row.type === type);
      const insertion = storyToolInsertion(lib, item.payload, game, scope, { x: 50, y: 90 }, locateGraph(game, scope).nodes);
      game = reducer(game, insertion.action);
      expect(insertion.selection.scope).toEqual(scope);
      expect(locateGraph(game, scope).nodes[insertion.selection.id]).toBeTruthy();
    }
    expect(Object.keys(game.nodes)).toEqual(['container']);
    expect(Object.keys(game.frameworks)).toHaveLength(0);
    expect(Object.keys(game.nodes.container.sub.nodes)).toHaveLength(3);
  });
});
