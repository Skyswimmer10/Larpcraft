import { it, expect } from 'vitest';
import { actionMechanismNodePatch } from '../data/actionMechanics.js';
import { mechanismDraftFromNode } from '../data/mechanismCatalog.js';
import { migrateMechanicIO } from './mechanicIO.js';

it('reopens local mechanism edits and carries the three questions through detached snapshots', () => {
  const record = { id: 'M', kind: 'pattern', label: 'Matching', description: 'Library description', playerActions: 'Match cards', gameRules: 'One at a time', successCondition: 'All pairs match', effects: ['Reveal'] };
  const library = { actionPatternMechanisms: { M: record } };
  const node = { id: 'N', x: 10, sub: { nodes: { I: { id: 'I' } }, edges: [] }, ...actionMechanismNodePatch(record), body: 'Game description', playerActions: 'Match symbols' };
  const draft = mechanismDraftFromNode(library, node);
  expect(draft.description).toBe('Game description');
  expect(draft.playerActions).toBe('Match symbols');
  expect(draft.gameRules).toBe('One at a time');
  const patch = actionMechanismNodePatch(draft);
  expect(patch.successCondition).toBe('All pairs match');
  expect(patch).not.toHaveProperty('sub');
  expect(patch).not.toHaveProperty('id');
  patch.effects.push('Another effect');
  expect(record.description).toBe('Library description');
  expect(record.effects).toEqual(['Reveal']);
  expect(actionMechanismNodePatch({ id: 'X', kind: 'pattern' })).not.toHaveProperty('playerActions');
});

it('updates standard labels while preserving custom names and the two separate goals', () => {
  const data = { nodes: {
    A: { id: 'A', kind: 'mechanicSubnode', subnodeKind: 'failSafeScaffolding', title: 'Fail-Safe + Scaffolding Mod' },
    B: { id: 'B', kind: 'mechanicSubnode', subnodeKind: 'escalatingPressure', title: 'My finale countdown' },
    C: { id: 'C', mechKind: 'action', mechanicGoal: 'Score points' },
    D: { id: 'D', mechKind: 'goal', body: 'Open the gate' },
    E: { id: 'E', kind: 'mechanicSubnode', subnodeKind: 'progressiveFeedback', title: 'Progressive Feedback Mod' },
  }, edges: [] };
  const saved = migrateMechanicIO(data);
  expect(saved.nodes.A.title).toBe('Help when players get stuck');
  expect(saved.nodes.B.title).toBe('My finale countdown');
  expect(saved.nodes.C.mechanicGoal).toBe('Score points');
  expect(saved.nodes.D.body).toBe('Open the gate');
  expect(saved.nodes.E.title).toBe('Progressive Feedback Mod');
  expect(migrateMechanicIO(saved)).toEqual(saved);
});
