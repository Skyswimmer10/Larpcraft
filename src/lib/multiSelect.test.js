import { describe, expect, it } from 'vitest';
import { shiftToggleSelection } from './multiSelect.js';

describe('shiftToggleSelection', () => {
  it('keeps the active node and adds the Shift-clicked node', () => {
    expect([...shiftToggleSelection(new Set(), 'N1', 'N2')]).toEqual(['N1', 'N2']);
  });

  it('adds further nodes to an existing group', () => {
    expect([...shiftToggleSelection(new Set(['N1', 'N2']), 'N2', 'N3')]).toEqual(['N1', 'N2', 'N3']);
  });

  it('toggles an already selected node out of the group', () => {
    expect([...shiftToggleSelection(new Set(['N1', 'N2']), 'N2', 'N1')]).toEqual(['N2']);
  });
});
