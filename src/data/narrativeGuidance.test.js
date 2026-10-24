import { describe, it, expect } from 'vitest';
import { FRAMEWORK_TYPES } from './seed.js';
import deployedLibrary from './deployedLibrary.json';
import { FRAMEWORK_GUIDANCE, CONCEPT_GUIDANCE, NARRATIVE_FOCUSES, narrativeGuidance, defaultNarrativeFocus, narrativeFit } from './narrativeGuidance.js';
import { frameworkQuestions, conceptQuestions, createWizardNode, appendWizardResult, wizardLibraryRecord } from '../lib/narrativeWizard.js';
import { buildNarrativeLinkInsertion } from '../lib/narrativeLinks.js';

describe('framework and concept use guidance', () => {
  it('covers every current framework and authored concept without changing their saved categories', () => {
    for (const source of Object.values(FRAMEWORK_TYPES)) expect(FRAMEWORK_GUIDANCE[source.id]).toBeTruthy();
    for (const source of Object.values(deployedLibrary.concepts)) expect(CONCEPT_GUIDANCE[source.id]).toBeTruthy();
    for (const guidance of [...Object.values(FRAMEWORK_GUIDANCE), ...Object.values(CONCEPT_GUIDANCE)]) {
      expect(guidance.best.length).toBeGreaterThan(0);
      expect([...guidance.best, ...guidance.useful].every(focus => NARRATIVE_FOCUSES[focus])).toBe(true);
      expect(guidance.useful.some(focus => guidance.best.includes(focus))).toBe(false);
    }
    const misplaced = deployedLibrary.concepts['LIB-CPT-N043'];
    expect(misplaced.category).toBe('characterConcept');
    expect(defaultNarrativeFocus(misplaced, 'concept')).toBe('communication');
  });
  it('recommends the subject of the reference instead of always recommending a character', () => {
    expect(defaultNarrativeFocus(FRAMEWORK_TYPES.fate, 'framework')).toBe('communication');
    expect(defaultNarrativeFocus(FRAMEWORK_TYPES.kolbLearningCycle, 'framework')).toBe('learning');
    expect(defaultNarrativeFocus(FRAMEWORK_TYPES.humanValues, 'framework')).toBe('values');
    expect(defaultNarrativeFocus(FRAMEWORK_TYPES.homeVoyageReturn, 'framework')).toBe('story');
    expect(defaultNarrativeFocus(FRAMEWORK_TYPES.nlpMetaModel, 'framework')).toBe('communication');
    expect(defaultNarrativeFocus(FRAMEWORK_TYPES.mmpi2CharacterProfile, 'framework')).toBe('character');
    expect(narrativeFit(FRAMEWORK_GUIDANCE.fate, 'character')).toBe('useful');
    expect(narrativeFit(FRAMEWORK_GUIDANCE.mmpi2CharacterProfile, 'style')).toBe('other');
  });
  it('recognises saved plans and future concepts without relying on the original IDs', () => {
    expect(defaultNarrativeFocus({ id: 'new', narrativeWizard: { focus: 'relationship' } }, 'concept')).toBe('relationship');
    expect(narrativeGuidance({ id: 'new', category: 'styleConcept' }, 'concept').best).toContain('style');
    expect(defaultNarrativeFocus(FRAMEWORK_TYPES.fate, 'framework', { kind: 'event' })).toBe('scene');
  });
});

describe('questions match the chosen writing task', () => {
  it.each(Object.values(FRAMEWORK_TYPES).map(source => [source.id, source]))('%s supports all purposes with usable questions', (_, source) => {
    for (const focus of Object.keys(NARRATIVE_FOCUSES)) {
      const rows = frameworkQuestions(source, {}, focus);
      expect(rows.length).toBeGreaterThan(0);
      expect(new Set(rows.map(row => row.key)).size).toBe(rows.length);
      expect(rows.every(row => row.prompt.trim() && !`${row.prompt} ${row.hint}`.includes('undefined'))).toBe(true);
    }
  });
  it('uses listeners, shared relationships, and experiences in the relevant framework paths', () => {
    const communication = frameworkQuestions(FRAMEWORK_TYPES.fate, {}, 'communication');
    expect(communication.find(row => row.key === 'phase:F').prompt).toContain('listener');
    expect(communication.some(row => row.prompt.includes('this character'))).toBe(false);
    const relationship = frameworkQuestions(FRAMEWORK_TYPES.humanValues, {}, 'relationship');
    expect(relationship.find(row => row.key === 'phase:Safety').prompt).toContain('sides differ');
    const learning = frameworkQuestions(FRAMEWORK_TYPES.kolbLearningCycle, {}, 'learning');
    expect(learning.find(row => row.key === 'phase:AE').prompt).toContain('test that idea');
  });
  it('keeps authored concept questions while adding purpose-specific starting questions', () => {
    const source = deployedLibrary.concepts['LIB-CPT-DRAGON'];
    const rows = conceptQuestions(source, 'relationship');
    expect(rows.find(row => row.key === 'focus:sides').prompt).toContain('people or groups');
    expect(rows.some(row => row.answerKey === 'dragon')).toBe(true);
    expect(rows.some(row => row.nodePath)).toBe(true);
  });
});

describe('saving plans and adding lenses', () => {
  const communication = () => createWizardNode({ id: 'new', source: FRAMEWORK_TYPES.fate, type: 'framework', focus: 'communication', title: 'A difficult briefing', questions: frameworkQuestions(FRAMEWORK_TYPES.fate, {}, 'communication'), answers: { 'phase:F': 'The flood will reach the village tonight.' } });
  it('saves non-character framework work as an editable plan with its reference and answers', () => {
    const node = communication();
    expect(node.kind).toBe('concept');
    expect(node.narrativeFocus).toBe('communication');
    expect(node.conceptKind).toBe('functionConcept');
    expect(node.referenceFrameworkIds).toEqual(['fate']);
    expect(Object.values(node.sub.nodes).some(child => child.frameworkId === 'fate')).toBe(true);
    expect(Object.values(node.sub.nodes).some(child => child.body === 'The flood will reach the village tonight.')).toBe(true);
    expect(node.questions).toBeUndefined();
    expect(node.narrativeWizard.version).toBe(2);
  });
  it('round-trips the plan through the library and narrative insertion', () => {
    const record = wizardLibraryRecord(communication(), 'LIB-PLAN');
    const inserted = buildNarrativeLinkInsertion({ concepts: { 'LIB-PLAN': record.entity } }, { type: 'concepts', id: 'LIB-PLAN' }, {}, { x: 10, y: 20 });
    expect(inserted.narrativeFocus).toBe('communication');
    expect(inserted.narrativeWizard.answers['phase:F']).toContain('flood');
    expect(inserted.sub.nodes.reference.frameworkId).toBe('fate');
  });
  it('adds a relationship/communication plan without converting an existing character or losing its inner tree', () => {
    const target = { id: 'C', kind: 'character', title: 'Mara', x: 13, questions: [{ id: 'q', answer: 'Original answer' }], body: 'Original story', sub: { nodes: { keep: { id: 'keep', title: 'Keep me' } }, edges: [{ from: 'keep', to: 'keep' }], frames: { F: { id: 'F' } } } };
    const before = structuredClone(target);
    const next = appendWizardResult(target, communication());
    expect(next.kind).toBe('character');
    expect(next.title).toBe('Mara');
    expect(next.x).toBe(13);
    expect(next.questions).toEqual(target.questions);
    expect(next.sub.nodes.keep).toEqual(target.sub.nodes.keep);
    expect(next.sub.edges).toEqual(target.sub.edges);
    expect(next.sub.frames).toEqual(target.sub.frames);
    expect(next.sub.nodes['WIZ-1'].kind).toBe('concept');
    expect(next.narrativeWizard.focus).toBe('communication');
    expect(target).toEqual(before);
  });
  it('can add notes to an event and save that event as an event template', () => {
    const target = { id: 'E', kind: 'event', title: 'Town meeting', body: 'Keep the event', customRule: 'keep', sub: { nodes: {}, edges: [] } };
    const next = appendWizardResult(target, communication());
    expect(next.customRule).toBe('keep');
    expect(next.questions).toBeUndefined();
    const record = wizardLibraryRecord(next, 'LIB-E');
    expect(record.coll).toBe('narrative');
    expect(record.entity.nodeKind).toBe('event');
    expect(record.entity.template.sub.nodes['WIZ-1'].narrativeFocus).toBe('communication');
  });
});
