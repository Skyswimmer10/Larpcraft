import { describe, expect, it } from 'vitest';
import { FRAMEWORK_TYPES, makeEmptyProject } from '../data/seed.js';
import { createFateDraft, editFate, fateAnswers, fateQuestions } from './fateWizard.js';
import { createWizardNode, appendWizardResult, reviseWizardResult, wizardLibraryRecord } from './narrativeWizard.js';
import { characterSources, characterExport, characterInputSnapshot, characterProfilePatch, syncCharacterProfile, enableCharacterProfile, characterWizardRecords, resolveCharacterPassage } from './characterProfile.js';
import { savedWizardSessions } from './narrativeMemory.js';
import { reducer } from '../state/reducer.js';
import { undoableReducer } from '../state/store.jsx';
import { createCanvasClipboard, remapCanvasClipboard } from './canvasClipboard.js';
import { importNarrative } from '../state/bridge.js';

function emotionalCharacter(text, id = 'C') {
  let draft = createFateDraft({ purpose: 'character' });
  draft = editFate(draft, 'emotion.anchor', text);
  return createWizardNode({ source: FRAMEWORK_TYPES.fate, type: 'framework', title: 'Mira', focus: 'character', id,
    questions: fateQuestions(draft), answers: fateAnswers(draft), fateDraft: draft });
}
const conceptSource = { id: 'original', name: 'A promise', category: 'characterConcept', questions: [{ key: 'promise', label: 'What promise matters?' }], nodes: {}, edges: [] };
const promise = (answer, id = 'P') => createWizardNode({ source: conceptSource, type: 'concept', title: 'A promise', focus: 'character', id,
  questions: [{ key: 'promise', prompt: 'What promise matters?' }], answers: { promise: answer } });
const stateWith = nodes => ({ ...makeEmptyProject(), nodes, edges: [] });

describe('living character descriptions', () => {
  it('reopens several optional inputs and updates only the revised source without duplicating old traits', () => {
    const before = appendWizardResult(emotionalCharacter('They are angry all the time.'), promise('They promised to protect their sister.'));
    const sessions = savedWizardSessions(before, { concepts: {} });
    expect(sessions).toHaveLength(2);
    const fate = sessions.find(session => session.record.sourceId === 'fate');
    const after = reviseWizardResult({ ...before, narrativeWizard: fate.record }, emotionalCharacter('They feel anger only at sunrise.'), FRAMEWORK_TYPES.fate);
    expect(after.title).toBe('Mira');
    expect(after.body).toContain('only at sunrise');
    expect(after.body).not.toContain('all the time');
    expect(after.body).toContain('protect their sister');
    expect(after.body).not.toContain('What promise matters?');
    expect(savedWizardSessions(after, {})).toHaveLength(2);
    expect(characterExport(after, {}, 'ai')).toContain('only at sunrise');
    expect(characterExport(after, {}, 'ai')).not.toContain('all the time');
  });

  it('keeps separate sessions and answer IDs when adding the same framework twice', () => {
    const first = emotionalCharacter('They fear enclosed spaces.');
    const next = appendWizardResult(first, emotionalCharacter('They feel relief outdoors.'));
    const sessions = savedWizardSessions(next, {});
    expect(sessions).toHaveLength(2);
    expect(new Set(next.questions.map(row => row.id)).size).toBe(next.questions.length);
    expect(new Set(characterWizardRecords(next).map(row => row.sessionId)).size).toBe(2);
    const changed = reviseWizardResult({ ...next, narrativeWizard: sessions[0].record }, emotionalCharacter('They fear sudden noises.'), FRAMEWORK_TYPES.fate);
    expect(changed.body).toContain('sudden noises');
    expect(changed.body).toContain('relief outdoors');
    expect(changed.body).not.toContain('enclosed spaces');
  });

  it('retains an editable concept snapshot when its library template is changed or deleted', () => {
    const node = promise('They keep their word even when afraid.');
    const changedLibrary = { concepts: { original: { ...conceptSource, questions: [], name: 'Changed template' } } };
    expect(savedWizardSessions(node, changedLibrary)[0].source.name).toBe('A promise');
    expect(savedWizardSessions(node, {})[0].answers.promise).toContain('keep their word');
    expect(conceptSource.questions[0].label).toBe('What promise matters?');
    expect(wizardLibraryRecord(node, 'LIB-NAR-1').entity.template.characterProfile).toBeTruthy();
  });

  it('propagates an accepted live source change into character text and export in one undoable edit', () => {
    const input = { id: 'INPUT', kind: 'concept', title: 'A promise', body: 'They help strangers.' };
    const active = characterProfilePatch({ id: 'C', kind: 'character', title: 'Mira', body: '' }, { nodes: { INPUT: input } }, { links: [{ nodeId: 'INPUT', snapshot: characterInputSnapshot(input) }] });
    const initial = { present: stateWith({ C: active, INPUT: input }), past: [], undoGroup: null };
    const changed = undoableReducer(initial, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'INPUT', patch: { body: 'They help strangers only after hearing their story.' } });
    expect(changed.present.nodes.C.body).toContain('after hearing their story');
    expect(characterExport(changed.present.nodes.C, changed.present, 'ai')).toContain('after hearing their story');
    const restored = undoableReducer(changed, { type: 'UNDO' });
    expect(restored.present.nodes.C.body).toBe(active.body);
    expect(restored.present.nodes.INPUT.body).toBe(input.body);
  });

  it('protects a manual passage and offers a revision while other inputs continue updating', () => {
    const before = emotionalCharacter('They fear enclosed spaces.');
    const block = before.characterProfile.blocks[0];
    const edited = characterProfilePatch(before, {}, { blocks: [{ ...block, text: 'My carefully written passage.' }] });
    const revised = reviseWizardResult(edited, emotionalCharacter('They fear enclosed spaces only when alone.'), FRAMEWORK_TYPES.fate);
    expect(revised.body).toBe('My carefully written passage.');
    const pending = revised.characterProfile.blocks[0];
    expect(pending.pending).toContain('only when alone');
    const accepted = characterProfilePatch(revised, {}, { blocks: [{ ...pending, text: pending.pending, generated: pending.pending, pending: undefined }] });
    expect(accepted.body).toContain('only when alone');
    expect(accepted.characterProfile.blocks[0].pending).toBeUndefined();
  });

  it('keeps a manually replaced whole description until its updated proposal is accepted', () => {
    const before = emotionalCharacter('They are suspicious of travellers.');
    let state = reducer(stateWith({ C: before }), { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'C', patch: { body: 'My complete rewrite.', description: 'My complete rewrite.' } });
    const revised = reviseWizardResult(state.nodes.C, emotionalCharacter('They are suspicious only of armed travellers.'), FRAMEWORK_TYPES.fate);
    expect(revised.body).toBe('My complete rewrite.');
    expect(revised.characterProfile.generated).toContain('armed travellers');
    expect(characterExport(revised, {}, 'ai')).toContain('await review');
    expect(characterProfilePatch(revised, {}, { manualDescription: undefined }).body).toContain('armed travellers');
  });

  it('can exclude and restore an input without deleting its wizard answers', () => {
    const before = emotionalCharacter('They enjoy company.');
    const key = characterSources(before)[0].key;
    const excluded = characterProfilePatch(before, {}, { excluded: [key] });
    expect(excluded.body).toBe('');
    expect(characterExport(excluded, {}, 'ai')).not.toContain('enjoy company');
    expect(savedWizardSessions(excluded, {})[0].record.fateDraft.emotion.anchor).toBe('They enjoy company.');
    expect(characterProfilePatch(excluded, {}, { excluded: [] }).body).toContain('enjoy company');
  });

  it('keeps a deleted source snapshot but removes its contribution when the author cuts its connection', () => {
    const input = { id: 'P', kind: 'concept', title: 'A promise', body: 'They value fairness.' };
    const active = characterProfilePatch({ id: 'C', kind: 'character', title: 'Mira', body: '' }, { nodes: { P: input } }, { links: [{ nodeId: 'P', snapshot: characterInputSnapshot(input) }] });
    const initial = { ...stateWith({ C: active, P: input }), edges: [{ from: 'P', to: 'C', label: 'Character input' }] };
    const removed = reducer(initial, { type: 'DELETE_NODE', nodeId: 'P' });
    expect(removed.nodes.C.body).toContain('value fairness');
    expect(characterSources(removed.nodes.C, removed)[0].missing).toBe(true);
    const cut = reducer(initial, { type: 'REMOVE_EDGE', from: 'P', to: 'C' });
    expect(cut.nodes.C.body).toBe('');
    expect(cut.nodes.C.characterProfile.links).toHaveLength(0);
  });

  it('isolates identical node IDs in different nested act lanes', () => {
    const input = text => ({ id: 'P', kind: 'concept', title: 'Input', body: text });
    const lane = text => {
      const p = input(text);
      const c = characterProfilePatch({ id: 'C', kind: 'character', title: 'Mira', body: '' }, { nodes: { P: p } }, { links: [{ nodeId: 'P', snapshot: characterInputSnapshot(p) }] });
      return { id: 'lane', sub: { nodes: { C: c, P: p }, edges: [] } };
    };
    const state = { ...makeEmptyProject(), masterNodes: { ACT: { id: 'ACT', sub: { nodes: { A: lane('First lane.'), B: lane('Second lane.') }, edges: [] } } } };
    const changed = reducer(state, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'masterNodes', parentPath: ['ACT', 'A'] }, id: 'P', patch: { body: 'Updated first lane.' } });
    expect(changed.masterNodes.ACT.sub.nodes.A.sub.nodes.C.body).toBe('Updated first lane.');
    expect(changed.masterNodes.ACT.sub.nodes.B.sub.nodes.C.body).toBe('Second lane.');
  });

  it('does not rewrite old characters until explicitly enabled and keeps authored introductions on activation', () => {
    const old = { id: 'C', kind: 'character', title: 'Mira', body: 'An authored introduction.', description: 'An authored introduction.' };
    const moved = reducer(stateWith({ C: old }), { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'C', patch: { x: 90 } });
    expect(moved.nodes.C.characterProfile).toBeUndefined();
    expect(syncCharacterProfile(enableCharacterProfile(old)).body).toBe(old.body);
    const legacy = syncCharacterProfile(enableCharacterProfile({ ...old, body: 'Newer canvas writing.', description: 'Earlier inspector writing.' }));
    expect(legacy.body).toContain('Newer canvas writing.');
    expect(legacy.body).toContain('Earlier inspector writing.');
  });

  it('separates secrets, possibilities and unanswered questions in AI context and retains them after JSON round-trip', () => {
    const node = characterProfilePatch(emotionalCharacter('They welcome strangers.'), {}, { details: { secrets: 'They hid the key.', possibilities: 'They might leave the city.', openQuestions: 'Who taught them to sing?', voice: 'They speak softly.' } });
    const restored = JSON.parse(JSON.stringify(node));
    const output = characterExport(restored, {}, 'ai');
    expect(restored.body).toContain('speak softly');
    expect(restored.body).not.toContain('might leave');
    expect(output).toContain('## Secrets\n\nThey hid the key.');
    expect(output).toContain('## Possible changes');
    expect(output).toContain('## Unanswered questions');
    expect(output).toContain('not events that have happened');
  });

  it('rebuilds generated character text when a saved wizard answer is edited directly in the inspector', () => {
    const before = emotionalCharacter('They fear strangers.');
    const id = before.narrativeWizard.questionIds['phase:E'];
    const changed = reducer(stateWith({ C: before }), { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'C', patch: { questions: before.questions.map(row => row.id === id ? { ...row, answer: 'They fear strangers only after dark.' } : row) } });
    expect(changed.nodes.C.body).toContain('only after dark');
    expect(characterExport(changed.nodes.C, changed, 'ai')).toContain('only after dark');
    expect(savedWizardSessions(changed.nodes.C, {})[0].answers['phase:E']).toContain('only after dark');
  });

  it('offers a new generated passage when wizard output was manually overridden, and keeps an accepted revision stable', () => {
    const make = condition => {
      let draft = createFateDraft({ purpose: 'character' });
      draft = editFate(draft, 'emotion.anchor', condition);
      draft.output.text = 'The wizard result was written by hand.';
      return createWizardNode({ source: FRAMEWORK_TYPES.fate, type: 'framework', title: 'Mira', focus: 'character', id: 'C', questions: fateQuestions(draft), answers: fateAnswers(draft), fateDraft: draft });
    };
    const before = make('They fear strangers.');
    const revised = reviseWizardResult(before, make('They fear strangers only after dark.'), FRAMEWORK_TYPES.fate);
    expect(revised.body).toBe('The wizard result was written by hand.');
    const block = revised.characterProfile.blocks[0];
    expect(block.pending).toContain('only after dark');
    const accepted = resolveCharacterPassage(revised, {}, block.key, true);
    expect(accepted.body).toContain('only after dark');
    expect(syncCharacterProfile(accepted).body).toBe(accepted.body);
    expect(accepted.narrativeWizard.fateDraft.output.text).toBe('The wizard result was written by hand.');
  });

  it('lets the writer keep a manual passage after its source is excluded without repeatedly requesting review', () => {
    const before = emotionalCharacter('They enjoy company.');
    const first = before.characterProfile.blocks[0];
    const edited = characterProfilePatch(before, {}, { blocks: [{ ...first, text: 'A protected line.' }] });
    const excluded = characterProfilePatch(edited, {}, { excluded: [first.key] });
    const kept = resolveCharacterPassage(excluded, {}, first.key, false);
    expect(kept.body).toBe('A protected line.');
    expect(syncCharacterProfile(kept).characterProfile.blocks[0].pending).toBeUndefined();
  });

  it('copies linked canvas inputs together and detaches inputs outside the selection', () => {
    const input = { id: 'P', kind: 'concept', title: 'A promise', body: 'They value fairness.' };
    const character = characterProfilePatch({ id: 'C', kind: 'character', title: 'Mira', body: '' }, { nodes: { P: input } }, { links: [{ nodeId: 'P', snapshot: characterInputSnapshot(input) }] });
    const nodes = { C: character, P: input };
    const copied = remapCanvasClipboard(createCanvasClipboard(nodes, [{ from: 'P', to: 'C' }], ['C', 'P']), {});
    const copy = copied.nodes[copied.idMap.C];
    expect(copy.characterProfile.links[0].nodeId).toBe(copied.idMap.P);
    expect(copy.characterProfile.blocks[0].key).toBe(`node:${copied.idMap.P}`);
    const alone = remapCanvasClipboard(createCanvasClipboard(nodes, [], ['C']), {});
    const detached = alone.nodes[alone.idMap.C];
    expect(detached.characterProfile.links[0].detached).toBe(true);
    expect(syncCharacterProfile(detached, { nodes: { P: { ...input, body: 'Unrelated destination data.' } } }).body).toBe(character.body);
    const hidden = characterProfilePatch(detached, {}, { excluded: ['node:P'] });
    const twice = remapCanvasClipboard(createCanvasClipboard({ C: { ...hidden, id: 'C' }, P: input }, [], ['C', 'P']), {});
    expect(twice.nodes[twice.idMap.C].characterProfile.excluded).toEqual(['node:P']);
    expect(syncCharacterProfile(twice.nodes[twice.idMap.C], { nodes: twice.nodes }).body).toBe('');
  });

  it('imports independent editable character templates instead of flattening them to story nodes', () => {
    const original = emotionalCharacter('They welcome strangers.');
    const record = wizardLibraryRecord(original, 'LIB-NAR-C');
    const library = { narrative: { [record.entity.id]: record.entity } };
    const imported = importNarrative(library, makeEmptyProject(), record.entity.id);
    const character = imported.nodes[imported.createdId];
    expect(character.kind).toBe('character');
    const changed = reviseWizardResult(character, emotionalCharacter('They welcome familiar faces.'), FRAMEWORK_TYPES.fate);
    expect(changed.body).toContain('familiar faces');
    expect(original.body).toContain('welcome strangers');
    expect(record.entity.template.body).toBe(original.body);
  });
});
