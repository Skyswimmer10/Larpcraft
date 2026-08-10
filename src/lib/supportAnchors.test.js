import { describe, expect, it } from 'vitest';
import { resolveSupportGeometry } from './supportAnchors.js';

const entityPoints = {
  'node:N1:right': { x: 320, y: 150 },
  'title:T1:bottom': { x: 480, y: 240 },
};
const context = (supports = {}) => ({
  supports,
  resolveEntityAnchor: (anchor) => entityPoints[`${anchor.kind}:${anchor.id}:${anchor.side}`] || null,
});

describe('support endpoint anchors', () => {
  it('keeps line endpoints attached to node and title ports', () => {
    const spline = {
      id: 'S1', shape: 'spline', x: 10, y: 20, w: 100, h: 40,
      tailAnchor: { kind: 'node', id: 'N1', side: 'right' },
      headAnchor: { kind: 'title', id: 'T1', side: 'bottom' },
    };
    expect(resolveSupportGeometry(spline, context())).toEqual({ x: 320, y: 150, w: 160, h: 90 });
  });

  it('chains an endpoint to another spline or arrow endpoint', () => {
    const arrow = { id: 'A1', shape: 'arrow', x: 100, y: 80, w: 200, h: 60 };
    const spline = {
      id: 'S1', shape: 'spline', x: 10, y: 20, w: 100, h: 40,
      headAnchor: { kind: 'support', id: 'A1', endpoint: 'head' },
    };
    expect(resolveSupportGeometry(spline, context({ A1: arrow, S1: spline }))).toEqual({ x: 10, y: 20, w: 290, h: 120 });
  });

  it('falls back safely when support anchors form a cycle', () => {
    const a = { id: 'A', shape: 'arrow', x: 10, y: 20, w: 100, h: 0, headAnchor: { kind: 'support', id: 'B', endpoint: 'head' } };
    const b = { id: 'B', shape: 'spline', x: 200, y: 40, w: 100, h: 0, headAnchor: { kind: 'support', id: 'A', endpoint: 'head' } };
    expect(resolveSupportGeometry(a, context({ A: a, B: b }))).toEqual({ x: 10, y: 20, w: 100, h: 0 });
  });
});
