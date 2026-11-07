import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Inspector from './Inspector.jsx';
import { makeEmptyProject, makeLibrarySeed, SUBNODE_BLANK } from '../data/seed.js';

const fixture = vi.hoisted(() => ({ game: null, library: null }));
vi.mock('../state/store.jsx', () => ({ useGame: () => fixture.game, useLibrary: () => fixture.library, useDispatch: () => () => {}, useLibraryDispatch: () => () => {} }));
vi.mock('./NarrativeWizard.jsx', () => ({ NarrativeWizardButton: () => null }));

describe('Story Beat inspector layout', () => {
  beforeEach(() => {
    const beat = { id: 'B', kind: 'storyBeat', title: 'Water crisis', body: 'The well is poisoned.', teamId: null, sets: [{ factId: 'F' }], mechanicIds: [], storyBeat: { sections: ['objective'], objective: 'Find the source.' } };
    fixture.game = { ...makeEmptyProject('Inspector test'), nodes: { B: beat }, subnodes: { V: { ...SUBNODE_BLANK('V', 'value'), parentRef: { nodeId: 'B' } } }, taskNodes: { T: { id: 'T', kind: 'task', sub: { nodes: { B: beat }, edges: [] } } }, facts: { F: { id: 'F', name: 'Cipher key', kind: 'knowledge' } } };
    fixture.library = makeLibrarySeed();
  });

  it.each([{ kind: 'node', id: 'B' }, { kind: 'graphnode', id: 'B', scope: { coll: 'taskNodes', parentPath: ['T'] } }])('keeps the identity visible and image compact in $kind inspectors', selection => {
    const html = renderToStaticMarkup(<Inspector selection={selection} onSelect={() => {}} />);
    expect(html).toContain('aria-label="Story Beat identity"');
    expect(html).toContain('story-beat-image');
    expect(html).toContain('Beat image · optional');
    expect(html).toContain('story-beat-section-launch');
    expect(html.indexOf('story-beat-identity')).toBeLessThan(html.indexOf('story-beat-impact-launch'));
    expect(html).not.toContain('Core Identity'); expect(html).not.toContain('Main Content');
    expect(html).not.toContain('Find the source.');
    expect(html).not.toContain('Records facts'); expect(html).not.toContain('record a fact');
    expect(html).not.toContain('Composition · 1 attached');
  });
});
