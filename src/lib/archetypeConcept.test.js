import { describe, expect, it } from 'vitest';
import bundled from '../data/deployedLibrary.json';
import { STORY_ARCHETYPES, storyArchetype } from '../data/storyArchetypes.js';
import { archetypeBlend, archetypeConceptQuestions } from './archetypeConcept.js';
import { conceptQuestions, conceptRoles, createWizardNode, reviseWizardResult, wizardLibraryRecord, wizardSummary } from './narrativeWizard.js';
import { savedWizardSession } from './narrativeMemory.js';
import { narrativeGuidance } from '../data/narrativeGuidance.js';

describe('PDF-backed single-character archetypes', () => {
  it.each(Object.entries(STORY_ARCHETYPES))('%s has a complete reference, contextual starters and ordered source combinations', (key, reference) => {
    const source = bundled.concepts[reference.id];
    expect(storyArchetype(source)).toBe(reference);
    expect(reference.pages).toHaveLength(2);
    expect(reference.overview.length).toBeGreaterThan(100);
    expect(reference.blends.length).toBeGreaterThan(0);
    const before = structuredClone(source), questions = conceptQuestions(source, 'character');
    expect(questions.filter(row => row.archetypeField)).toHaveLength(8);
    expect(new Set(questions.map(row => row.key)).size).toBe(questions.length);
    expect(questions.every(row => row.hint && row.choices.length >= 3)).toBe(true);
    expect(questions.map(row => row.prompt).join(' ')).not.toMatch(/â|dragon|castle|who is this character/i);
    expect(conceptRoles(source)).toEqual([]);
    for (const row of questions.filter(row => row.nodePath)) expect(row.key).toBe(`node:${row.nodePath.join('/')}`);
    expect(narrativeGuidance(source, 'concept')).toMatchObject({ best: ['character'], useful: [] });
    expect(source).toEqual(before);
  });
  it('recognises naming variants without treating Hero & Guide or other structures as a single archetype', () => {
    expect(storyArchetype({ name: 'The sage' })).toBe(STORY_ARCHETYPES.sage);
    expect(storyArchetype({ name: 'Sage' })).toBe(STORY_ARCHETYPES.sage);
    expect(storyArchetype({ name: 'Hero & Guide' })).toBeNull();
    expect(storyArchetype({ name: 'Hero and the Guide' })).toBeNull();
    expect(storyArchetype({ name: 'Dragon & the City' })).toBeNull();
  });
  it('preserves directional combinations rather than inventing symmetric labels', () => {
    expect(archetypeBlend(STORY_ARCHETYPES.artist, 'Artist + Ruler = Trendsetter')?.name).toBe('Trendsetter');
    expect(archetypeBlend(STORY_ARCHETYPES.ruler, 'Ruler + Artist = Patron')?.name).toBe('Patron');
    expect(archetypeBlend(STORY_ARCHETYPES.sage, 'Sage + Artist = Stargazer')?.name).toBe('Stargazer');
    expect(archetypeBlend(STORY_ARCHETYPES.artist, 'Artist + Sage = Storyteller')?.name).toBe('Storyteller');
  });
  it('restores existing answer keys and keeps custom or removed-node writing available', () => {
    const source = bundled.concepts[STORY_ARCHETYPES.warrior.id];
    const original = [{ key: 'focus:subject', prompt: 'Original prompt' }, { key: 'node:old-node', prompt: 'An earlier custom question', nodePath: ['old-node'] }];
    const questions = archetypeConceptQuestions(source, conceptQuestions(source), original);
    expect(questions.filter(row => row.key === 'focus:subject')).toHaveLength(1);
    expect(questions.find(row => row.key === 'node:old-node').prompt).toBe('An earlier custom question');
    expect(original[0].prompt).toBe('Original prompt');
  });
  it('saves, reopens and revises choices, mix notes and manually edited descriptions without losing other character writing', () => {
    const source = bundled.concepts[STORY_ARCHETYPES.artist.id], questions = conceptQuestions(source);
    const gift = questions.find(row => row.archetypeField === 'gift'), blend = questions.find(row => row.archetypeField === 'blends');
    const answers = { 'focus:subject': 'Remember the ferry workers.', [gift.key]: 'A mural that restores their names.', [blend.choiceAnswerKey]: 'Artist + Sage = Storyteller', [blend.key]: 'Each portrait is based on a family’s memory.' };
    const node = createWizardNode({ id: 'A', source, type: 'concept', title: 'Pinky', focus: 'character', questions, answers });
    expect(node.kind).toBe('character');
    expect(node.narrativeWizard.summaryFormat).toBe('archetype-prose');
    expect(node.description).toContain('Remember the ferry workers');
    expect(node.description).toContain('Artist + Sage = Storyteller');
    expect(node.description).not.toContain(source.description);
    const reopened = savedWizardSession(node, { concepts: {} });
    expect(reopened.answers).toMatchObject(answers);
    const addition = createWizardNode({ id: 'A', source, type: 'concept', title: 'Pinky', focus: 'character', questions, answers: { ...answers, [gift.key]: 'A lantern trail of family memories.' }, narrativeText: 'Pinky paints the names the town chose to forget.' });
    node.questions.push({ id: 'custom', prompt: 'Private author detail', answer: 'Keep this too.' });
    const revised = reviseWizardResult(node, addition, source);
    expect(revised.questions.find(row => row.id === 'custom')?.answer).toBe('Keep this too.');
    expect(revised.narrativeWizard.narrativeText).toBe('Pinky paints the names the town chose to forget.');
    const copy = wizardLibraryRecord(revised, 'LIB-PINKY');
    expect(copy.coll).toBe('narrative');
    const resumed = savedWizardSession(copy.entity.template, { concepts: {} });
    expect(resumed.answers[gift.key]).toBe('A lantern trail of family memories.');
    expect(resumed.answers[blend.choiceAnswerKey]).toBe(answers[blend.choiceAnswerKey]);
    expect(resumed.answers[blend.key]).toBe(answers[blend.key]);
  });
  it('does not turn unused suggestions or reference shadows into authored character facts', () => {
    const source = bundled.concepts[STORY_ARCHETYPES.ruler.id];
    const summary = wizardSummary({ source, type: 'concept', title: 'Mara', focus: 'character', questions: conceptQuestions(source), answers: {} });
    expect(summary).toBe('Mara');
    expect(summary).not.toContain('Tyrant');
  });
});
