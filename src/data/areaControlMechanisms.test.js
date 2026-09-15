import { describe, expect, it } from 'vitest';
import { AREA_CONTROL_MECHANISMS, AREA_CONTROL_MECHANISM_TYPES } from './areaControlMechanisms.js';

const expectedNames = [
  'Absolute Control',
  'Area Majority Influence',
  'Troop Types',
  'Territories and Regions',
  'Area Perimeters',
  'Force Projection',
  'Zone of Control',
  'Line of Sight',
];

describe('Area Control mechanism catalogue', () => {
  it('contains the eight requested cards without visible numbering', () => {
    expect(AREA_CONTROL_MECHANISM_TYPES).toEqual(expectedNames);
    expect(new Set(AREA_CONTROL_MECHANISMS.map((record) => record.id)).size).toBe(8);
    expect(AREA_CONTROL_MECHANISMS.every((record) => (
      record.kind === 'areaControl'
      && record.category === 'Area Control'
      && record.description
      && record.image?.dataUrl
      && Array.isArray(record.variations)
      && Array.isArray(record.effects)
    ))).toBe(true);
  });
});
