import { describe, expect, it } from 'vitest';
import { createValuesDraft, customValue, addCustomValue, editValues, valuesSteps, valuesInFocus, valuesSuggestions, valuesSummary, valuesOutput, valuesChecks, valuesQuestions, valuesAnswers, addValuesRow, keepValuesAnswer, importValuesModel, refreshValuesImports } from './humanValuesWizard.js';
import { createWizardNode, reviseWizardResult, appendWizardResult, wizardLibraryRecord } from './narrativeWizard.js';
import { FRAMEWORK_TYPES, makeEmptyProject } from '../data/seed.js';
import { savedWizardModels, wizardScopeKey } from './storyWizardCore.js';
import { reducer } from '../state/reducer.js';

const draft = () => createValuesDraft({ id: 'VALUES-TEST', title: 'Mara’s home', purpose: 'character', context: 'Mara has lived beside the river all her life.' });
const index = (d, id = 'safety') => d.values.findIndex(value => value.id === id);
const choose = (d, id = 'safety') => editValues(d, `values.${index(d, id)}.column`, 'inPlay');
function ready() {
  let d = choose(draft()), p = `values.${index(d)}`;
  for (const [key, value] of Object.entries({ who: 'Mara', why: 'Her home is her last connection to her mother.', from: 'Safe', to: 'In danger' })) d = editValues(d, `${p}.${key}`, value);
  return editValues(d, 'setup.event', 'The bank threatens to take her home.');
}
const result = (d, id = 'HV-1') => createWizardNode({ source: FRAMEWORK_TYPES.humanValues, type: 'framework', id, title: d.title, focus: d.meta.purpose, questions: valuesQuestions(d), answers: valuesAnswers(d), valuesDraft: d });

describe('Human Values Simple and Advanced', () => {
  it('starts without inferred values, states, ratings or outcomes', () => {
    const d = draft();
    expect(valuesInFocus(d)).toEqual([]);
    expect(d.values).toHaveLength(13);
    expect(d.values.every(value => !value.from && !value.to && value.importance === null)).toBe(true);
    expect(valuesSteps(d).map(row => row.key)).toEqual(['setup', 'values', 'shifts', 'review']);
    expect(d.choices.enabled).toBe(false);
  });
  it('retains all Advanced answers when switching to Simple and back', () => {
    let d = editValues(ready(), 'meta.depth', 'advanced');
    d = addValuesRow(d, 'reveal'); d = editValues(d, 'reveal.rows.0.text', 'The debt was already repaid.');
    d = editValues(d, 'meta.depth', 'simple');
    expect(valuesSteps(d)).toHaveLength(4);
    d = editValues(d, 'meta.depth', 'advanced');
    expect(valuesSteps(d)).toHaveLength(7);
    expect(d.reveal.rows[0].text).toBe('The debt was already repaid.');
  });
  it('keeps the focus to three without deleting later-value answers', () => {
    let d = choose(choose(choose(draft(), 'safety'), 'love'), 'freedom');
    const before = d;
    d = choose(d, 'wealth'); expect(d).toBe(before);
    d = editValues(d, `values.${index(d)}.why`, 'Shelter matters.');
    d = editValues(d, `values.${index(d)}.column`, 'watch');
    d = choose(d, 'wealth'); expect(valuesInFocus(d)).toHaveLength(3);
    expect(d.values[index(d)].why).toBe('Shelter matters.');
  });
  it('suggests purpose-fit values only after explicit acceptance', () => {
    const d = draft(), suggestion = valuesSuggestions(d)[0];
    expect(valuesInFocus(d)).toHaveLength(0);
    const next = editValues(d, suggestion.path, suggestion.proposed, { source: 'suggested', dependencies: ['meta.purpose'] });
    expect(valuesInFocus(next)).toHaveLength(1);
    expect(next.fieldMeta[suggestion.path].source).toBe('suggested');
  });
  it('validates custom state names and reuses them through the project library', () => {
    expect(() => customValue('Home', 'Owned')).toThrow();
    expect(() => customValue('Home', 'Owned\nowned')).toThrow();
    const def = customValue('Home', 'Owned\nMortgaged\nLost', 'A place to belong.');
    const p = reducer(makeEmptyProject('Test'), { type: 'ADD_HUMAN_VALUE', definition: def });
    const d = createValuesDraft({ customLibrary: p.humanValuesLibrary });
    expect(d.values.find(value => value.id === def.id).states).toEqual(['Owned', 'Mortgaged', 'Lost']);
    expect(addCustomValue(d, def)).toBe(d);
  });
  it('allows protection, celebration and relief without forced costs or warnings', () => {
    let d = ready(), p = `values.${index(d)}`;
    d = editValues(d, `${p}.to`, 'Safe'); d = editValues(d, `${p}.intent`, 'Is protected');
    expect(valuesChecks(d)).toEqual([]);
    expect(valuesOutput(d)).toContain('protected');
    expect(valuesOutput(d)).not.toContain('No one loses');
  });
  it('keeps planned endings conditional and produces prose rather than the questionnaire', () => {
    const d = ready(), output = valuesOutput(d);
    expect(output).toContain('For Mara, her home is her last connection');
    expect(output).toContain('could');
    expect(output).not.toContain('Working on:');
    expect(output).not.toContain('Where could it end?');
    expect(output).not.toContain('Importance');
    expect(valuesSummary(d, 'shifts')).toContain('Safe → In danger');
  });
  it('keeps subjective ratings out of prose and does not sum a best choice', () => {
    let d = ready(); d = editValues(d, `values.${index(d)}.importance`, 4); d = editValues(d, `values.${index(d)}.intensity`, 2);
    expect(valuesOutput(d)).toBe(valuesOutput(ready()));
    expect(valuesChecks(d)).toEqual([]);
  });
  it('preserves edited prose until explicitly rebuilt', () => {
    let d = editValues(ready(), 'output.text', 'Mara would risk everything for her home.');
    d = editValues(d, 'setup.event', 'A flood comes.');
    expect(valuesOutput(d)).toBe('Mara would risk everything for her home.');
    d = editValues(d, 'output.text', undefined);
    expect(valuesOutput(d)).toContain('A flood comes.');
  });
  it('uses paragraph output in Simple while retaining the Advanced format and notes', () => {
    let d = editValues(ready(), 'meta.depth', 'advanced');
    d = editValues(d, 'output.format', 'Organizer notes'); d = editValues(d, 'organizer', 'A private organizer instruction.');
    expect(valuesOutput(d)).toContain('A private organizer instruction.');
    d = editValues(d, 'meta.depth', 'simple');
    expect(valuesOutput(d)).not.toContain('A private organizer instruction.');
    expect(d.output.format).toBe('Organizer notes');
    expect(editValues(d, 'meta.depth', 'advanced').organizer).toBe('A private organizer instruction.');
  });
  it('marks consequences for review after a state edit without changing their text', () => {
    let d = addValuesRow(ready(), 'choices'); d = editValues(d, 'choices.options.0.label', 'Ask the village for help.');
    d = editValues(d, `values.${index(d)}.to`, 'Threatened');
    expect(d.fieldMeta['choices.options.0.label'].stale).toBe(true);
    expect(d.choices.options[0].label).toBe('Ask the village for help.');
    d = keepValuesAnswer(d, 'choices.options.0.label');
    expect(d.fieldMeta['choices.options.0.label'].stale).toBe(false);
  });
  it('locks answers while retaining navigation, depth switching and unlock', () => {
    let d = editValues(draft(), 'locks.setup', true);
    expect(editValues(d, 'context', 'Replace it')).toBe(d);
    d = editValues(d, 'lastStep', 'values'); expect(d.lastStep).toBe('values');
    d = editValues(d, 'meta.depth', 'advanced'); expect(d.meta.depth).toBe('advanced');
    d = editValues(d, 'locks.setup', false); expect(editValues(d, 'context', 'New').context).toBe('New');
  });
  it('separates true and perceived states for different people', () => {
    let d = addValuesRow(ready(), 'view', index(ready()));
    d = editValues(d, `values.${index(d)}.views.0.actual`, 'The bank has forgiven the debt.');
    d = editValues(d, `values.${index(d)}.views.0.perceived`, 'Mara believes she will lose her home.');
    expect(d.values[index(d)].views[0].actual).not.toEqual(d.values[index(d)].views[0].perceived);
    expect(d.values[index(d)].to).toBe('In danger');
  });
  it('imports FATE/Kolb text without inferring failure, skill, states or emotional labels', () => {
    const model = { key: 'fate-key', record: { title: 'Warning', fateDraft: { focus: { anchor: 'A threat to the home.' } } } };
    let d = importValuesModel(draft(), 'setup.event', model);
    expect(d.setup.event).toBe('A threat to the home.'); expect(valuesInFocus(d)).toHaveLength(0);
    expect(d.values.every(value => !value.to)).toBe(true);
    d = refreshValuesImports(d, [{ ...model, record: { ...model.record, fateDraft: { focus: { anchor: 'A new warning.' } } } }]);
    expect(d.fieldMeta['setup.event'].stale).toBe(true); expect(d.setup.event).toBe('A threat to the home.');
    expect(refreshValuesImports(keepValuesAnswer(d, 'setup.event'), []).setup.event).toBe('A threat to the home.');
  });
  it('retains old selections as notes without treating a pole as an ending', () => {
    const answers = { 'phase:Safety': 'A long detail. '.repeat(30), 'phase:Safety:choice': 'Danger', 'phase:Love:choice': 'Both / in conflict' };
    const d = createValuesDraft({ record: { title: 'Old', focus: 'scene', answers }, answers });
    expect(d.legacy).toEqual(answers);
    expect(d.values[index(d)].to).toBe('');
    expect(d.values[index(d)].note).toContain(answers['phase:Safety']);
    expect(valuesAnswers(d)['values:legacy:phase:Safety:choice']).toBe('Danger');
  });
  it('round-trips full details and inspector-edited answers without truncation', () => {
    const node = result(ready()), answers = { ...node.narrativeWizard.answers, 'values:safety:why': 'A new long reason. '.repeat(40) };
    const d = createValuesDraft({ record: node.narrativeWizard, answers });
    expect(d.values[index(d)].why).toBe(answers['values:safety:why']);
    expect(d.id).not.toBe(node.narrativeWizard.valuesDraft.id);
    expect(d.workspace.sessionId).toBe(node.narrativeWizard.sessionId);
    expect(node.body).toBe(valuesOutput(ready()));
  });
  it('saves a library copy and revises a character without duplicated questions or lost extras', () => {
    const d = ready(), node = result(d);
    node.questions.push({ id: 'custom', prompt: 'Other work', answer: 'Keep this.' });
    let nextDraft = editValues(d, `values.${index(d)}.why`, 'The river village is her family.');
    const revised = reviseWizardResult(node, result(nextDraft), FRAMEWORK_TYPES.humanValues);
    expect(revised.id).toBe(node.id); expect(revised.questions.filter(row => row.id === 'custom')).toHaveLength(1);
    expect(revised.questions.filter(row => row.prompt === 'Safety · What matters to them—and why now?')).toHaveLength(1);
    expect(wizardLibraryRecord(revised, 'LIB-HV').entity.description).toBe(revised.body);
  });
  it('keeps attached plans in scoped nested graphs and finds saved sessions', () => {
    const node = result(ready()), parent = { id: 'P', kind: 'concept', title: 'Parent', body: 'Existing.' };
    const attached = appendWizardResult(parent, node), game = makeEmptyProject('Test');
    game.masterNodes = { act: { id: 'act', title: 'Act', kind: 'act', sub: { nodes: { P: attached }, edges: [] } } };
    const found = savedWizardModels(game, 'humanValues');
    expect(found.length).toBeGreaterThan(0);
    expect(found.some(row => row.entity.ref.coll === 'masterNodes' && row.entity.ref.path.includes('act'))).toBe(true);
    expect(wizardScopeKey({ coll: 'masterNodes', parentPath: ['act'] })).not.toBe(wizardScopeKey());
  });
  it('reviews authored details without interpreting source text or forcing emotions', () => {
    let d = editValues(ready(), 'meta.mode', 'diagnose');
    expect(valuesOutput(d)).toContain('Review of the recorded stakes');
    expect(valuesOutput(d)).not.toContain('emotion score');
    d = editValues(d, 'meta.purpose', 'invalid'); expect(d.meta.purpose).toBe('character');
    expect(() => createValuesDraft({ record: { valuesDraft: { schemaVersion: 99 } } })).toThrow();
  });
});
