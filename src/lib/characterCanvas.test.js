import { describe, expect, it } from 'vitest';
import { FRAMEWORK_TYPES, makeEmptyProject, migrateProject } from '../data/seed.js';
import { createWizardNode, appendWizardResult, reviseWizardResult, conceptQuestions } from './narrativeWizard.js';
import { adaptConceptGraph } from './narrativeGraph.js';
import { characterSources, syncCharacterProfile, characterInputSnapshot, characterProfilePatch } from './characterProfile.js';
import { savedWizardSession, savedWizardSessions } from './narrativeMemory.js';
import { reducer, locateGraph } from '../state/reducer.js';
import { undoableReducer } from '../state/store.jsx';
import { remapCanvasClipboard } from './canvasClipboard.js';

const make = (id = 'C', answer = 'A sudden bell.') => createWizardNode({ id, title: 'Uno', source: FRAMEWORK_TYPES.fate,
  type: 'framework', focus: 'character', questions: [{ key: 'signal', prompt: 'What catches their attention?' }], answers: { signal: answer } });
const inputs = node => Object.values(node.sub.nodes).filter(child => child.characterInput);
const note = child => Object.values(child.sub.nodes).find(n => n.wizardQuestionKey);
const concept = { id: 'SOURCE', name: 'Trust and place', nodes: {
  q: { id: 'q', kind: 'conceptQuestion', title: 'Who matters?', body: 'Consider their neighbours.', x: 35, y: 50, image: { dataUrl: 'data:image/test' } },
  nest: { id: 'nest', kind: 'concept', title: 'A place', sub: { nodes: { q: { id: 'q', kind: 'conceptQuestion', title: 'Where?', body: 'A home.' } }, edges: [] } },
}, edges: [{ from: 'q', to: 'nest' }], frames: { f: { id: 'f', label: 'Native frame' } }, numberMarkers: { m: { id: 'm', value: 1, attachedToNodeId: 'q' } } };
const conceptNode = () => createWizardNode({ id: 'CC', title: 'Uno', source: concept, type: 'concept', focus: 'character',
  questions: conceptQuestions(concept, 'character'), answers: { 'node:q': 'Their neighbours.', 'node:nest/q': 'A mountain village.', 'focus:subject': 'They offer shelter.' } });

describe('character inner canvas', () => {
  it('nests every saved session one level down, including two uses of the same framework', () => {
    const character = appendWizardResult(make(), make('SECOND', 'Quiet footsteps.'));
    const children = inputs(character);
    expect(children).toHaveLength(2);
    expect(children.map(child => child.kind)).toEqual(['framework', 'framework']);
    expect(children.map(child => child.characterInput.sessionId)).toEqual(['C:wizard', 'SECOND:wizard']);
    expect(children.map(child => note(child).body)).toEqual(['A sudden bell.', 'Quiet footsteps.']);
    expect(children.every(child => !child.narrativeWizard && !child.characterProfile)).toBe(true);
    expect(characterSources(character)).toHaveLength(2);
    expect(syncCharacterProfile(character)).toBe(character);
  });

  it('fills the original concept tree, nested questions, reference text and unmatched wizard answers', () => {
    const before = structuredClone(concept);
    const character = conceptNode(), child = inputs(character)[0];
    expect(child.kind).toBe('concept');
    expect(character.sub.nodes.q).toBeUndefined();
    expect(child.sub.nodes.q).toMatchObject({ x: 35, y: 50, wizardAnswer: 'Their neighbours.', wizardReferenceBody: 'Consider their neighbours.' });
    expect(child.sub.nodes.nest.sub.nodes.q.wizardAnswer).toBe('A mountain village.');
    expect(Object.values(child.sub.nodes).some(n => n.wizardAnswer === 'They offer shelter.')).toBe(true);
    expect(child.sub.edges).toEqual(concept.edges);
    expect(child.sub.frames).toEqual(concept.frames);
    expect(child.sub.numberMarkers).toEqual(concept.numberMarkers);
    expect(child.sub.nodes.q.image).toEqual(concept.nodes.q.image);
    expect(concept).toEqual(before);
  });

  it('revises exactly one saved session while keeping layout, other inputs, links and notes', () => {
    let character = appendWizardResult(make(), make('SECOND', 'Quiet footsteps.'));
    const second = inputs(character)[1], first = inputs(character)[0];
    second.x = 1010; note(second).x = 705;
    second.sub.nodes.extra = { id: 'extra', kind: 'comment', body: 'An authored note.' };
    second.sub.edges.push({ from: note(second).id, to: 'extra', label: 'Connects' });
    const record = savedWizardSessions(character, {})[1].record;
    const addition = make('EDIT', 'A sunrise bell.');
    character = reviseWizardResult({ ...character, narrativeWizard: record }, addition, FRAMEWORK_TYPES.fate);
    expect(inputs(character)[0]).toEqual(first);
    const updated = character.sub.nodes[second.id];
    expect(updated.x).toBe(1010);
    expect(note(updated).x).toBe(705);
    expect(note(updated).body).toBe('A sunrise bell.');
    expect(updated.sub.nodes.extra.body).toBe('An authored note.');
    expect(updated.sub.edges).toContainEqual({ from: note(second).id, to: 'extra', label: 'Connects' });
    expect(savedWizardSessions(character, {}).map(s => s.answers.signal)).toEqual(['A sudden bell.', 'A sunrise bell.']);
    expect(character.body).toContain('A sunrise bell.');
    expect(character.body).not.toContain('Quiet footsteps.');
  });

  it('feeds native answer edits back to the parent wizard and export in the same undo step', () => {
    const character = conceptNode(), child = inputs(character)[0];
    const original = { ...makeEmptyProject(), nodes: { CC: character } };
    let history = { present: original, past: [], undoGroup: null };
    history = undoableReducer(history, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'nodes', parentPath: ['CC', child.id, 'nest'] }, id: 'q', patch: { wizardAnswer: 'A harbour at sunrise.', body: 'A home.\n\nYour version: A harbour at sunrise.' } });
    let updated = history.present.nodes.CC;
    expect(savedWizardSession(updated, {}).answers['node:nest/q']).toBe('A harbour at sunrise.');
    expect(updated.body).toContain('A harbour at sunrise.');
    expect(updated.questions.find(q => q.id === updated.narrativeWizard.questionIds['node:nest/q']).answer).toBe('A harbour at sunrise.');
    expect(syncCharacterProfile(updated)).toBe(updated);
    // A later wizard edit must supersede that inner edit instead of reverting.
    const addition = createWizardNode({ id: 'EDIT', title: 'Uno', source: concept, type: 'concept', focus: 'character', questions: conceptQuestions(concept), answers: { 'node:nest/q': 'A forest clearing.' } });
    updated = reviseWizardResult(updated, addition, concept);
    expect(savedWizardSession(updated, {}).answers['node:nest/q']).toBe('A forest clearing.');
    expect(updated.sub.nodes[child.id].sub.nodes.nest.sub.nodes.q.wizardAnswer).toBe('A forest clearing.');
    expect(undoableReducer(history, { type: 'UNDO' }).present).toEqual(original);
  });

  it('materializes old flat concept characters only on explicit opening, preserving their entire authored graph', () => {
    const character = conceptNode();
    delete character.characterCanvas;
    character.sub = adaptConceptGraph(concept, [], conceptQuestions(concept), character.narrativeWizard.answers);
    character.sub.nodes.extra = { id: 'extra', kind: 'comment', body: 'Keep me', x: 790 };
    character.sub.nodes.q.x = 920;
    character.sub.edges.push({ from: 'q', to: 'extra' });
    delete character.narrativeWizard.attachedChildId;
    const before = structuredClone(character);
    const state = { ...makeEmptyProject(), nodes: { CC: character } };
    expect(reducer(state, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'CC', patch: { color: '#fff' } }).nodes.CC.characterCanvas).toBeUndefined();
    const updated = reducer(state, { type: 'MATERIALIZE_CHARACTER_INPUTS', id: 'CC' }).nodes.CC;
    const child = inputs(updated)[0];
    expect(child.sub.nodes.q.x).toBe(920);
    expect(child.sub.nodes.extra).toEqual(character.sub.nodes.extra);
    expect(child.sub.edges).toEqual(character.sub.edges);
    expect(child.sub.frames).toEqual(character.sub.frames);
    expect(updated.sub.nodes.q).toBeUndefined();
    expect(character).toEqual(before);
    expect(syncCharacterProfile(updated)).toBe(updated);
  });

  it('reuses legacy attached concept containers and retains links crossing the old tree boundary', () => {
    const first = conceptNode(), second = conceptNode();
    const record = { ...second.narrativeWizard, sessionId: 'other', attachedChildId: 'WIZ-1' };
    first.narrativeWizardHistory = [first.narrativeWizard, record];
    first.narrativeWizard = record;
    first.sub = { nodes: { ...concept.nodes, 'WIZ-1': { ...second, id: 'WIZ-1', x: 640 } }, edges: [{ from: 'q', to: 'WIZ-1' }] };
    const updated = syncCharacterProfile(first);
    expect(updated.sub.nodes['WIZ-1'].characterInput.sessionId).toBe('other');
    expect(updated.sub.nodes['WIZ-1'].x).toBe(640);
    expect(updated.sub.nodes.q).toEqual(first.sub.nodes.q);
    expect(updated.sub.edges).toEqual(first.sub.edges);
    expect(inputs(updated)).toHaveLength(2);
  });

  it('locates characters in Master Act story lanes and keeps saved sessions independent', () => {
    const character = make(); delete character.characterCanvas; delete character.sub;
    const state = { ...makeEmptyProject(), masterNodes: { ACT: { id: 'ACT', sub: { nodes: { STORY: { id: 'STORY', sub: { nodes: { C: character }, edges: [] } } }, edges: [] } } } };
    const scope = { coll: 'masterNodes', parentPath: ['ACT', 'STORY'] };
    let result = reducer(state, { type: 'MATERIALIZE_CHARACTER_INPUTS', scope, id: 'C' });
    const child = inputs(locateGraph(result, scope).nodes.C)[0];
    result = reducer(result, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'masterNodes', parentPath: ['ACT', 'STORY', 'C', child.id] }, id: note(child).id, patch: { body: 'A whispered name.' } });
    expect(locateGraph(result, scope).nodes.C.body).toContain('A whispered name.');
    expect(locateGraph(state, scope).nodes.C.body).toContain('A sudden bell.');
  });

  it('round-trips filled canvases and parent session bindings through migration and clipboard copies', () => {
    const original = appendWizardResult(make(), conceptNode());
    const persisted = migrateProject(JSON.parse(JSON.stringify({ ...makeEmptyProject(), nodes: { C: original } })));
    expect(persisted.nodes.C.sub).toEqual(original.sub);
    const copied = Object.values(remapCanvasClipboard({ nodes: [original], edges: [] }, { C: original }).nodes)[0];
    expect(inputs(copied).map(child => child.characterInput.sessionId)).toEqual(inputs(original).map(child => child.characterInput.sessionId));
    const record = savedWizardSessions(copied, {})[0].record;
    const revised = reviseWizardResult({ ...copied, narrativeWizard: record }, make('EDIT', 'A different bell.'), FRAMEWORK_TYPES.fate);
    expect(revised.body).toContain('A different bell.');
    expect(savedWizardSession(original, {}, original.narrativeWizardHistory[0]).answers.signal).toBe('A sudden bell.');
  });

  it('shows linked source contributions without breaking live input relationships', () => {
    const input = make('PEER');
    let character = characterProfilePatch(make(), { nodes: { PEER: input } }, { links: [{ nodeId: 'PEER', snapshot: characterInputSnapshot(input) }] });
    character = syncCharacterProfile(character, { nodes: { PEER: input } });
    expect(inputs(character)).toHaveLength(2);
    expect(inputs(character)[1].characterInput.linkedNodeId).toBe('PEER');
    expect(Object.values(inputs(character)[1].sub.nodes).some(n => n.wizardAnswer === 'A sudden bell.')).toBe(true);
    const view = inputs(character)[1]; view.x = 1530; note(view).x = 840;
    view.sub.nodes.extra = { id: 'extra', body: 'Keep this local note.' };
    const updatedInput = reviseWizardResult(input, make('PEER', 'A quiet chime.'), FRAMEWORK_TYPES.fate);
    const updated = syncCharacterProfile(character, { nodes: { PEER: updatedInput } });
    expect(inputs(updated)[1].x).toBe(1530);
    expect(note(inputs(updated)[1]).x).toBe(840);
    expect(note(inputs(updated)[1]).wizardAnswer).toBe('A quiet chime.');
    expect(inputs(updated)[1].sub.nodes.extra.body).toBe('Keep this local note.');
  });

  it('does not borrow answers from another framework when adding an empty session or clearing an answer', () => {
    let character = appendWizardResult(make(), make('EMPTY', ''));
    expect(savedWizardSessions(character, {}).map(session => session.answers.signal)).toEqual(['A sudden bell.', '']);
    character = reviseWizardResult({ ...character, narrativeWizard: savedWizardSessions(character, {})[0].record }, make('EDIT', ''), FRAMEWORK_TYPES.fate);
    expect(savedWizardSessions(character, {}).map(session => session.answers.signal)).toEqual(['', '']);
    expect(character.body).not.toContain('A sudden bell.');
    expect(syncCharacterProfile(character)).toBe(character);
  });

  it('hides a deleted view while preserving its session and restores it explicitly', () => {
    const character = make(), child = inputs(character)[0];
    let state = { ...makeEmptyProject(), nodes: { C: character } };
    state = reducer(state, { type: 'GRAPH_DELETE_NODE', scope: { coll: 'nodes', parentPath: ['C'] }, id: child.id });
    expect(inputs(state.nodes.C)).toHaveLength(0);
    expect(savedWizardSession(state.nodes.C, {}).answers.signal).toBe('A sudden bell.');
    expect(state.nodes.C.body).toContain('A sudden bell.');
    state = reducer(state, { type: 'MATERIALIZE_CHARACTER_INPUTS', id: 'C' });
    expect(inputs(state.nodes.C)).toHaveLength(0);
    state = reducer(state, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'nodes' }, id: 'C', patch: { characterCanvas: { version: 1, hidden: [] } } });
    expect(note(inputs(state.nodes.C)[0]).wizardAnswer).toBe('A sudden bell.');
  });
});
