import { describe, expect, it } from 'vitest';
import { makeLibrarySeed } from '../data/seed.js';
import { buildMechanicsPaletteGroups, mechanicsPayloadToNode } from './palette.js';
import { mechanicWizardGraph, searchToolbox, toolboxCategories, toolboxPreferences, visibleToolboxCategories } from './toolbox.js';
import { reducer } from '../state/reducer.js';

describe('mechanics toolbox', () => {
  const lib = makeLibrarySeed();
  const groups = buildMechanicsPaletteGroups(lib, { includeTemplates: true });
  const categories = toolboxCategories(groups, lib);

  it('keeps every offered tool searchable while applying pins independently of work areas', () => {
    const original = groups.flatMap(group => group.items.map(item => item.id)).sort();
    expect(searchToolbox(categories, '').map(item => item.id).sort()).toEqual(original);
    const preferences = toolboxPreferences({ pinned: { core: false, notes: true } });
    expect(visibleToolboxCategories(categories, preferences).map(category => category.id)).not.toContain('core');
    expect(visibleToolboxCategories(categories, { ...preferences, area: 'prepare' }).map(category => category.id)).toContain('notes');
    expect(visibleToolboxCategories(categories, { ...preferences, area: 'equip' }).map(category => category.id)).toEqual(['props']);
    expect(visibleToolboxCategories(categories, preferences).map(category => category.id)).not.toContain('core');
    const goal = searchToolbox(categories, 'Goal').find(item => item.categoryId === 'core');
    expect(goal).toBeDefined();
    expect(preferences.pinned.core).toBe(false);
  });

  it('places instructions and saved/custom notes in useful categories without hiding new library entries', () => {
    const customLib = { ...lib, mechSubnodes: { ...lib.mechSubnodes, CUSTOM: { id: 'CUSTOM', kind: 'comment', name: 'My new comment', category: 'supporting' } } };
    const all = toolboxCategories(buildMechanicsPaletteGroups(customLib), customLib);
    expect(all.find(category => category.id === 'instructions').items.some(item => item.label === 'Instructions for players')).toBe(true);
    expect(all.find(category => category.id === 'comments').items.some(item => item.id === 'msub:CUSTOM')).toBe(true);
    expect(all.find(category => category.id === 'core').items.some(item => item.label === 'Instructions for players')).toBe(false);
    expect(searchToolbox(all, 'my new').map(item => item.id)).toEqual(['msub:CUSTOM']);
  });

  it('recovers defaults from invalid or older preferences', () => {
    expect(toolboxPreferences({ area: 'missing', pinned: { core: 'false', notes: false } })).toEqual(toolboxPreferences());
    expect(toolboxPreferences(null).area).toBe('build');
  });

  it('creates no sample nodes when adding a blank mechanic container', () => {
    const node = mechanicsPayloadToNode('mech:LIB-MPRIM-TASK-TEMPLATE', lib);
    expect(node.sub.nodes).toEqual({});
    expect(node.sub.edges).toEqual([]);
  });

  it('appends wizard answers inside the chosen graph without changing existing content', () => {
    const original = { WIZ1: { id: 'WIZ1', body: 'Keep me' } };
    const answers = { goal: 'Open the gate', actions: 'Match the symbols', rules: 'One symbol each', success: 'All symbols match' };
    const additions = mechanicWizardGraph(answers, original, { x: 500, y: 300 });
    expect(Object.keys(additions.nodes)).toHaveLength(4);
    expect(Object.keys(additions.nodes)).not.toContain('WIZ1');
    expect(additions.edges).toHaveLength(3);
    expect(Object.values(additions.nodes)[0]).toMatchObject({ mechKind: 'goal', body: answers.goal, x: 500, y: 300 });
    const scope = { coll: 'taskNodes', parentPath: ['P'] };
    const state = { taskNodes: { P: { id: 'P', sub: { nodes: original, edges: [] } } } };
    const result = reducer(state, { type: 'BATCH', actions: [
      ...Object.values(additions.nodes).map(node => ({ type: 'GRAPH_ADD_NODE', scope, node })),
      ...additions.edges.map(edge => ({ type: 'GRAPH_ADD_EDGE', scope, ...edge })),
    ] });
    expect(result.taskNodes.P.sub.nodes.WIZ1).toEqual(original.WIZ1);
    expect(Object.keys(result.taskNodes.P.sub.nodes)).toHaveLength(5);
    expect(state.taskNodes.P.sub.nodes).toEqual(original);
    expect(mechanicWizardGraph({ goal: '  ', rules: 'One try' }).edges).toEqual([]);
    expect(mechanicWizardGraph({}).nodes).toEqual({});
  });
});
