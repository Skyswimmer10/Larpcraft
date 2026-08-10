import { describe, expect, it } from 'vitest';
import { moveFrameContents } from './frameContents.js';

describe('moveFrameContents', () => {
  it('moves every support element contained by a frame', () => {
    const graph = {
      nodes: {},
      subnodes: {},
      frameworks: {},
      frames: {
        frame: { id: 'frame', x: 0, y: 0, w: 500, h: 400, sticky: true },
        circle: { id: 'circle', shape: 'circle', x: 40, y: 50, w: 80, h: 80 },
        arrow: { id: 'arrow', shape: 'arrow', x: 300, y: 220, w: -120, h: -60 },
      },
      numberMarkers: {
        number: { id: 'number', markerType: 'number', value: 1, x: 130, y: 90 },
        letter: { id: 'letter', markerType: 'letter', value: 'A', x: 170, y: 90 },
      },
      titleMarkers: { title: { id: 'title', text: 'Scene', x: 80, y: 250 } },
    };

    const result = moveFrameContents(graph, 'frame', 25, 35);

    expect(result.frames.frame).toMatchObject({ x: 25, y: 35 });
    expect(result.frames.circle).toMatchObject({ x: 65, y: 85 });
    expect(result.frames.arrow).toMatchObject({ x: 325, y: 255, w: -120, h: -60 });
    expect(result.numberMarkers.number).toMatchObject({ x: 155, y: 125 });
    expect(result.numberMarkers.letter).toMatchObject({ x: 195, y: 125 });
    expect(result.titleMarkers.title).toMatchObject({ x: 105, y: 285 });
  });

  it('does not move support elements outside the frame', () => {
    const graph = {
      frames: {
        frame: { id: 'frame', x: 0, y: 0, w: 200, h: 160, sticky: true },
        arrow: { id: 'arrow', shape: 'arrow', x: 150, y: 100, w: 100, h: 0 },
      },
      numberMarkers: { letter: { id: 'letter', markerType: 'letter', value: 'B', x: 240, y: 40 } },
      titleMarkers: { title: { id: 'title', text: 'Outside', x: 240, y: 90 } },
    };

    const result = moveFrameContents(graph, 'frame', 20, 10);

    expect(result.frames.arrow).toMatchObject({ x: 150, y: 100 });
    expect(result.numberMarkers.letter).toMatchObject({ x: 240, y: 40 });
    expect(result.titleMarkers.title).toMatchObject({ x: 240, y: 90 });
  });

  it('moves only the frame when stickiness is off by default', () => {
    const graph = {
      nodes: { node: { id: 'node', x: 40, y: 50 } },
      frames: {
        frame: { id: 'frame', x: 0, y: 0, w: 300, h: 240 },
        circle: { id: 'circle', shape: 'circle', x: 80, y: 100, w: 60, h: 60 },
      },
      numberMarkers: { number: { id: 'number', markerType: 'number', value: 1, x: 160, y: 120 } },
      titleMarkers: { title: { id: 'title', text: 'Scene', x: 90, y: 180 } },
    };

    const result = moveFrameContents(graph, 'frame', 25, 35);

    expect(result.frames.frame).toMatchObject({ x: 25, y: 35 });
    expect(result.frames.circle).toMatchObject({ x: 80, y: 100 });
    expect(result.nodes).toBeUndefined();
    expect(result.numberMarkers).toBeUndefined();
    expect(result.titleMarkers).toBeUndefined();
    expect(graph.nodes.node).toMatchObject({ x: 40, y: 50 });
    expect(graph.numberMarkers.number).toMatchObject({ x: 160, y: 120 });
    expect(graph.titleMarkers.title).toMatchObject({ x: 90, y: 180 });
  });
});
