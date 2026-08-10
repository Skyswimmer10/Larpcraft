import { describe, expect, it } from 'vitest';
import { applyFrameScale, resizeFrameOnly } from './frameScale.js';

describe('resizeFrameOnly', () => {
  it('accumulates the full drag while leaving contained objects out of the result', () => {
    expect(resizeFrameOnly(
      { x: 50, y: 60, w: 400, h: 260 },
      { x: 450, y: 320 },
      { x: 570, y: 390 },
    )).toEqual({ w: 520, h: 330 });
  });

  it('keeps circle frames square', () => {
    expect(resizeFrameOnly(
      { x: 10, y: 10, w: 120, h: 120 },
      { x: 130, y: 130 },
      { x: 180, y: 150 },
      { circle: true },
    )).toEqual({ w: 170, h: 170 });
  });
});

describe('applyFrameScale', () => {
  it('updates the frame and every supported contained collection', () => {
    const graph = {
      nodes: { n1: { id: 'n1', x: 20, y: 30, w: 200, h: 100 } },
      subnodes: { s1: { id: 's1', x: 40, y: 50 } },
      frameworks: {},
      frames: { f1: { id: 'f1', x: 0, y: 0, w: 400, h: 300 }, f2: { id: 'f2', x: 50, y: 60, w: 100, h: 80 } },
      numberMarkers: { m1: { id: 'm1', x: 70, y: 80 } },
      titleMarkers: { t1: { id: 't1', x: 90, y: 100, fontSize: 28 } },
    };
    const result = applyFrameScale(graph, 'f1', {
      frame: { x: 0, y: -100, w: 800, h: 400 },
      nodePatches: { n1: { x: 40, y: -60, w: 400, h: 133 }, s1: { x: 80, y: -33 } },
      framePatches: { f2: { x: 100, y: -20, w: 200, h: 107 } },
      numberMarkerPatches: { m1: { x: 140, y: 7, scale: 1.33 } },
      titleMarkerPatches: { t1: { x: 180, y: 33, fontSize: 37 } },
    });

    expect(result.frames.f1).toMatchObject({ y: -100, w: 800, h: 400 });
    expect(result.frames.f2).toMatchObject({ x: 100, y: -20, w: 200 });
    expect(result.nodes.n1).toMatchObject({ x: 40, y: -60, w: 400 });
    expect(result.subnodes.s1).toMatchObject({ x: 80, y: -33 });
    expect(result.numberMarkers.m1.scale).toBe(1.33);
    expect(result.titleMarkers.t1.fontSize).toBe(37);
  });

  it('leaves unknown target ids and unrelated records unchanged', () => {
    const graph = { frames: { f1: { id: 'f1', x: 0, y: 0, w: 200, h: 100 } }, nodes: { n1: { id: 'n1', x: 5, y: 5 } } };
    const result = applyFrameScale(graph, 'f1', {
      frame: { x: 0, y: 0, w: 300, h: 150 },
      nodePatches: { missing: { x: 99, y: 99 } },
    });
    expect(result.nodes.n1).toEqual(graph.nodes.n1);
    expect(result.nodes.missing).toBeUndefined();
  });
});
