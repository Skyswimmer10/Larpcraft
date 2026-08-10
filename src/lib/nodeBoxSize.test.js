import { describe, expect, it } from 'vitest';
import {
  NODE_DEFAULT_HEIGHT,
  NODE_DEFAULT_WIDTH,
  NODE_MIN_HEIGHT,
  NODE_MIN_WIDTH,
  effectiveNodeBoxSize,
  normalizeNodeBoxDimension,
} from './nodeBoxSize.js';

describe('node box size', () => {
  it('reports effective defaults for legacy nodes without stored dimensions', () => {
    expect(effectiveNodeBoxSize({})).toEqual({ width: NODE_DEFAULT_WIDTH, height: NODE_DEFAULT_HEIGHT });
    expect(effectiveNodeBoxSize({}, { width: 360, height: 325 })).toEqual({ width: 360, height: 325 });
  });

  it('reports explicitly stored dimensions', () => {
    expect(effectiveNodeBoxSize({ w: 480, h: 260 })).toEqual({ width: 480, height: 260 });
  });

  it('uses the same minimum dimensions as drag resizing', () => {
    expect(normalizeNodeBoxDimension(20, 'width', 300)).toBe(NODE_MIN_WIDTH);
    expect(normalizeNodeBoxDimension(20, 'height', 200)).toBe(NODE_MIN_HEIGHT);
    expect(normalizeNodeBoxDimension('invalid', 'width', 300)).toBe(300);
  });
});
