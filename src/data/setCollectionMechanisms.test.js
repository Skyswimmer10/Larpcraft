import { describe, expect, it } from 'vitest';
import { SET_COLLECTION_MECHANISMS, SET_COLLECTION_MECHANISM_TYPES } from './setCollectionMechanisms.js';

const expectedNames = ['Set Valuation', 'Tile Laying', 'Grid Coverage', 'Network Building', 'Combo Abilities'];

describe('Set Collection mechanism catalogue', () => {
  it('contains the five requested cards without visible numbering', () => {
    expect(SET_COLLECTION_MECHANISM_TYPES).toEqual(expectedNames);
    expect(new Set(SET_COLLECTION_MECHANISMS.map((record) => record.id)).size).toBe(5);
    expect(SET_COLLECTION_MECHANISMS.every((record) => (
      record.kind === 'setCollection'
      && record.category === 'Set Collection'
      && record.description
      && record.image?.dataUrl
      && Array.isArray(record.variations)
      && Array.isArray(record.effects)
    ))).toBe(true);
  });
});
