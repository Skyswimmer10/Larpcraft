import { it, expect } from 'vitest';
import { migrateMechanicIO, addMechanicChild } from './mechanicIO.js';

it('preserves both sensor conditions and output prose and attaches legacy operational notes once', () => {
  const original = { nodes: {
    S: { id: 'S', mechKind: 'sensorNode', inputRequired: 'Valid tag', triggerCondition: 'After briefing', manualOverrideFallback: 'GM checks tag' },
    A: { id: 'A', mechKind: 'actuatorNode', outputIntensity: 'Courtyard volume', outputRhythm: 'Two buzzes', outputSequence: 'Then silence', resetBehavior: 'Reset switch' },
  }, edges: [{ from: 'S', to: 'A' }] };
  const migrated = migrateMechanicIO(original);
  expect(migrated.nodes.S.firingCondition).toBe('Valid tag\nAfter briefing');
  expect(migrated.nodes.A.outputBehaviour).toBe('Courtyard volume\nTwo buzzes\nThen silence');
  expect(migrated.nodes['S-IO-NOTE'].ioNodeIds).toEqual(['S', 'A']);
  expect(migrated.nodes['A-IO-NOTE'].fields.facilitatorGuidance).toContain('Reset switch');
  expect(migrateMechanicIO(migrated)).toEqual(migrated);
  expect(original.nodes.S.firingCondition).toBeUndefined();
});

it('adds child I/O without overwriting mechanics and connects a fallback note to both children', () => {
  let node = { id: 'M', mechKind: 'action', sub: { nodes: { old: { id: 'old' } }, edges: [] } };
  for (const kind of ['sensorNode', 'fallback', 'actuatorNode']) node = { ...node, ...addMechanicChild(node, kind) };
  expect(node.sub.nodes.old).toEqual({ id: 'old' });
  expect(node.sub.nodes['IO-2'].ioNodeIds).toEqual(['IO-1', 'IO-3']);
  expect(node.sub.edges).toHaveLength(2);
});
