import { describe, expect, it } from 'vitest';
import { createCanvasClipboard, offsetCanvasClipboard, remapCanvasClipboard } from './canvasClipboard.js';

describe('canvas multi-node clipboard', () => {
  const nodes = {
    A: { id: 'A', kind: 'event', title: 'A', x: 10, y: 20, custom: { kept: true } },
    B: { id: 'B', kind: 'quest', title: 'B', x: 80, y: 90 },
    C: { id: 'C', kind: 'item', title: 'C', x: 200, y: 220 },
  };
  const edges = [{ from: 'A', to: 'B', label: 'inside' }, { from: 'B', to: 'C', label: 'outside' }];

  it('copies every selected node and only relationships internal to the selection', () => {
    const clipboard = createCanvasClipboard(nodes, edges, new Set(['A', 'B']));
    expect(clipboard.nodes.map((node) => node.id)).toEqual(['A', 'B']);
    expect(clipboard.edges).toEqual([{ from: 'A', to: 'B', label: 'inside' }]);
    expect(clipboard.nodes[0].custom).toEqual({ kept: true });
  });

  it('offsets the whole group equally and remaps node and edge ids', () => {
    const copied = createCanvasClipboard(nodes, edges, ['A', 'B']);
    const shifted = offsetCanvasClipboard(copied);
    const pasted = remapCanvasClipboard(shifted, { 'COPY-1': {} }, 'COPY-');
    expect(pasted.ids).toEqual(['COPY-2', 'COPY-3']);
    expect(pasted.nodes['COPY-2']).toMatchObject({ x: 38, y: 48, custom: { kept: true } });
    expect(pasted.nodes['COPY-3']).toMatchObject({ x: 108, y: 118 });
    expect(pasted.edges).toEqual([{ from: 'COPY-2', to: 'COPY-3', label: 'inside' }]);
  });
});
