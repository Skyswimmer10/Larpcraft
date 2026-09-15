import { describe, expect, it } from 'vitest';
import { VICTORY_CONDITIONS, VICTORY_CONDITION_TYPES } from './victoryConditions.js';

const expectedNames = [
  'Victory Points from Game State',
  'Victory Points from Player Actions',
  'Temporary and Permanent Victory Points',
  'Victory Points as a Resource',
  'Hidden and Exposed Victory Point',
  'Endgame Bonuses',
  'Race',
  'Player Elimination',
  'Fixed Number of Rounds',
  'Exhausting Resources',
  'Completing Targets',
  'Fixed Number of Events',
  'Elapsed Real Time',
  'Connections',
  'Circuit Breaker, Sudden Death',
  'Finale',
  'King of Hill',
  'Catch the Leader',
  'Tug of War',
  'Highest Lowest',
  'Ordering',
];

describe('Victory Condition catalogue', () => {
  it('contains the 21 requested cards without visible numbering', () => {
    expect(VICTORY_CONDITION_TYPES).toEqual(expectedNames);
    expect(new Set(VICTORY_CONDITIONS.map((record) => record.id)).size).toBe(21);
    expect(VICTORY_CONDITIONS.every((record) => (
      record.kind === 'victory'
      && record.category === 'Victory Condition'
      && record.description
      && record.image?.dataUrl
      && Array.isArray(record.variations)
      && Array.isArray(record.effects)
    ))).toBe(true);
  });
});
