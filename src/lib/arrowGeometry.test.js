import { describe, expect, it } from 'vitest';
import { arrowEndpointGeometry, splineControlOffset } from './arrowGeometry.js';

describe('arrowEndpointGeometry', () => {
  const arrow = { x: 100, y: 80, w: 200, h: 60 };

  it('moves the head while keeping the tail fixed', () => {
    expect(arrowEndpointGeometry(arrow, 'head', { x: 240, y: 210 })).toEqual({ x: 100, y: 80, w: 140, h: 130 });
  });

  it('moves the tail while keeping the head fixed', () => {
    expect(arrowEndpointGeometry(arrow, 'tail', { x: 40, y: 20 })).toEqual({ x: 40, y: 20, w: 260, h: 120 });
  });

  it('supports arrows pointing left and upward', () => {
    expect(arrowEndpointGeometry(arrow, 'head', { x: 20, y: 10 })).toEqual({ x: 100, y: 80, w: -80, h: -70 });
  });

  it('allows spline endpoints to land almost on top of one another', () => {
    expect(arrowEndpointGeometry(arrow, 'head', { x: 102, y: 81 }, 1)).toEqual({
      x: 100, y: 80, w: 2, h: 1,
    });
  });
});

describe('splineControlOffset', () => {
  it('stores the control handle relative to the line midpoint', () => {
    expect(splineControlOffset(
      { x: 100, y: 80, w: 200, h: 60 },
      { x: 240, y: 40 },
    )).toEqual({ curveX: 40, curveY: -70 });
  });
});
