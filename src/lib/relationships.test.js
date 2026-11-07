import { relationshipStoryTargets, relationshipEntity } from './relationships.js';
import { describe, expect, it } from 'vitest';
import { makeEmptyProject, migrateProject, makeLibrarySeed } from '../data/seed.js';
import { reducer } from '../state/reducer.js';
import { undoableReducer } from '../state/store.jsx';
import { characterExport } from './characterProfile.js';
import { wizardLibraryRecord } from './narrativeWizard.js';
import { RELATIONSHIP_WORDS, applyRelationshipWizardResult, createRelationship, legacyRelationshipRecord, relationshipCanvasEdges, relationshipEntities, relationshipView, relationshipsFor } from './relationships.js';

const ref = (id, parentPath = []) => ({ coll: 'nodes', parentPath, nodeId: id });
const fixture = () => ({ ...makeEmptyProject('Relationship test'), nodes: {
  J: { id: 'J', kind: 'character', title: 'John', body: 'Original writing.', x: 60, y: 80 },
  C: { id: 'C', kind: 'character', title: 'Carl', x: 440, y: 80 },
  D: { id: 'D', kind: 'concept', title: 'Dragon & the City', sub: { nodes: { C: { id: 'C', kind: 'character', title: 'The Glassmaker' } }, edges: [] } },
} });
const father = () => createRelationship({ id: 'father', fromRef: ref('J'), fromName: 'John', toRef: ref('C'), toName: 'Carl', word: 'father', reverseLabel: 'Son of', description: 'John expects obedience. Carl wants independence.' });
const add = (game, relation = father()) => reducer(game, { type: 'ADD_ENTITY', coll: 'relationships', entity: relation });

describe('shared game relationships', () => {
  it('stores one connection, reads it from both characters and refreshes labels/descriptions everywhere', () => {
    let game = add(fixture());
    expect(Object.keys(game.relationships)).toEqual(['father']);
    expect(relationshipsFor(game, ref('J'))[0]).toMatchObject({ label: 'Father of', targetName: 'Carl' });
    expect(relationshipsFor(game, ref('C'))[0]).toMatchObject({ label: 'Son of', targetName: 'John' });
    expect(game.nodes.J.characterFacts.relationships[0].relationshipId).toBe('father');
    expect(game.nodes.C.characterFacts.relationships[0].description).toContain('independence');
    game = reducer(game, { type: 'UPDATE_ENTITY', coll: 'relationships', id: 'father', patch: { description: 'They reconcile.', reverseLabel: 'Child of' } });
    expect(game.nodes.C.characterFacts.relationships[0].type).toBe('Child of');
    expect(game.nodes.J.characterFacts.relationships[0].description).toBe('They reconcile.');
    expect(characterExport(game.nodes.J, game, 'ai')).toContain('They reconcile.');
    expect(game.nodes.J.body).toBe('Original writing.');
  });

  it('finds nested entities without confusing matching IDs, and only draws edges on the appropriate canvas', () => {
    const game = add(fixture(), { ...father(), toRef: ref('C', ['D']), toName: 'The Glassmaker' });
    expect(relationshipEntities(game).filter(row => row.ref.nodeId === 'C')).toHaveLength(2);
    expect(relationshipsFor(game, ref('C'))).toEqual([]);
    expect(relationshipsFor(game, ref('C', ['D']))[0].targetName).toBe('John');
    expect(relationshipCanvasEdges(game, { coll: 'nodes' }, game.nodes)).toEqual([]);
    const root = add(fixture());
    expect(relationshipCanvasEdges(root, { coll: 'nodes' }, root.nodes)[0]).toMatchObject({ from: 'J', to: 'C', label: 'Father of', relationshipId: 'father' });
    const multiple = add(root, { ...father(), id: 'mentor', forwardLabel: 'Mentor of' });
    expect(relationshipCanvasEdges(multiple, { coll: 'nodes' }, multiple.nodes).map(edge => edge.curveOffset)).toEqual([-32, 32]);
  });

  it('keeps name-only ideas and directed feelings without inventing profiles or reciprocal trust', () => {
    const record = createRelationship({ id: 'trust', fromRef: ref('J'), fromName: 'John', toName: 'An unnamed apprentice', word: 'trust' });
    const game = add(fixture(), record);
    expect(record).toMatchObject({ toRef: null, forwardLabel: 'Trusts', reverseLabel: 'Trusted by' });
    expect(Object.keys(game.nodes)).toEqual(['J', 'C', 'D']);
    expect(RELATIONSHIP_WORDS.find(row => row.id === 'created').inverse).toBe('Creator of');
    const custom = createRelationship({ id: 'custom', fromRef: ref('J'), fromName: 'John', toName: 'Council', forwardLabel: 'Owes a favour to', reverseLabel: 'Is owed a favour by' });
    expect(custom.wordId).toBe('custom');
  });

  it('follows names, retains missing endpoints and restores a deleted connection with one Undo', () => {
    let game = add(fixture());
    game = reducer(game, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'C', patch: { title: 'Carl the Younger' } });
    expect(game.relationships.father.toName).toBe('Carl the Younger');
    const removedCharacter = reducer(game, { type: 'DELETE_NODE', nodeId: 'C' });
    expect(relationshipView(removedCharacter.relationships.father, removedCharacter)).toMatchObject({ targetName: 'Carl the Younger', missing: true });
    let history = { present: game, past: [] };
    history = undoableReducer(history, { type: 'DELETE_ENTITY', coll: 'relationships', id: 'father' });
    expect(history.present.nodes.J.characterFacts.relationships).toEqual([]);
    expect(history.present.nodes.C.characterFacts.relationships).toEqual([]);
    expect(undoableReducer(history, { type: 'UNDO' }).present.relationships.father.description).toContain('independence');
  });

  it('keeps rich relationship notes when creating an independent character library template', () => {
    const game = add(fixture());
    const template = wizardLibraryRecord(game.nodes.J, 'LIB-J').entity.template;
    expect(template.characterFacts.relationships[0]).toMatchObject({ type: 'Father of', name: 'Carl', targetId: null, description: game.relationships.father.description });
    expect(template.characterFacts.relationships[0].relationshipId).toBeUndefined();
    expect(game.nodes.J.characterFacts.relationships[0].relationshipId).toBe('father');
    expect(makeLibrarySeed().relationships).toBeUndefined();
    expect(migrateProject(JSON.parse(JSON.stringify(game))).relationships.father).toEqual(game.relationships.father);
  });

  it('retains orphaned template descriptions as independent named relationships instead of erasing them', () => {
    const game = fixture();
    game.nodes.J.characterFacts = { relationships: [{ id: 'old', relationshipId: 'other-game', type: 'Parent of', name: 'An old name', description: 'Retain this writing.' }] };
    const updated = reducer(game, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'J', patch: { title: 'John II' } });
    expect(updated.nodes.J.characterFacts.relationships[0]).toMatchObject({ name: 'An old name', description: 'Retain this writing.', targetId: null });
    expect(updated.nodes.J.characterFacts.relationships[0].relationshipId).toBeUndefined();
  });

  it('can develop legacy relationship rows without losing their writing or scoped target', () => {
    const game = fixture();
    const record = legacyRelationshipRecord(game, ref('C', ['D']), game.nodes.D.sub.nodes.C, { id: 'old', type: 'Rivals', name: 'John', description: 'They compete.' }, 'developed');
    expect(record).toMatchObject({ forwardLabel: 'Rival of', reverseLabel: 'Rival of', description: 'They compete.', toRef: null });
    expect(record.fromRef.parentPath).toEqual(['D']);
  });
});

describe('future relationship wizard results', () => {
  it('creates and connects a character as one undoable transaction', () => {
    const before = fixture();
    const record = createRelationship({ id: 'new', fromRef: ref('J'), fromName: 'John', toRef: ref('V'), toName: 'Victoria', word: 'rival' });
    const state = undoableReducer({ present: before, past: [] }, { type: 'BATCH', actions: [
      { type: 'GRAPH_ADD_NODE', scope: { coll: 'nodes' }, node: { id: 'V', kind: 'character', title: 'Victoria' } },
      { type: 'ADD_ENTITY', coll: 'relationships', entity: record },
    ] });
    expect(state.present.nodes.V.characterFacts.relationships[0]).toMatchObject({ type: 'Rival of', name: 'John' });
    expect(state.past).toHaveLength(1);
    expect(undoableReducer(state, { type: 'UNDO' }).present).toEqual(before);
  });
  it('retains the order of multiple framework inputs when an earlier questionnaire changes', () => {
    let record = applyRelationshipWizardResult({ ...father(), description: '' }, { sessionId: 'first', summary: 'First.' });
    record = applyRelationshipWizardResult(record, { sessionId: 'second', summary: 'Second.' });
    record = applyRelationshipWizardResult(record, { sessionId: 'first', summary: 'Revised first.' });
    expect(record.description).toBe('Revised first.\n\nSecond.');
    expect(record.wizardInputs.map(row => row.sessionId)).toEqual(['first', 'second']);
    expect(() => applyRelationshipWizardResult(record, { summary: 'No identity.' })).toThrow('sessionId');
  });
  it('keeps editable source sessions and protects manually edited descriptions when answers change', () => {
    const blank = { ...father(), description: '' };
    const input = { sessionId: 'bond-1', sourceId: 'relationship-framework', sourceLabel: 'Family bonds', questions: [{ key: 'need', prompt: 'What does each person need?' }], answers: { need: 'Respect.' }, summary: 'They need respect.' };
    const generated = applyRelationshipWizardResult(blank, input);
    expect(generated.description).toBe('They need respect.');
    const manual = { ...generated, description: 'They need respect. Carl also wants to leave.' };
    const revised = applyRelationshipWizardResult(manual, { ...input, answers: { need: 'Trust.' }, summary: 'They need trust.' });
    expect(revised.description).toBe(manual.description);
    expect(revised.pendingDescription).toBe('They need trust.');
    expect(revised.wizardInputs).toHaveLength(1);
    expect(revised.wizardInputs[0].answers.need).toBe('Trust.');
    expect(revised.forwardLabel).toBe('Father of');
    expect(revised.reverseLabel).toBe('Son of');
    expect(input.answers.need).toBe('Respect.');
  });
});


describe('story-only relationship choices', () => {
  it('excludes real teams and players from new choices while keeping old links resolvable', () => {
    const game = { nodes: { C: { id: 'C', kind: 'character', title: 'Moro' } }, teams: { T: { id: 'T', name: 'Team Steamraven' } }, players: { P: { id: 'P', name: 'Real person' } } };
    expect(relationshipStoryTargets(game).map(row => row.name)).toEqual(['Moro']);
    expect(relationshipEntity(game, { coll: 'teams', nodeId: 'T' }).name).toBe('Team Steamraven');
  });
});
