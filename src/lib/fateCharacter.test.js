import { describe, expect, it } from 'vitest';
import { FATE_SIGNAL_GROUPS, fateCharacterEntities, fateCharacterScope, refreshFateCharacterLinks, currentFateCharacterDraft } from './fateCharacter.js';
import { createFateDraft, editFate, fateOutput, fateQuestions, fateAnswers, normalizeFateDraft, switchFatePurpose } from './fateWizard.js';
import { createWizardNode, reviseWizardResult, wizardLibraryRecord } from './narrativeWizard.js';
import { FRAMEWORK_TYPES, makeEmptyProject } from '../data/seed.js';
import { savedWizardSession } from './narrativeMemory.js';
import { undoableReducer } from '../state/store.jsx';
import { remapCanvasClipboard, createCanvasClipboard } from './canvasClipboard.js';

const make = () => createFateDraft({ purpose: 'character', title: 'John' });
const build = draft => createWizardNode({ source: FRAMEWORK_TYPES.fate, type: 'framework', title: draft.title, focus: 'character', id: 'J', fateDraft: draft, questions: fateQuestions(draft), answers: fateAnswers(draft) });
const person = { id: 'bern', name: 'Bernie', type: 'person', entityKey: '["nodes","B"]', detail: 'They have known one another since childhood.' };

describe('FATE character discovery', () => {
  it('offers visual, audio and kinesthetic signals, with independent strengths, overlooked signals and exceptions', () => {
    expect(Object.keys(FATE_SIGNAL_GROUPS)).toEqual(['Visual', 'Audio', 'Kinesthetic']);
    const d = editFate(make(), 'focus.signals', [{ id: 'a', label: 'Raised voices', kind: 'attention', strength: 2, detail: 'Only when his name is used.' }, { id: 'b', label: 'Bright light', kind: 'overlooked', strength: 0 }, { id: 'c', label: 'Vibration', kind: 'attention', strength: null }]);
    const output = fateOutput(d);
    expect(output).toContain('Raised voices (brief pause)');
    expect(output).toContain('tend to overlook Bright light (usually ignored)');
    expect(output).toContain('Only when his name is used.');
    expect(output).toContain('They notice Vibration.');
    expect(output).not.toContain('danger');
    expect(d.focus.capture).toBeNull();
  });

  it('keeps two emotional patterns independent and does not invent a cause or reaction', () => {
    const d = editFate(make(), 'emotion.patterns', [{ id: 'fear', situation: 'a friend is threatened', feelings: ['Fear', 'Anger'], direction: 'Move toward it', intensity: 4, response: 'Protect the friend.', exception: 'a friend asks for a pause' }, { id: 'pride', situation: 'praised in public', feelings: ['Pride'], direction: 'Pull away', intensity: 1 }]);
    const output = fateOutput(d);
    expect(output).toContain('fear and anger (overwhelming)');
    expect(output).toContain('pride (mild)');
    expect(output).toContain('Their usual impulse in this pattern is to move toward it.');
    expect(output).toContain('Their usual impulse in this pattern is to pull away.');
    expect(output).toContain('friend asks for a pause');
    expect(output).not.toContain('learned experience');
    expect(d.emotion.direction).toBeNull();
  });

  it('retains old prose and retired answers until an explicit rebuild, which excludes scene and setup controls', () => {
    const old = make(); delete old.characterRevision;
    old.context = 'An earlier authored introduction.'; old.meta.outcomeText = 'Everyone obeys.'; old.output.tone = 'Heroic'; old.focus.anchor = 'the lighthouse'; old.emotion.origin = 'A childhood scene.';
    const migrated = normalizeFateDraft(old);
    expect(fateOutput(migrated)).toContain('An earlier authored introduction.');
    const rebuilt = editFate(migrated, 'output.text', undefined);
    expect(fateOutput(rebuilt)).toContain('lighthouse');
    expect(fateOutput(rebuilt)).not.toContain('Everyone obeys');
    expect(fateOutput(rebuilt)).not.toContain('courage');
    expect(rebuilt.context).toBe(old.context);
    expect(rebuilt.emotion.origin).toBe('A childhood scene.');
    expect(old.characterRevision).toBeUndefined();
  });

  it('round-trips structured answers through saved questions, direct answer edits and wizard revision', () => {
    let d = editFate(make(), 'focus.signals', [{ id: 's', label: 'Loud sounds', kind: 'attention', strength: 2, detail: 'They look up.' }]);
    d = editFate(d, 'authority.people', [person]);
    const node = build(d), key = 'fate:character:focus:s:detail';
    const questions = node.questions.map(row => row.id === node.narrativeWizard.questionIds[key] ? { ...row, answer: 'They look up only at a familiar voice.' } : row);
    const edited = { ...node, questions };
    const session = savedWizardSession(edited, {});
    const reopened = createFateDraft({ record: session.record, answers: session.answers });
    expect(reopened.focus.signals[0]).toMatchObject({ strength: 2, detail: 'They look up only at a familiar voice.' });
    const revised = reviseWizardResult(edited, build(reopened), FRAMEWORK_TYPES.fate);
    expect(revised.body).toContain('only at a familiar voice');
    expect(revised.body).toContain('Bernie');
    expect(wizardLibraryRecord(revised, 'LIB-J').entity.template.narrativeWizard.fateDraft.authority.people[0].entityKey).toBe('');
  });

  it('restores character and communication banks without copying their choices, output or scene fields', () => {
    let d = editFate(make(), 'authority.people', [person]);
    d = editFate(d, 'focus.signals', [{ id: 's', label: 'Touch', kind: 'attention', strength: null }]);
    d = switchFatePurpose(d, 'communication');
    expect(d.focus.signals).toEqual([]);
    d = editFate(d, 'communication.lines.F', 'Listen carefully.');
    expect(fateOutput(d)).toContain('Listen carefully.');
    d = switchFatePurpose(d, 'character');
    expect(fateOutput(d)).toContain('Bernie');
    expect(fateOutput(d)).not.toContain('Listen carefully');
    expect(d.focus.signals[0].strength).toBeNull();
  });

  it('accepts omitted categories and retains manual wording when new answers are added', () => {
    expect(fateOutput(make())).toBe('');
    let d = editFate(make(), 'output.text', 'The author’s complete paragraph.');
    d = editFate(d, 'authority.people', [person]);
    expect(fateOutput(d)).toBe('The author’s complete paragraph.');
  });

  it('uses the character’s current name unless the author explicitly renamed it in this draft', () => {
    const d = make(), target = { kind: 'character', title: 'Renamed elsewhere' };
    expect(currentFateCharacterDraft(d, [], target).title).toBe('Renamed elsewhere');
    const renamed = { ...d, title: 'An intentional new name', workspace: { ...d.workspace, pendingCharacterName: true } };
    expect(currentFateCharacterDraft(renamed, [], target).title).toBe('An intentional new name');
    expect(d.title).toBe('John');
  });
});

describe('FATE character references', () => {
  it('lists only characters and explicit groups, keeping repeated nested IDs distinct', () => {
    const game = { ...makeEmptyProject(), nodes: { B: { id: 'B', kind: 'character', title: 'Bernie' }, I: { id: 'I', kind: 'item', title: 'Item' }, S: { id: 'S', kind: 'concept', title: 'Story', sub: { nodes: { B: { id: 'B', kind: 'character', title: 'Victoria' } } } } }, teams: { G: { id: 'G', name: 'Guard' } }, players: { P: { id: 'P', name: 'Player' } } };
    const entities = fateCharacterEntities(game);
    expect(entities.map(row => row.name)).toEqual(['Bernie', 'Victoria', 'Guard']);
    expect(new Set(entities.map(row => row.key)).size).toBe(3);
    const d = editFate(make(), 'authority.people', [person, { id: 'lore', name: 'The old mentor', type: 'person', entityKey: '' }]);
    const renamed = refreshFateCharacterLinks(d, [{ ...entities[0], name: 'Bernard' }]);
    expect(renamed.authority.people.map(row => row.name)).toEqual(['Bernard', 'The old mentor']);
    expect(refreshFateCharacterLinks(renamed, []).authority.people[0].name).toBe('Bernard');
  });

  it('updates a linked name and derived character passage in one undoable transaction', () => {
    const node = build(editFate(make(), 'authority.people', [person]));
    const project = { ...makeEmptyProject(), nodes: { J: node, B: { id: 'B', kind: 'character', title: 'Bernie' } } };
    const changed = undoableReducer({ present: project, past: [] }, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'B', patch: { title: 'Bernard' } });
    expect(changed.present.nodes.J.body).toContain('Bernard');
    expect(changed.present.nodes.J.body).not.toContain('Bernie');
    expect(undoableReducer(changed, { type: 'UNDO' }).present.nodes.J.body).toContain('Bernie');
  });

  it('copies included root references and detaches external references while preserving their names', () => {
    const node = build(editFate(make(), 'authority.people', [person]));
    const all = { J: node, B: { id: 'B', kind: 'character', title: 'Bernie' } };
    const together = remapCanvasClipboard(createCanvasClipboard(all, [], ['J', 'B']), {});
    expect(together.nodes[together.idMap.J].narrativeWizard.fateDraft.authority.people[0].entityKey).toBe(JSON.stringify(['nodes', together.idMap.B]));
    const alone = remapCanvasClipboard(createCanvasClipboard(all, [], ['J']), {});
    expect(alone.nodes[alone.idMap.J].narrativeWizard.fateDraft.authority.people[0]).toMatchObject({ entityKey: '', name: 'Bernie' });
    expect(node.narrativeWizard.fateDraft.authority.people[0].entityKey).toBe(person.entityKey);
  });

  it('routes new character work to narrative graphs and the story lane of a master act', () => {
    const game = { ...makeEmptyProject(), masterNodes: { A: { id: 'A', actLanes: { story: 'S', mechanics: 'M' } } } };
    expect(fateCharacterScope(game, { coll: 'masterNodes', parentPath: ['A', 'M'] })).toEqual({ coll: 'masterNodes', parentPath: ['A', 'S'] });
    expect(fateCharacterScope(game, { coll: 'taskNodes' })).toEqual({ coll: 'nodes' });
    expect(fateCharacterScope(game, { coll: 'nodes' })).toEqual({ coll: 'nodes' });
  });
});
