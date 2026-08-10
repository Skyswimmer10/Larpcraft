import { describe, expect, it } from 'vitest';
import { includeGeneratedCharacterNodes, syncCharacterArchetypeGraph } from './characterArchetype.js';

const graph = () => ({
  nodes: {
    character: { id: 'character', kind: 'character', title: 'The Guide', x: 300, y: 220 },
    event: { id: 'event', kind: 'event', title: 'Arrival', x: 700, y: 400 },
  },
  edges: [{ from: 'event', to: 'character' }],
});

describe('character archetype canvas nodes', () => {
  it('creates two linked dark-side nodes when enabled', () => {
    const next = syncCharacterArchetypeGraph(graph(), 'character', {
      archetypeEnabled: true,
      archetypeDarkSideUp: 'Tyrant',
      archetypeDarkSideBack: 'Weakling',
    });

    const shadows = Object.values(next.nodes).filter((node) => node.generatedForCharacterId === 'character');
    expect(shadows).toHaveLength(6);
    expect(shadows.map((node) => node.title)).toEqual(expect.arrayContaining(['\u2191 Tyrant', '\u21a9 Weakling']));
    expect(next.edges.filter((edge) => edge.from === 'character' && shadows.some((node) => node.id === edge.to))).toHaveLength(5);
    expect(shadows.map((node) => node.title)).toEqual(expect.arrayContaining(['This is you when', 'You say', 'Your gift to others']));
    const combinations = shadows.find((node) => node.kind === 'characterArchetypeCombinations');
    expect(combinations).toMatchObject({ title: 'The Guide', w: 620, h: 455 });
    expect(combinations.combinations).toHaveLength(8);
    expect(combinations.combinations.every((row) => row.base === 'The Guide' && row.plus === '' && row.result === '')).toBe(true);
    expect(next.edges.some((edge) => edge.to === combinations.id || edge.from === combinations.id)).toBe(false);
  });

  it('updates labels without resetting a moved shadow node', () => {
    const enabled = syncCharacterArchetypeGraph(graph(), 'character', { archetypeEnabled: true });
    const up = Object.values(enabled.nodes).find((node) => node.shadowDirection === 'up');
    expect(up).toMatchObject({ title: '\u2191 Excessive, Pushed Too Far, Dark Side', body: '' });
    enabled.nodes[up.id] = { ...up, x: 999, y: 777 };

    const next = syncCharacterArchetypeGraph(enabled, 'character', { archetypeDarkSideUp: 'Despot' });
    expect(next.nodes[up.id]).toMatchObject({ title: '\u2191 Despot', x: 999, y: 777 });
  });

  it('removes only generated shadows and their connections when disabled', () => {
    const enabled = syncCharacterArchetypeGraph(graph(), 'character', { archetypeEnabled: true });
    const next = syncCharacterArchetypeGraph(enabled, 'character', { archetypeEnabled: false });

    expect(Object.values(next.nodes).some((node) => node.generatedForCharacterId === 'character')).toBe(false);
    expect(next.nodes.event).toBeTruthy();
    expect(next.edges).toEqual([{ from: 'event', to: 'character' }]);
  });

  it('includes generated shadows when deleting their character', () => {
    const enabled = syncCharacterArchetypeGraph(graph(), 'character', { archetypeEnabled: true });
    const removed = includeGeneratedCharacterNodes(enabled.nodes, ['character']);
    expect(removed.size).toBe(7);
    expect(removed.has('event')).toBe(false);
  });
});
