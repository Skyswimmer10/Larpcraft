import { describe, expect, it } from 'vitest';
import { UNCERTAINTY_MECHANISMS, UNCERTAINTY_MECHANISM_TYPES } from './uncertaintyMechanisms.js';

const expectedNames = [
  'Betting and Bluffing',
  'Push Your Luck',
  'Memory',
  'Hidden Roles',
  'Roles with Asymmetric Information',
  'Communication Limits',
  'Unknown Information',
  'Hidden Information',
  'Probability Management',
  'Variable Setup',
  'Hidden Control',
  'Deduction',
  'Induction',
  'Questions and Answers',
];

describe('Uncertainty mechanism catalogue', () => {
  it('contains the 14 requested cards without visible numbering', () => {
    expect(UNCERTAINTY_MECHANISM_TYPES).toEqual(expectedNames);
    expect(new Set(UNCERTAINTY_MECHANISMS.map((record) => record.id)).size).toBe(14);
    expect(UNCERTAINTY_MECHANISMS.every((record) => (
      record.kind === 'uncertainty'
      && record.category === 'Uncertainty'
      && record.description
      && record.image?.dataUrl
      && Array.isArray(record.variations)
      && Array.isArray(record.effects)
    ))).toBe(true);
  });
});
