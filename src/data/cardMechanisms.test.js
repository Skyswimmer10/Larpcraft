import { describe, expect, it } from 'vitest';
import { CARD_MECHANISMS, CARD_MECHANISM_TYPES } from './cardMechanisms.js';

const expectedNames = [
  'Trick Taking',
  'Ladder Climbing',
  'Melding',
  'Card Draw Limits and Deck Exhaustion',
  'Deck Building',
  'Drafting',
  'Deck Construction',
  'Multi-Use Cards',
  'Tags',
];

describe('Card Mechanisms catalogue', () => {
  it('contains the nine requested cards without visible numbering', () => {
    expect(CARD_MECHANISM_TYPES).toEqual(expectedNames);
    expect(new Set(CARD_MECHANISMS.map((record) => record.id)).size).toBe(9);
    expect(CARD_MECHANISMS.every((record) => (
      record.kind === 'cardMechanism'
      && record.category === 'Card Mechanisms'
      && record.description
      && record.image?.dataUrl
      && Array.isArray(record.variations)
      && Array.isArray(record.effects)
    ))).toBe(true);
  });
});
