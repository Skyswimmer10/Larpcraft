import { describe, expect, it } from 'vitest';
import {
  MARKER_LETTERS,
  nextVisualMarkerValue,
  visualMarkerAttachment,
  visualMarkerPixelSize,
  visualMarkerPosition,
  visualMarkerScaleFromPixels,
} from './visualMarkers.js';

describe('visual markers', () => {
  it('offers the complete A through Z alphabet', () => {
    expect(MARKER_LETTERS).toHaveLength(26);
    expect(MARKER_LETTERS[0]).toBe('A');
    expect(MARKER_LETTERS[25]).toBe('Z');
  });

  it('selects the first unused letter independently of number markers', () => {
    const markers = {
      n1: { value: 8 },
      a: { markerType: 'letter', value: 'A' },
      c: { markerType: 'letter', value: 'C' },
    };
    expect(nextVisualMarkerValue(markers, 'letter')).toBe('B');
    expect(nextVisualMarkerValue(markers, 'number')).toBe(9);
  });

  it('positions an attached marker relative to its node', () => {
    expect(visualMarkerPosition(
      { x: 10, y: 20, attachedToNodeId: 'N1', attachmentOffsetX: 24, attachmentOffsetY: 18 },
      { N1: { x: 200, y: 120 } },
    )).toEqual({ x: 224, y: 138 });
  });

  it('attaches when the marker center is over a node and detaches outside', () => {
    const nodes = [{ id: 'N1', x: 100, y: 80, w: 220, h: 140 }];
    expect(visualMarkerAttachment({ x: 120, y: 90 }, 34, nodes)).toEqual({
      attachedToNodeId: 'N1', attachmentOffsetX: 20, attachmentOffsetY: 10,
    });
    expect(visualMarkerAttachment({ x: 20, y: 20 }, 34, nodes)).toBeNull();
  });

  it('converts marker scale to editable pixel size and back', () => {
    expect(visualMarkerPixelSize({ scale: 2 })).toBe(68);
    expect(visualMarkerScaleFromPixels(102)).toBe(3);
    expect(visualMarkerScaleFromPixels(999)).toBeCloseTo(240 / 34, 4);
  });
});
