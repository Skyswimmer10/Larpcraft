import { describe, expect, it } from 'vitest';
import { MOVEMENT_MECHANISMS, MOVEMENT_MECHANISM_TYPES } from './movementMechanisms.js';

const expectedNames = [
  'Tessellation',
  'Roll and Move',
  'Pattern Movement',
  'Movement Points',
  'Resource to Move',
  'Measurement',
  'Different Dice',
  'Drift',
  'Impulse',
  'Programmed Movement',
  'Relative Position',
  'Manacla',
  'Chaining',
  'Bias',
  'Moving Multiple Units',
  'Map Addition',
  'Map Production',
  'Map Deformation',
  'Move Through Deck',
  'Movement Tempo',
  'Pieces as Map',
  'Multiple Maps',
  'Shortcuts',
  'Hidden Movement',
];

describe('Movement mechanism catalogue', () => {
  it('contains the 24 requested cards without visible numbering', () => {
    expect(MOVEMENT_MECHANISM_TYPES).toEqual(expectedNames);
    expect(new Set(MOVEMENT_MECHANISMS.map((record) => record.id)).size).toBe(24);
    expect(MOVEMENT_MECHANISMS.every((record) => (
      record.kind === 'movement'
      && record.category === 'Movement'
      && record.description
      && record.image?.dataUrl
      && Array.isArray(record.variations)
      && Array.isArray(record.effects)
    ))).toBe(true);
  });
});
