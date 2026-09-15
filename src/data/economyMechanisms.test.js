import { describe, expect, it } from 'vitest';
import { ECONOMY_MECHANISMS, ECONOMY_MECHANISM_TYPES } from './economyMechanisms.js';

const expectedNames = [
  'Exchanging',
  'Trading',
  'Market',
  'Delayed Purchase',
  'Income',
  'Automatic Resource Growth',
  'Loans',
  'Always Available Purchases',
  'I Cut You, You Choose',
  'Discounts',
  'Upgrades',
  'Random Production',
  'Investment',
  'Ownership',
  'Contract',
  'Bribery',
  'Increase Value of Unchosen Resources',
  'Negotiation',
  'Alliances',
  'Resource Queue',
];

describe('Economy mechanism catalogue', () => {
  it('contains the 20 requested cards without visible numbering', () => {
    expect(ECONOMY_MECHANISM_TYPES).toEqual(expectedNames);
    expect(new Set(ECONOMY_MECHANISMS.map((record) => record.id)).size).toBe(20);
    expect(ECONOMY_MECHANISMS.every((record) => (
      record.kind === 'economy'
      && record.category === 'Economy'
      && record.description
      && record.image?.dataUrl
      && Array.isArray(record.variations)
      && Array.isArray(record.effects)
    ))).toBe(true);
  });
});
