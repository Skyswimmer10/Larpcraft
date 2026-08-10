import { describe, expect, it } from 'vitest';
import { buildNarrativeLinkInsertion, createLinkingNode, resolveNarrativeLink } from './narrativeLinks.js';

const lib = {
  narrative: { N1: { id: 'N1', nodeClass: 'base', nodeKind: 'event', name: 'Arrival', body: 'The team arrives.', color: '#123456', template: { kind: 'event', body: 'Full arrival.' } } },
  concepts: { C1: { id: 'C1', category: 'storyConcept', name: 'Trust', description: 'Trust under pressure.', nodes: { Q1: { id: 'Q1', kind: 'event', title: 'Test', x: 10, y: 20 } }, edges: [] } },
  stories: { S1: { id: 'S1', name: 'Three Acts', description: 'A compact arc.', nodes: { A1: { id: 'A1', kind: 'event', title: 'Act I', x: 10, y: 20 } }, edges: [] } },
};

describe('narrative links', () => {
  it('creates an unassigned linking node', () => {
    const node = createLinkingNode({}, { x: 20, y: 30 });
    expect(node.kind).toBe('linkingNode');
    expect(node.linkTarget).toEqual({ type: 'narrative', id: null });
  });

  it('resolves a live library target', () => {
    expect(resolveNarrativeLink(lib, { type: 'concepts', id: 'C1' })?.label).toBe('Trust');
    expect(resolveNarrativeLink(lib, { type: 'concepts', id: 'missing' })).toBeNull();
  });

  it('inserts concepts and structures as one container with internals one level down', () => {
    const concept = buildNarrativeLinkInsertion(lib, { type: 'concepts', id: 'C1' }, {}, { x: 100, y: 120 });
    const story = buildNarrativeLinkInsertion(lib, { type: 'stories', id: 'S1' }, { INS_1: {} }, { x: 200, y: 220 }, 'INS_');
    expect(concept.kind).toBe('concept');
    expect(Object.keys(concept.sub.nodes)).toEqual(['Q1']);
    expect(story.kind).toBe('storyStructureContainer');
    expect(Object.keys(story.sub.nodes)).toEqual(['A1']);
    expect(story.id).toBe('INS_2');
  });

  it('inserts an individual template as one ordinary node', () => {
    const node = buildNarrativeLinkInsertion(lib, { type: 'narrative', id: 'N1' }, {}, { x: 4, y: 8 });
    expect(node).toMatchObject({ kind: 'event', title: 'Arrival', body: 'Full arrival.', x: 4, y: 8 });
    expect(node.sub).toBeUndefined();
  });
});
