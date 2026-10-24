import { describe, expect, it } from 'vitest';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { metaProgramNarrative } from './metaProgramNarrative.js';
import { createWizardNode, frameworkQuestions, reviseWizardResult, wizardLibraryRecord, wizardSummary } from './narrativeWizard.js';
import { savedWizardSession } from './narrativeMemory.js';

const source = FRAMEWORK_TYPES.nlpMetaPrograms;
const make = (answers, extra = {}) => createWizardNode({ source, type: 'framework', focus: 'character', title: 'Mira', id: 'MIRA', questions: frameworkQuestions(source, answers), answers, ...extra });

describe('Meta Programs character prose', () => {
  it('turns preferences and scene details into one paragraph without question labels or model terms', () => {
    const answers = { 'phase:1:choice': 'Mostly toward', 'phase:3:choice': 'Reactive', 'phase:2:choice': 'External', 'phase:6:choice': 'Options | Procedures', 'mp:goal': 'Reach the village before the flood.', 'mp:response': 'Ask the council for two routes.', 'mp:dialogue': 'Can we reach them in time?', 'mp:challenge': 'The bridge is closed.' };
    const node = make(answers, { context: 'Mira is an envoy travelling between two villages.' });
    expect(node.body).toMatch(/^Mira is an envoy/);
    expect(node.body).toContain('They watch what happens');
    expect(node.body).toContain('They ask the council for two routes.');
    expect(node.body).toContain('when the bridge is closed.');
    expect(node.body).toContain('“Can we reach them in time?”');
    expect(node.body).not.toMatch(/\n|Working on:|Based on:|Reactive|External|Mostly toward|S\.C\.O\.R\.E\./);
    for (const question of node.narrativeWizard.questions) expect(node.body).not.toContain(question.prompt);
    expect(node.description).toBe(node.body);
    expect(savedWizardSession(node, {}).answers).toMatchObject(answers);
  });
  it('uses no unchosen traits, keeps full written responses and handles sparse or empty work', () => {
    expect(metaProgramNarrative({})).toBe('');
    expect(metaProgramNarrative({ answers: { 'mp:response': 'Mira refuses to abandon the village.' } })).toBe('Mira refuses to abandon the village.');
    expect(make({ 'phase:1': 'She wants the family home back.' }).body).toBe('She wants the family home back.');
  });
  it('only includes active exceptions and retains their conditions', () => {
    const body = make({ 'mp:exceptionIds': 'e2', 'mp:exception:e1:change': 'Removed exception', 'mp:exception:e2:when': 'An ally is threatened.', 'mp:exception:e2:change': 'Follow the rescue plan.' }).body;
    expect(body).toBe('When an ally is threatened, their usual pattern changes: follow the rescue plan.');
    expect(body).not.toContain('Removed');
  });
  it('keeps success and setbacks as possible outcomes and handles quoted dialogue', () => {
    const body = make({ 'mp:success': 'The villages share responsibility.', 'mp:setback': 'The crossing stays closed.', 'mp:dialogue': '“We can do this.”' }).body;
    expect(body).toContain('If they succeed, the villages share responsibility.');
    expect(body).toContain('If they fall short, the crossing stays closed.');
    expect(body).toContain('“We can do this.”');
    expect(body).not.toContain('..');
  });
  it('preserves an edited paragraph independently of answers through library save and continuation', () => {
    const answers = { 'phase:1:choice': 'Toward', 'phase:1': 'Seeks an alliance.' };
    const prose = 'Mira dreams of peace, but the broken bridge stands between her and the council.';
    const node = make(answers, { narrativeText: prose });
    const record = wizardLibraryRecord(node, 'LIB-MIRA');
    expect(record.entity.description).toBe(prose);
    const session = savedWizardSession(record.entity.template, {});
    expect(session.record.narrativeText).toBe(prose);
    expect(session.answers).toMatchObject(answers);
    expect(wizardSummary({ source, type: 'framework', focus: 'character', answers: { 'phase:1:choice': 'Away From' }, narrativeText: prose })).toBe(prose);
    expect(make(answers, { narrativeText: '' }).body).toBe('');
  });
  it('replaces an old technical result in place while retaining other work and structured answers', () => {
    const before = make({ 'phase:1:choice': 'Toward' });
    const technical = 'Mira\n\nWorking on: Character\n\nWhat drives this person?\nToward';
    before.body = `Handwritten introduction.\n\n${technical}`;
    before.description = before.body;
    before.narrativeWizard.summary = technical;
    before.questions.push({ id: 'keep', prompt: 'A custom question', answer: 'Keep this answer' });
    const next = reviseWizardResult(before, make({ 'phase:1:choice': 'Mostly away' }), source);
    expect(next.body).toContain('Handwritten introduction.');
    expect(next.body).toContain('They usually act to protect');
    expect(next.body).not.toContain('What drives this person?');
    expect(next.questions.find(row => row.id === 'keep').answer).toBe('Keep this answer');
    expect(savedWizardSession(next, {}).answers['phase:1:choice']).toBe('Mostly away');
  });
});
