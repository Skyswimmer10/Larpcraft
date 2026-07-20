import { describe, expect, it } from 'vitest';
import { findEmptyFrameSpot } from './canvasPlacement.js';

describe('findEmptyFrameSpot', () => {
  it('uses the requested start when it is clear', () => {
    expect(findEmptyFrameSpot({}, { x: 50, y: 60, w: 300, h: 180 })).toEqual({ x: 50, y: 60 });
  });

  it('skips positions that overlap existing nodes', () => {
    const pos = findEmptyFrameSpot({
      nodes: {
        A: { id: 'A', x: 70, y: 70, w: 236, h: 130 },
      },
    }, { x: 70, y: 70, w: 360, h: 220, padding: 24, stepX: 420, stepY: 280 });
    expect(pos).not.toEqual({ x: 70, y: 70 });
  });

  it('falls below occupied content when the scan area is full', () => {
    const pos = findEmptyFrameSpot({
      nodes: {
        A: { id: 'A', x: 0, y: 0, w: 500, h: 500 },
      },
    }, { x: 0, y: 0, w: 300, h: 180, padding: 20, maxCols: 1, maxRows: 1 });
    expect(pos).toEqual({ x: 0, y: 520 });
  });
});
