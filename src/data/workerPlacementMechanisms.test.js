import { describe, expect, it } from 'vitest';
import { WORKER_PLACEMENT_MECHANISMS, WORKER_PLACEMENT_MECHANISM_TYPES } from './workerPlacementMechanisms.js';

const expectedNames = [
  'Standard Worker Placement',
  'Workers of Differing Types',
  'Acquiring and Losing Workers',
  'Workers as Dice',
  'Adding and Blocking Buildings',
  'Single Workers',
  'Building Actions and Rewards',
  'Turn Order and Resolution Order',
];

describe('Worker Placement mechanism catalogue', () => {
  it('contains the eight requested cards without visible numbering', () => {
    expect(WORKER_PLACEMENT_MECHANISM_TYPES).toEqual(expectedNames);
    expect(new Set(WORKER_PLACEMENT_MECHANISMS.map((record) => record.id)).size).toBe(8);
    expect(WORKER_PLACEMENT_MECHANISMS.every((record) => (
      record.kind === 'workerPlacement'
      && record.category === 'Worker Placement'
      && record.description
      && record.image?.dataUrl
      && Array.isArray(record.variations)
      && Array.isArray(record.effects)
    ))).toBe(true);
  });
});
