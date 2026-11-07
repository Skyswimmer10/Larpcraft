import { describe, expect, it } from 'vitest';
import { generatedDescriptionParagraphs, editDescriptionParagraphs, syncDescriptionParagraphs, descriptionParagraphText, resolveDescriptionParagraph } from './descriptionParagraphs.js';
import { characterDescriptionReviews, editCharacterDescription, reviewCharacterDescription, characterExport, remapCharacterInputs } from './characterProfile.js';
import { createWizardNode, appendWizardResult } from './narrativeWizard.js';
import { savedWizardSessions } from './narrativeMemory.js';
import { makeEmptyProject } from '../data/seed.js';
import { undoableReducer } from '../state/store.jsx';

const make = (id, answer) => createWizardNode({ id, title: 'Moro', source: { id: 'source-' + id, name: 'Lens ' + id, category: 'characterConcept', nodes: {}, edges: [] }, type: 'concept', focus: 'character', questions: [{ key: 'q', prompt: 'What matters?' }], answers: { q: answer } });
const character = () => appendWizardResult(make('C', 'They distrust strangers.'), make('OTHER', 'They listen to quiet voices.'));
const stateWith = node => ({ present: { ...makeEmptyProject(), nodes: { C: node } }, past: [], undoGroup: null });
const change = (state, answer, recordIndex = 0) => {
  const node = state.present.nodes.C, session = savedWizardSessions(node, {})[recordIndex];
  return undoableReducer(state, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'nodes' }, id: 'C', patch: { questions: node.questions.map(row => row.id === session.record.questionIds.q ? { ...row, answer } : row) } });
};

describe('protected character description paragraphs', () => {
  it('updates untouched paragraphs after answer edits while retaining added prose and undoing both together', () => {
    const before = character(), addition = 'They secretly pay for their sister’s education.';
    const edited = editCharacterDescription(before, {}, before.body + '\n\n' + addition);
    const state = stateWith(edited), changed = change(state, 'They trust travellers after sunrise.');
    expect(changed.present.nodes.C.body).toContain('They trust travellers after sunrise.');
    expect(changed.present.nodes.C.body).toContain('They listen to quiet voices.');
    expect(changed.present.nodes.C.body).toContain(addition);
    expect(characterDescriptionReviews(changed.present.nodes.C)).toEqual([]);
    expect(savedWizardSessions(changed.present.nodes.C, {})[0].answers.q).toBe('They trust travellers after sunrise.');
    expect(undoableReducer(changed, { type: 'UNDO' }).present.nodes.C).toEqual(edited);
  });

  it('reviews only the rewritten paragraph and accepts it without losing additions or the other updated input', () => {
    const before = character(), addition = 'They own a bakery.';
    const edited = editCharacterDescription(before, {}, before.body.replace('They distrust strangers.', 'They welcome everyone.') + '\n\n' + addition);
    let changed = change(stateWith(edited), 'They distrust armed strangers.');
    changed = change(changed, 'They listen to bells.', 1);
    const node = changed.present.nodes.C, reviews = characterDescriptionReviews(node);
    expect(reviews).toHaveLength(1);
    expect(reviews[0].text).toBe('They welcome everyone.');
    expect(reviews[0].pending).toBe('They distrust armed strangers.');
    expect(node.body).toContain('They listen to bells.');
    const accepted = reviewCharacterDescription(node, {}, reviews[0].id, true);
    expect(accepted.body).toContain('They distrust armed strangers.');
    expect(accepted.body).toContain(addition);
    expect(accepted.body).not.toContain('They welcome everyone.');
    expect(characterDescriptionReviews(accepted)).toEqual([]);
    expect(savedWizardSessions(accepted, {})[0].answers.q).toBe('They distrust armed strangers.');
  });

  it('keeps intentional exceptions, offers later changes again, and allows an edited resolution without rewriting answers', () => {
    const before = character(), edited = editCharacterDescription(before, {}, before.body.replace('They distrust strangers.', 'They welcome everyone.'));
    let node = change(stateWith(edited), 'They avoid strangers at dawn.').present.nodes.C;
    node = reviewCharacterDescription(node, {}, characterDescriptionReviews(node)[0].id, false);
    expect(characterDescriptionReviews(node)).toEqual([]);
    expect(node.body).toContain('They welcome everyone.');
    node = change(stateWith(node), 'They avoid strangers at night.').present.nodes.C;
    expect(characterDescriptionReviews(node)).toHaveLength(1);
    node = reviewCharacterDescription(node, {}, characterDescriptionReviews(node)[0].id, false, 'They welcome strangers except at night.');
    expect(node.body).toContain('They welcome strangers except at night.');
    expect(savedWizardSessions(node, {})[0].answers.q).toBe('They avoid strangers at night.');
    expect(characterDescriptionReviews(node)).toEqual([]);
  });

  it('preserves a deliberate paragraph deletion and reviews it when its answer changes', () => {
    const before = character(), node = editCharacterDescription(before, {}, 'They listen to quiet voices.');
    const changed = change(stateWith(node), 'They distrust soldiers.').present.nodes.C;
    expect(changed.body).toBe('They listen to quiet voices.');
    expect(characterDescriptionReviews(changed)[0].text).toBe('');
    expect(reviewCharacterDescription(changed, {}, characterDescriptionReviews(changed)[0].id, true).body).toContain('They distrust soldiers.');
  });

  it('preserves ambiguous merges/splits as authored writing and leaves original source deletions reviewable', () => {
    const base = generatedDescriptionParagraphs([{ key: 'a', text: 'First paragraph.' }, { key: 'b', text: 'Second paragraph.' }]);
    const authored = editDescriptionParagraphs(base, 'Both ideas in one paragraph. Extra writing.');
    const changed = syncDescriptionParagraphs(authored, [{ key: 'a', text: 'Changed first paragraph.' }, { key: 'b', text: 'Second paragraph.' }]);
    expect(descriptionParagraphText(changed)).toBe('Both ideas in one paragraph. Extra writing.');
    expect(changed.filter(row => row.pending !== undefined)).toHaveLength(1);
    expect(descriptionParagraphText(resolveDescriptionParagraph(changed, base[0].id, false))).toBe('Both ideas in one paragraph. Extra writing.');
  });

  it('keeps authored paragraphs, review metadata and source ownership through a standalone template remap', () => {
    const node = editCharacterDescription(character(), {}, 'A custom opening.\n\n' + character().body);
    const remapped = remapCharacterInputs(node, { C: 'COPY' });
    expect(remapped.characterProfile.descriptionParagraphs).toEqual(node.characterProfile.descriptionParagraphs);
    expect(characterExport(remapped)).toContain('A custom opening.');
    expect(JSON.parse(JSON.stringify(remapped)).characterProfile.descriptionParagraphs).toEqual(remapped.characterProfile.descriptionParagraphs);
  });
});
