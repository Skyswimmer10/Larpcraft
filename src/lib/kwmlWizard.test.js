import { describe, expect, it } from 'vitest';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { KWML_ID, KWML_KEYS, KWML_ENERGIES, KWML_BALANCED, kwmlKey, kwmlSteps, kwmlActive, kwmlSecondaries, kwmlDirections, kwmlPairChoices } from '../data/kwml.js';
import { kwmlInitialAnswers, kwmlToggleSecondary, kwmlSelectPrimary, kwmlHighlightedStrengths, kwmlQuestionRows, kwmlSaveAnswers, kwmlSummary } from './kwmlWizard.js';
import { createWizardNode, reviseWizardResult, wizardLibraryRecord } from './narrativeWizard.js';
import { savedWizardSession } from './narrativeMemory.js';

describe('combined King Warrior Magician Lover wizard', () => {
  it('limits secondaries, skips their step when absent and handles balanced mix without inventing a primary', () => {
    let answers = { archetype: 'King' };
    expect(kwmlSteps(answers).map(row => row.id)).not.toContain('supporting');
    answers = { ...answers, ...kwmlToggleSecondary(answers, 'Warrior') };
    answers = { ...answers, ...kwmlToggleSecondary(answers, 'Magician') };
    expect(kwmlSecondaries(answers)).toEqual(['Warrior', 'Magician']);
    expect(kwmlToggleSecondary(answers, 'Lover')).toEqual({});
    expect(kwmlToggleSecondary(answers, 'King')).toEqual({});
    expect(kwmlSteps(answers)).toHaveLength(6);
    const balanced = { ...answers, ...kwmlSelectPrimary(answers, KWML_BALANCED) };
    expect(kwmlActive(balanced)).toEqual(KWML_KEYS);
    expect(kwmlSecondaries(balanced)).toEqual([]);
    expect(kwmlSteps(balanced).map(row => row.id)).not.toContain('supporting');
  });
  it('retains per-energy branches when primary or supporting choices change', () => {
    const answers = { archetype: 'King', 'kwml:secondary': 'Warrior', [kwmlKey('King', 'strengths')]: KWML_ENERGIES.King.strengths[0], [kwmlKey('Warrior', 'strengths')]: KWML_ENERGIES.Warrior.strengths[1] };
    const switched = { ...answers, ...kwmlSelectPrimary(answers, 'Warrior') };
    expect(kwmlHighlightedStrengths(switched)).toEqual([`Warrior: ${KWML_ENERGIES.Warrior.strengths[1]}`]);
    expect(kwmlSaveAnswers(switched)[kwmlKey('King', 'strengths')]).toBe(answers[kwmlKey('King', 'strengths')]);
    const back = { ...switched, ...kwmlSelectPrimary(switched, 'King') };
    expect(kwmlHighlightedStrengths(back)).toHaveLength(2);
  });
  it('offers only relevant directional and pair effects, including precisely the supplied shadow pairs', () => {
    const answers = { archetype: 'Warrior', 'kwml:secondary': 'Magician | Lover' };
    expect(kwmlDirections(answers)).toHaveLength(3);
    expect(kwmlPairChoices(answers)).toHaveLength(3);
    expect(kwmlPairChoices(answers).some(row => row.keys.includes('King'))).toBe(false);
    const shadow = { ...answers, 'kwml:showDistortion': 'yes' };
    expect(kwmlDirections(shadow)).toHaveLength(9);
    const labels = kwmlPairChoices(shadow).map(row => row.label).join(' ');
    for (const phrase of ['Sadist + Trickster', 'Masochist + Innocent One', 'Sadist + Addict', 'Masochist + Impotent', 'Trickster + Addict', 'Innocent One + Impotent']) expect(labels).toContain(phrase);
    const all = kwmlPairChoices({ archetype: KWML_BALANCED, 'kwml:showDistortion': 'yes' });
    expect(all.filter(row => row.keys.join('+') === 'King+Warrior')).toHaveLength(1);
    expect(all.some(row => row.keys.join('+') === 'King+Magician' && row.side === 'passive')).toBe(false);
  });
  it('does not turn a shadow option or hidden history into a character fact', () => {
    const answers = { archetype: 'Lover', [kwmlKey('Lover', 'lean')]: 'Mature', [kwmlKey('Lover', 'historyEnabled')]: 'no', [kwmlKey('Lover', 'history')]: 'Do not show this history.', 'kwml:hook': '' };
    const summary = kwmlSummary({ title: 'Mira', answers });
    expect(summary).not.toContain('Addict'); expect(summary).not.toContain('Do not show');
    const option = kwmlDirections({ ...answers, 'kwml:showDistortion': 'yes' }).find(row => row.side === 'active').label;
    const hidden = { ...answers, 'kwml:directions': option, 'kwml:showDistortion': 'no' };
    expect(kwmlSummary({ title: 'Mira', answers: hidden })).not.toContain('Floods');
    expect(kwmlSaveAnswers(hidden)['kwml:directions']).toBe('');
  });
  it('round-trips a rich profile and explicit hook through save, library, reopen and revision', () => {
    const source = FRAMEWORK_TYPES[KWML_ID];
    const base = { archetype: 'King', 'kwml:secondary': 'Warrior | Magician', 'kwml:concept': 'A governor rebuilding a divided town.', [kwmlKey('King', 'strengths')]: KWML_ENERGIES.King.strengths[1], [kwmlKey('King', 'lean')]: 'Mild active shadow', [kwmlKey('Warrior', 'intensity')]: 'Mild', 'kwml:hook': 'Give up a private privilege to restore public trust.', 'kwml:aware': 'yes', 'kwml:stage': 'Functional' };
    const answers = { ...base, 'kwml:directions': kwmlDirections(base)[0].label, 'kwml:pairs': kwmlPairChoices(base)[0].label };
    const questions = kwmlQuestionRows(answers), before = structuredClone(answers);
    expect(new Set(questions.map(row => row.key)).size).toBe(questions.length);
    const node = createWizardNode({ source, type: 'framework', focus: 'character', title: 'Mira', id: 'M', questions, answers });
    expect(node.narrativeWizard.summaryFormat).toBe('kwml-prose');
    expect(node.body).toContain('Tyrant'); expect(node.body).toContain('Warrior');
    expect(node.body).toContain(answers['kwml:hook']); expect(answers).toEqual(before);
    const copy = wizardLibraryRecord(node, 'LIB-MIRA');
    const reopened = savedWizardSession(copy.entity.template, {});
    expect(reopened.answers['kwml:pairs']).toBe(answers['kwml:pairs']);
    expect(reopened.answers['kwml:highlights']).toContain('Empower rather than dominate');
    const edited = createWizardNode({ source, type: 'framework', focus: 'character', title: 'Mira', id: 'M', questions, answers, narrativeText: 'Mira learns to share authority.' });
    node.questions.push({ id: 'private', prompt: 'Private writing', answer: 'Keep this.' });
    const revised = reviseWizardResult(node, edited, source);
    expect(revised.narrativeWizard.narrativeText).toBe('Mira learns to share authority.');
    expect(revised.questions.find(row => row.id === 'private').answer).toBe('Keep this.');
  });
  it('retains earlier strength, root and shadow prose with its original primary context', () => {
    const answers = kwmlInitialAnswers({ archetype: 'Magician', strength: 'A careful healer.', root: 'Still afraid to ask questions.', activeShadow: 'Keeps dangerous knowledge secret.' });
    const changed = { ...answers, ...kwmlSelectPrimary(answers, 'King') };
    expect(changed['kwml:legacyPrimary']).toBe('Magician');
    const questions = kwmlQuestionRows(changed);
    expect(questions.find(row => row.key === 'root')).toBeTruthy();
    const summary = kwmlSummary({ title: 'Ryn', answers: changed, questions });
    expect(summary).toContain('Earlier writing (Magician)');
    expect(summary).toContain('Keeps dangerous knowledge secret.');
  });
});
