import { describe, expect, it } from 'vitest';
import { ACTION_PROBABILITY_RESOLUTIONS, ACTION_PROBABILITY_RESOLUTION_TYPES } from './actionProbability.js';

describe('Resolution catalogue', () => {
  it('contains all 26 resolution types without book codes', () => {
    expect(ACTION_PROBABILITY_RESOLUTION_TYPES).toHaveLength(26);
    expect(ACTION_PROBABILITY_RESOLUTION_TYPES[0]).toBe('High Number');
    expect(ACTION_PROBABILITY_RESOLUTION_TYPES.at(-1)).toBe('Neighbor Scope');
    expect(ACTION_PROBABILITY_RESOLUTION_TYPES.every((label) => !/^RES-\d+/i.test(label))).toBe(true);
    expect(ACTION_PROBABILITY_RESOLUTIONS.every((record) => (
      record.description && record.category && record.image?.dataUrl && record.kind === 'probability'
      && Array.isArray(record.variations) && Array.isArray(record.effects)
      && record.emotionalSpike === '' && record.imageScale === 1
      && record.imagePositionX === 0 && record.imagePositionY === 0
    ))).toBe(true);
  });
});
