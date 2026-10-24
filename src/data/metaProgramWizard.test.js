import { describe, expect, it } from 'vitest';
import { FRAMEWORK_TYPES } from './seed.js';
import { NARRATIVE_FOCUSES } from './narrativeGuidance.js';
import { META_PROGRAM_STEPS, metaProgramQuestions, metaProgramProfile, exceptionIds, addMetaProgramException, selectedMetaOptions, spectrumPosition, metaProgramTestPrompt } from './metaProgramWizard.js';
import { frameworkQuestions, createWizardNode, reviseWizardResult, wizardLibraryRecord, appendWizardResult } from '../lib/narrativeWizard.js';
import { savedWizardSession, questionAnswer } from '../lib/narrativeMemory.js';
import { buildNarrativeLinkInsertion } from '../lib/narrativeLinks.js';

const source = FRAMEWORK_TYPES.nlpMetaPrograms;
const make = (answers, focus = 'character') => createWizardNode({ source, type: 'framework', title: 'A careful envoy', focus, id: 'P', questions: frameworkQuestions(source, answers, focus), answers });

describe('four-step Meta Programs workshop', () => {
  it.each(Object.keys(NARRATIVE_FOCUSES))('supports %s without assigning unanswered preferences', focus => {
    const rows = frameworkQuestions(source, {}, focus);
    expect(new Set(rows.map(row => row.key)).size).toBe(rows.length);
    expect(new Set(rows.map(row => row.step))).toEqual(new Set([0, 1, 2, 3]));
    expect(rows.every(row => row.prompt && !row.prompt.includes('undefined'))).toBe(true);
    expect(rows.filter(row => questionAnswer(row, {}))).toEqual([]);
    const node = make({}, focus);
    expect(node.narrativeWizard.metaProgramProfile.motivation).toBeNull();
    expect(node.narrativeWizard.metaProgramProfile.informationScope).toBeNull();
    expect(node.narrativeWizard.answers).toEqual({});
    expect(META_PROGRAM_STEPS).toHaveLength(4);
  });
  it('uses spectra only for motivation and level of detail and checkboxes for independent explanation formats', () => {
    const rows = frameworkQuestions(source);
    expect(rows.filter(row => row.control === 'spectrum').map(row => row.key)).toEqual(['phase:1', 'phase:4']);
    expect(rows.find(row => row.key === 'mp:explanations').control).toBe('multi');
    expect(rows.find(row => row.key === 'phase:2').prompt).not.toMatch(/moral/i);
  });
  it('displays old preferences without converting them into newly chosen values', () => {
    const rows = metaProgramQuestions(source);
    const motivation = rows.find(row => row.key === 'phase:1');
    expect(spectrumPosition(motivation, '')).toBeNull();
    expect(spectrumPosition(motivation, 'Toward')).toBe(1);
    expect(spectrumPosition(rows.find(row => row.key === 'phase:4'), 'Detail')).toBe(3);
    const old = { 'phase:1:choice': 'Toward', 'phase:1': 'The envoy seeks a useful alliance.', 'phase:6:choice': 'Both / depends on the situation' };
    const node = make(old);
    expect(savedWizardSession(node, {}).answers).toMatchObject(old);
    expect(selectedMetaOptions(rows.find(row => row.key === 'phase:6'), old['phase:6:choice'])).toEqual(['Options', 'Procedures']);
  });
  it('round-trips multiple checkbox selections and explanations without turning the selection into prose', () => {
    const answers = { 'mp:interests:choice': 'People | Information', 'mp:interests': 'Notices who knows the route.', 'mp:explanations:choice': 'Facts and evidence | Clear steps' };
    const node = make(answers);
    const resumed = savedWizardSession(node, {});
    expect(resumed.answers).toMatchObject(answers);
    expect(resumed.record.metaProgramProfile.interests).toEqual(['People', 'Information']);
    expect(resumed.record.metaProgramProfile.explanations).toEqual(['Facts and evidence', 'Clear steps']);
    expect(resumed.record.metaProgramProfile.notes['mp:interests']).toContain('route');
  });
  it('does not invent a choice when an explanation happens to match an option label', () => {
    const node = make({ 'mp:interests': 'People', 'phase:1': 'Mostly toward' });
    const session = savedWizardSession(node, {});
    expect(session.answers['mp:interests:choice']).toBeUndefined();
    expect(session.answers['phase:1:choice']).toBeUndefined();
    expect(session.answers['mp:interests']).toBe('People');
  });
  it('keeps condition changes explicit and uses stable IDs when one is removed', () => {
    let answers = { ...addMetaProgramException({}), 'mp:exception:e1:when': 'An ally is threatened.', 'mp:exception:e1:change': 'Stops offering options and follows the rescue plan.' };
    answers = { ...answers, ...addMetaProgramException(answers), 'mp:exception:e2:when': 'A deadline approaches.' };
    expect(exceptionIds(answers)).toEqual(['e1', 'e2']);
    answers['mp:exceptionIds'] = 'e2';
    const rows = frameworkQuestions(source, answers);
    expect(rows.filter(row => row.section === 'exception')).toHaveLength(4);
    expect(rows.some(row => row.key.includes(':e1:'))).toBe(false);
    expect(rows.find(row => row.key === 'mp:exception:e2:when').prompt).toContain('Exception 1');
    expect(metaProgramProfile(answers).exceptions[0].when).toContain('deadline');
    expect(addMetaProgramException(answers)['mp:exceptionIds']).toBe('e2|e3');
  });
  it('uses recorded choices and earlier archetype work to guide the scene test without filling it in', () => {
    const answers = { 'phase:1:choice': 'Mostly toward', 'phase:6:choice': 'Options' };
    const prompt = metaProgramTestPrompt(answers, 'King');
    expect(prompt).toContain('King');
    expect(prompt).toContain('Mostly toward');
    expect(prompt).toContain('explore alternatives');
    expect(metaProgramProfile(answers).scene.response).toBe('');
  });
  it('keeps optional tool choices, dialogue, and scene effects in the saved profile', () => {
    const node = make({ 'mp:creativeRole:choice': 'Dreamer | Reviewer', 'mp:words:choice': 'Images | Sounds', 'mp:time:choice': 'Both', 'mp:turningPoints:choice': 'Support from another person', 'mp:dialogue': 'What would peace look like?', 'mp:success': 'The villages cooperate.', 'mp:setback': 'The bridge remains closed.' });
    const profile = node.narrativeWizard.metaProgramProfile;
    expect(profile.creativeRoles).toEqual(['Dreamer', 'Reviewer']);
    expect(profile.words).toEqual(['Images', 'Sounds']);
    expect(profile.timeFocus).toBe('Both');
    expect(profile.scene.setback).toContain('bridge');
    expect(profile.dialogue).toContain('peace');
  });
  it('updates in place and retains unrelated character questions and nested mechanics/story content', () => {
    const before = make({ 'phase:1:choice': 'Toward', 'phase:1': 'Original note' });
    before.questions.push({ id: 'custom', prompt: 'Keep this', answer: 'Original custom answer' });
    before.sub = { nodes: { keep: { id: 'keep', title: 'Another idea' } }, edges: [{ from: 'keep', to: 'keep' }] };
    const addition = make({ 'phase:1:choice': 'Mostly toward', 'phase:1': 'Updated note', 'mp:response': 'Ask the council for alternatives.' });
    const after = reviseWizardResult(before, addition, source);
    expect(after.id).toBe(before.id);
    expect(after.questions.find(row => row.id === 'custom').answer).toBe('Original custom answer');
    expect(after.sub).toEqual(before.sub);
    expect(after.narrativeWizard.metaProgramProfile.motivation).toBe('Mostly toward');
    expect(after.body).not.toContain('Original note');
  });
  it('preserves the workshop through library insertion and another saved framework on the same plan', () => {
    const node = make({ 'mp:explanations:choice': 'Facts and evidence | Clear steps', 'mp:response': 'Compare the evidence.' }, 'communication');
    const fate = FRAMEWORK_TYPES.fate;
    const addition = createWizardNode({ source: fate, type: 'framework', title: 'Invite the council', focus: 'communication', id: 'A', questions: frameworkQuestions(fate), answers: { 'phase:F': 'The bridge is unsafe.' } });
    const combined = appendWizardResult(node, addition);
    const record = wizardLibraryRecord(combined, 'LIB-MP');
    const inserted = buildNarrativeLinkInsertion({ concepts: { 'LIB-MP': record.entity } }, { type: 'concepts', id: 'LIB-MP' }, {});
    const metaRecord = inserted.narrativeWizardHistory.find(record => record.sourceId === 'nlpMetaPrograms');
    expect(savedWizardSession(inserted, {}, metaRecord).answers['mp:response']).toBe('Compare the evidence.');
    expect(metaRecord.metaProgramProfile.explanations).toHaveLength(2);
  });
});
