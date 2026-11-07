import { describe, expect, it } from 'vitest';
import { createGroupResult, saveGroupResult, groupExport } from './groupProfile.js';
import { GROUP_FOUNDATIONS_ID, groupEntities, groupFactsText } from './groupFoundations.js';
import { characterSources, syncCharacterProfile } from './characterProfile.js';
import { createWizardNode, appendWizardResult, reviseWizardResult, wizardLibraryRecord } from './narrativeWizard.js';
import { savedWizardSession, savedWizardSessions } from './narrativeMemory.js';
import { BASE_NODE_TYPES, NARRATIVE_KINDS, makeEmptyProject, migrateProject, FRAMEWORK_TYPES } from '../data/seed.js';
import { reducer, locateGraph } from '../state/reducer.js';
import { undoableReducer } from '../state/store.jsx';
import { remapCanvasClipboard } from './canvasClipboard.js';
import { importNarrative } from '../state/bridge.js';
import { fateCharacterEntities } from './fateCharacter.js';
import { relationshipTargets } from './characterFacts.js';

const ref = (id, parents = [], coll = 'nodes') => ({ coll, path: [...parents, id] });
const make = patch => createGroupResult({ id: 'G', title: 'Lantern Guild', facts: { kind: 'Guild', size: 'About 80', purpose: 'Protect the caravan', members: [
  { id: 'm', name: 'Mira', role: 'Mediator', loyalty: 'Old council', ref: ref('C') }, { id: 'n', name: 'The absent founder', role: 'Founder', ref: null },
] }, answers: { 'origin:choice': 'A shared task | Mutual protection', 'rules:choice': 'Unwritten customs', 'pressures:choice': 'Resource shortages' }, ...patch });
const input = node => Object.values(node.sub.nodes).find(n => n.characterInput?.sessionId === node.narrativeWizard.sessionId);

describe('Group Foundations and narrative group profiles', () => {
  it('creates a first-class group with compact facts, conditional prose and a filled native input tree', () => {
    const node = make();
    expect(BASE_NODE_TYPES.group.label).toBe('Group / Institution'); expect(NARRATIVE_KINDS).toContain('group');
    expect(node.kind).toBe('group');
    expect(node.body).toContain('Lantern Guild is a guild.');
    expect(node.body).toContain('They came together through a shared task and mutual protection.');
    expect(node.body).toContain('Possible pressures include resource shortages.');
    expect(node.body).not.toContain('What brought them together?');
    expect(input(node).sub.nodes.origin.wizardAnswer).toBe('A shared task | Mutual protection');
    expect(Object.values(node.sub.nodes).some(n => n.groupRoster)).toBe(true);
    expect(node.groupFacts.members[0].ref).toEqual(ref('C'));
    expect(Object.values(node.sub.nodes).some(n => n.kind === 'character')).toBe(false);
    expect(syncCharacterProfile(node)).toBe(node);
  });

  it('updates the original session and layout while keeping extra nodes and manually edited prose', () => {
    const original = make(), child = input(original);
    child.x = 910; child.sub.nodes.rules.x = 705;
    child.sub.nodes.note = { id: 'note', kind: 'comment', body: 'Keep this note.' };
    original.characterProfile.manualDescription = 'My edited guild description.';
    original.body = original.description = 'My edited guild description.';
    const updated = saveGroupResult(original, { id: 'G', title: 'Lantern Guild', facts: original.groupFacts, answers: { 'rules:choice': 'Written rules' } }, original.narrativeWizard);
    expect(characterSources(updated)).toHaveLength(1);
    expect(input(updated).id).toBe(child.id);
    expect(input(updated).x).toBe(910); expect(input(updated).sub.nodes.rules.x).toBe(705);
    expect(input(updated).sub.nodes.note.body).toBe('Keep this note.');
    expect(updated.body).toBe('My edited guild description.');
    expect(updated.characterProfile.generated).toContain('Their conduct is shaped by written rules.');
    expect(savedWizardSession(updated, {}).answers['rules:choice']).toBe('Written rules');
  });

  it('combines optional concepts/frameworks without converting the group or replacing its foundation', () => {
    const group = make();
    const addition = createWizardNode({ id: 'W', title: 'Guild learning', source: FRAMEWORK_TYPES.kolbLearningCycle, type: 'framework', focus: 'relationship', questions: [{ key: 'experience', prompt: 'What happened?' }], answers: { experience: 'Members test a new route.' } });
    const combined = appendWizardResult(group, addition);
    expect(combined.kind).toBe('group'); expect(combined.groupFacts).toEqual(group.groupFacts);
    expect(savedWizardSessions(combined, {})).toHaveLength(2);
    expect(Object.values(combined.sub.nodes).filter(n => n.characterInput)).toHaveLength(2);
    expect(combined.body).toContain('Members test a new route.');
    const revised = reviseWizardResult(combined, createWizardNode({ id: 'W', title: 'Guild learning', source: FRAMEWORK_TYPES.kolbLearningCycle, type: 'framework', focus: 'relationship', questions: [{ key: 'experience', prompt: 'What happened?' }], answers: { experience: 'They test only during daylight.' } }), FRAMEWORK_TYPES.kolbLearningCycle);
    expect(revised.body).toContain('They test only during daylight.');
    expect(savedWizardSessions(revised, {})[0].record.sourceId).toBe(GROUP_FOUNDATIONS_ID);
  });

  it('propagates native-tree answer edits back into the saved wizard and group description', () => {
    const node = make(), child = input(node);
    const state = reducer({ ...makeEmptyProject(), nodes: { G: node } }, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'nodes', parentPath: ['G', child.id] }, id: 'rules', patch: { wizardAnswer: 'Written rules', body: 'Written rules' } });
    expect(savedWizardSession(state.nodes.G, {}).answers['rules:choice']).toBe('Written rules');
    expect(state.nodes.G.body).toContain('Their conduct is shaped by written rules.');
    expect(syncCharacterProfile(state.nodes.G)).toBe(state.nodes.G);
  });

  it('refreshes canonical member names in the same undo transaction and retains snapshots on deletion', () => {
    const initial = { ...makeEmptyProject(), nodes: { G: make(), C: { id: 'C', kind: 'character', title: 'Mira' } } };
    let history = { present: initial, past: [], undoGroup: null };
    history = undoableReducer(history, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'C', patch: { title: 'Mira Dawn' } });
    expect(history.present.nodes.G.groupFacts.members[0].name).toBe('Mira Dawn');
    expect(history.present.nodes.G.body).toContain('Mira Dawn (Mediator)');
    expect(undoableReducer(history, { type: 'UNDO' }).present).toEqual(initial);
    const deleted = reducer(history.present, { type: 'DELETE_NODE', id: 'C' });
    expect(deleted.nodes.G.groupFacts.members[0]).toMatchObject({ name: 'Mira Dawn', role: 'Mediator', loyalty: 'Old council' });
  });

  it('resolves repeated IDs in nested Master Act lanes and offers actual group profiles to characters', () => {
    const group = make({ facts: { members: [{ id: 'm', name: 'Mira', role: 'Leader', ref: ref('C', ['ACT', 'STORY'], 'masterNodes') }], relationships: [] } });
    const state = { ...makeEmptyProject(), nodes: { C: { id: 'C', kind: 'character', title: 'Wrong Mira' } }, masterNodes: { ACT: { sub: { nodes: { STORY: { sub: { nodes: { G: group, C: { id: 'C', kind: 'character', title: 'Mira' } }, edges: [] } } }, edges: [] } } } };
    const scope = { coll: 'masterNodes', parentPath: ['ACT', 'STORY'] };
    const changed = reducer(state, { type: 'GRAPH_UPDATE_NODE', scope, id: 'C', patch: { title: 'Right Mira' } });
    expect(locateGraph(changed, scope).nodes.G.groupFacts.members[0].name).toBe('Right Mira');
    expect(fateCharacterEntities(changed).some(e => e.type === 'group' && e.name === 'Lantern Guild')).toBe(true);
    expect(relationshipTargets(locateGraph(changed, scope)).some(e => e.id === 'G')).toBe(true);
    expect(groupEntities(changed).filter(e => e.name === 'Right Mira')).toHaveLength(1);
  });

  it('copies selected member references and detaches external members in independent library templates', () => {
    const group = make(), character = { id: 'C', kind: 'character', title: 'Mira' };
    const pasted = remapCanvasClipboard({ nodes: [group, character], edges: [] }, { G: group, C: character });
    expect(pasted.nodes[pasted.idMap.G].groupFacts.members[0].ref).toEqual(ref(pasted.idMap.C));
    const template = wizardLibraryRecord(group, 'LIB-G');
    expect(template.entity.template.groupFacts.members[0].ref).toBeNull();
    expect(template.entity.template.groupFacts.members[0].role).toBe('Mediator');
    const inserted = importNarrative({ narrative: { 'LIB-G': template.entity } }, makeEmptyProject(), 'LIB-G');
    expect(Object.values(inserted.nodes)[0].kind).toBe('group');
    expect(Object.values(inserted.nodes)[0].groupFacts.members[0].ref).toBeNull();
    expect(group.groupFacts.members[0].ref).toEqual(ref('C'));
  });

  it('remaps scoped member references only inside the copied graph', () => {
    const group = make({ facts: { members: [{ id: 'a', name: 'Inside', ref: ref('C', ['ACT','STORY'], 'masterNodes') }, { id: 'b', name: 'Outside', ref: ref('C') }] } });
    const pasted = remapCanvasClipboard({ nodes: [group, { id: 'C', kind: 'character' }], edges: [] }, {}, 'COPY-', { coll: 'masterNodes', parentPath: ['ACT','STORY'] });
    expect(pasted.nodes[pasted.idMap.G].groupFacts.members[0].ref).toEqual(ref(pasted.idMap.C, ['ACT','STORY'], 'masterNodes'));
    expect(pasted.nodes[pasted.idMap.G].groupFacts.members[1].ref).toBeNull();
  });

  it('keeps institution answers when disabled while excluding them from the description', () => {
    const node = make({ facts: { institution: false, members: [] }, answers: { mandate: 'Serve the crown.', succession: 'The council elects a master.' } });
    expect(node.body).not.toContain('Serve the crown');
    expect(savedWizardSession(node, {}).answers.mandate).toBe('Serve the crown.');
    const changed = reducer({ ...makeEmptyProject(), nodes: { G: node } }, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'nodes' }, id: 'G', patch: { groupFacts: { ...node.groupFacts, institution: true } } });
    expect(changed.nodes.G.body).toContain('Their mandate: Serve the crown.');
  });

  it('round-trips groups, editable sessions and unfinished drafts through migration', () => {
    const group = make();
    const draft = { id: 'draft', schemaVersion: 1, title: 'Another group', facts: group.groupFacts, answers: { bonds: 'Shared promises.' }, step: 'identity' };
    const state = reducer({ ...makeEmptyProject(), nodes: { G: group } }, { type: 'SAVE_GROUP_DRAFT', draft });
    const restored = migrateProject(JSON.parse(JSON.stringify(state)));
    expect(restored.nodes.G).toEqual(group); expect(restored.groupWizardDrafts.draft).toEqual(draft);
    expect(savedWizardSession(restored.nodes.G, {}).record.sourceId).toBe(GROUP_FOUNDATIONS_ID);
    expect(groupExport(restored.nodes.G, true)).toContain('What brought them together?');
    expect(groupFactsText(restored.nodes.G)).toContain('About 80');
    expect(reducer(restored, { type: 'REMOVE_GROUP_DRAFT', id: 'draft' }).groupWizardDrafts).toEqual({});
  });
});
