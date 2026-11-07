import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import FlowCanvas from './FlowCanvas.jsx';
import CharacterRelationships, { RelationshipPicker } from './Relationships.jsx';

vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });
const game = { relationships: {}, nodes: { J: { id: 'J', kind: 'character', title: 'John', x: 80, y: 80 }, C: { id: 'C', kind: 'character', title: 'Carl', x: 500, y: 80 } } };
vi.mock('../state/store.jsx', () => ({ useGame: () => game, useDispatch: () => () => {} }));

describe('relationship controls', () => {
  it('shows a compact entry and an optional picker with visible creative vocabulary', () => {
    const brief = renderToStaticMarkup(<CharacterRelationships node={game.nodes.J} onPatch={() => {}} />);
    expect(brief).toContain('Relationships and loyalties');
    expect(brief).toContain('Add relationship');
    expect(brief).not.toContain('Father of');
    const picker = renderToStaticMarkup(<RelationshipPicker node={game.nodes.J} sourceRef={{ coll: 'nodes', nodeId: 'J' }} onClose={() => {}} />);
    expect(picker).toContain('Add a relationship · John');
    for (const word of ['Parent of', 'Ally of', 'Created by', 'Championed by', 'Custom relationship']) expect(picker).toContain(word);
    expect(picker).not.toContain('<select');
  });

  it('makes a shared connection label an accessible detail button while ordinary edges retain editing', () => {
    const html = renderToStaticMarkup(<FlowCanvas nodes={game.nodes} edges={[
      { from: 'J', to: 'C', label: 'Father of', relationshipId: 'family' },
      { from: 'C', to: 'J', label: 'A regular edge' },
    ]} colorOf={() => '#82c9b8'} iconOf={() => 'user'} onSelect={() => {}} onOpenRelationship={() => {}} onEditEdge={() => {}} onRemoveEdge={() => {}} />);
    expect(html).toContain('aria-label="Open relationship: John Father of Carl"');
    expect(html).toContain('relationship-edge-label');
    expect(html.match(/title="Remove connection"/g)).toHaveLength(1);
    expect(html).toContain('A regular edge');
  });
});
