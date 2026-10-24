import { describe, expect, it } from 'vitest';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { frameworkQuestions, conceptQuestions, createWizardNode, appendWizardResult, reviseWizardResult, wizardLibraryRecord } from './narrativeWizard.js';
import { questionAnswer, recordedAnswers, questionMemory, savedWizardSession, savedWizardSessions } from './narrativeMemory.js';
import { buildNarrativeLinkInsertion } from './narrativeLinks.js';

const king = FRAMEWORK_TYPES.jungianMasculineArchetypes;
const makeCharacter = (answers = {}, extra = {}) => createWizardNode({ source: king, type: 'framework', focus: 'character', title: 'Mara', id: 'C', answers: { archetype: 'King', ...answers }, questions: frameworkQuestions(king, { archetype: 'King', ...answers }, 'character'), ...extra });
const memoryAt = (source, answers, key, type = 'framework') => {
  const questions = type === 'framework' ? frameworkQuestions(source, answers) : conceptQuestions(source);
  return questionMemory({ source, type, questions, answers, active: questions.find(row => row.key === key) });
};

describe('a choice guides later questions', () => {
  it('can open every framework before any answer or preference has been chosen', () => {
    for (const source of Object.values(FRAMEWORK_TYPES)) {
      const questions = frameworkQuestions(source);
      for (const active of questions) {
        const memory = questionMemory({ source, type: 'framework', questions, answers: {}, active });
        expect(`${memory.guidance}`).not.toContain('undefined');
        expect(memory.selections).toEqual([]);
      }
    }
  });
  it('uses the King reference to ask about fair leadership, its actual shadows, and its developing form', () => {
    const rows = frameworkQuestions(king, { archetype: 'King' });
    expect(rows.find(row => row.key === 'strength').prompt).toContain('fair order');
    expect(rows.find(row => row.key === 'root').prompt).toContain('Divine Child');
    expect(rows.find(row => row.key === 'activeShadow').prompt).toContain('Tyrant');
    expect(rows.find(row => row.key === 'passiveShadow').prompt).toContain('Weakling');
    expect(rows.find(row => row.key === 'shadowScene').prompt).toContain('King');
    const memory = memoryAt(king, { archetype: 'King', strength: 'She shares authority with the council.' }, 'activeShadow');
    expect(memory.selections).toContainEqual({ label: 'Archetype', value: 'King' });
    expect(memory.earlier.some(row => row.answer.includes('council'))).toBe(true);
    expect(memory.guidance).toContain('Tyrant');
  });
  it.each(['jungianMasculineArchetypes', 'jungianFeminineArchetypes'])('uses all actual forms from %s without mixing archetypes', id => {
    const source = FRAMEWORK_TYPES[id];
    for (const phase of source.phases) {
      const rows = frameworkQuestions(source, { archetype: phase.key });
      expect(rows.find(row => row.key === 'strength').prompt).toContain(phase.key);
      expect(rows.find(row => row.key === 'activeShadow').prompt).toContain(phase.adultActiveShadow);
      expect(rows.find(row => row.key === 'passiveShadow').prompt).toContain(phase.adultPassiveShadow);
      expect(rows.some(row => `${row.prompt} ${row.hint}`.includes('undefined'))).toBe(false);
      if (!phase.descriptions.child) expect(rows.some(row => row.key === 'root')).toBe(false);
    }
  });
  it('uses the two chosen relationship roles and their reference descriptions', () => {
    const rows = frameworkQuestions(king, { archetype: 'King', otherRole: 'Warrior' }, 'relationship');
    const strength = rows.find(row => row.key === 'strength');
    expect(strength.prompt).toContain('King');
    expect(strength.prompt).toContain('Warrior');
    expect(strength.hint).toContain('courage');
  });
  it('keeps a preference choice separate from prose and uses its actual reference', () => {
    const source = FRAMEWORK_TYPES.nlpMetaPrograms;
    const row = frameworkQuestions(source).find(row => row.key === 'phase:1');
    const answers = { [row.choiceAnswerKey]: 'Away From', [row.key]: 'She is trying to prevent a border war.' };
    expect(questionAnswer(row, answers)).toContain('Away From');
    expect(questionAnswer(row, answers)).toContain('border war');
    expect(memoryAt(source, answers, row.key).guidance).toContain('avoided');
    expect(answers[row.key]).toBe('She is trying to prevent a border war.');
  });
  it('brings the recorded idea into Kolb experimentation without inventing an answer', () => {
    const answers = { 'phase:AC': 'A wider base makes our bridge more stable.' };
    const memory = memoryAt(FRAMEWORK_TYPES.kolbLearningCycle, answers, 'phase:AE');
    expect(memory.guidance).toContain('Test the idea you recorded');
    expect(memory.earlier[0].answer).toBe(answers['phase:AC']);
    expect(answers['phase:AE']).toBeUndefined();
  });
  it('connects all other framework paths to earlier work', () => {
    for (const source of Object.values(FRAMEWORK_TYPES).filter(source => source.layout !== 'archetypes')) {
      const questions = frameworkQuestions(source);
      const phaseRows = questions.filter(row => row.key.startsWith('phase:'));
      const answers = { [phaseRows[0].key]: 'My earlier decision.' };
      const memory = questionMemory({ source, type: 'framework', questions, answers, active: phaseRows[1] });
      expect(memory.guidance, source.id).not.toBe('');
      expect(memory.earlier.some(row => row.answer === 'My earlier decision.'), source.id).toBe(true);
    }
  });
  it('carries adapted concept roles and earlier answers into later questions', () => {
    const source = { name: 'Dragon & the City', questions: [{ key: 'dragon', label: 'Dragon?' }, { key: 'city', label: 'City?' }] };
    const questions = conceptQuestions(source);
    const memory = questionMemory({ source, type: 'concept', questions, answers: { 'question:dragon': 'Debt' }, active: questions.find(row => row.key === 'question:city'), roles: [{ label: 'The threat', original: 'dragon', replacement: 'Debt' }] });
    expect(memory.selections[0].value).toBe('Debt');
    expect(memory.earlier.some(row => row.answer === 'Debt')).toBe(true);
    expect(memory.guidance).toContain('earlier answers');
  });
  it('uses recorded archetype work as background when adding another framework', () => {
    const target = makeCharacter({ strength: 'A fair council leader.' });
    const source = FRAMEWORK_TYPES.fate;
    const questions = frameworkQuestions(source);
    const memory = questionMemory({ source, type: 'framework', questions, answers: {}, active: questions[0], target });
    expect(memory.prior[0].archetype.key).toBe('King');
    expect(memory.prior[0].answers.some(row => row.answer.includes('fair council'))).toBe(true);
  });
});

describe('saved wizard continuation', () => {
  it('round-trips choices, notes, and question keys through a reusable template', () => {
    const node = makeCharacter({ 'archetype:notes': 'A village leader, not a royal title.', activeShadow: 'Punishes criticism.' });
    const stored = wizardLibraryRecord(node, 'LIB-C').entity.template;
    const session = savedWizardSession(stored, {});
    expect(session.source).toBe(king);
    expect(session.answers.archetype).toBe('King');
    expect(session.answers['archetype:notes']).toContain('village');
    expect(session.answers.activeShadow).toBe('Punishes criticism.');
    expect(recordedAnswers(session.record.questions, session.answers).some(row => row.answer.includes('King\n\nA village'))).toBe(true);
  });
  it('reads later edits to ordinary character answers when continuing', () => {
    const node = makeCharacter({ strength: 'Original answer' });
    node.questions.find(row => row.id === node.narrativeWizard.questionIds.strength).answer = 'Edited in inspector';
    expect(savedWizardSession(node, {}).answers.strength).toBe('Edited in inspector');
  });
  it('restores prose edited in a combined choice/notes field without losing the recorded choice', () => {
    const node = makeCharacter({ 'archetype:notes': 'Original note' });
    node.questions.find(row => row.id === node.narrativeWizard.questionIds.archetype).answer = 'King\n\nChanged in inspector';
    const session = savedWizardSession(node, {});
    expect(session.answers.archetype).toBe('King');
    expect(session.answers['archetype:notes']).toBe('Changed in inspector');
  });
  it('restores edits to framework answer nodes and allows another wizard edit afterward', () => {
    const source = FRAMEWORK_TYPES.fate;
    const make = answer => createWizardNode({ source, type: 'framework', focus: 'communication', title: 'A message', id: 'M', questions: frameworkQuestions(source), answers: { 'phase:F': answer } });
    const node = make('Original');
    node.sub.nodes['answer-1'].body = 'Edited on the canvas';
    const session = savedWizardSession(node, {});
    expect(session.answers['phase:F']).toBe('Edited on the canvas');
    const revised = reviseWizardResult({ ...node, narrativeWizard: { ...session.record, answers: session.answers } }, make('Changed again in wizard'), source);
    expect(revised.sub.nodes['answer-1'].body).toBe('Changed again in wizard');
  });
  it('keeps multiple saved framework sessions available without duplicate current entries', () => {
    const node = makeCharacter({ strength: 'Fair leader' });
    const source = FRAMEWORK_TYPES.fate;
    const addition = createWizardNode({ source, type: 'framework', focus: 'communication', title: 'Briefing', id: 'A', questions: frameworkQuestions(source), answers: { 'phase:F': 'Flood warning' } });
    const target = appendWizardResult(node, addition);
    const sessions = savedWizardSessions(target, {});
    expect(sessions.map(session => session.source.id)).toEqual(['jungianMasculineArchetypes', 'fate']);
    expect(sessions[0].answers.archetype).toBe('King');
  });
  it('preserves all questionnaire sessions when a plan is saved to the library and inserted again', () => {
    const first = FRAMEWORK_TYPES.fate;
    const second = FRAMEWORK_TYPES.kolbLearningCycle;
    const plan = createWizardNode({ source: first, type: 'framework', focus: 'communication', title: 'Bridge briefing', id: 'P', questions: frameworkQuestions(first), answers: { 'phase:F': 'The river is rising.' } });
    const addition = createWizardNode({ source: second, type: 'framework', focus: 'learning', title: 'Bridge discovery', id: 'A', questions: frameworkQuestions(second), answers: { 'phase:AE': 'Test a new bridge support.' } });
    const combined = appendWizardResult(plan, addition);
    const record = wizardLibraryRecord(combined, 'LIB-PLAN');
    const inserted = buildNarrativeLinkInsertion({ concepts: { 'LIB-PLAN': record.entity } }, { type: 'concepts', id: 'LIB-PLAN' }, {});
    const sessions = savedWizardSessions(inserted, {});
    expect(sessions.map(session => session.source.id)).toEqual(['fate', 'kolbLearningCycle']);
    expect(sessions[0].answers['phase:F']).toBe('The river is rising.');
    expect(sessions[1].answers['phase:AE']).toBe('Test a new bridge support.');
  });
  it('updates a character in place, including changed archetype prompts, without duplicating answers or losing manual fields', () => {
    const node = makeCharacter({ strength: 'Old strength', activeShadow: 'Old shadow' });
    node.questions.push({ id: 'custom', prompt: 'Hand-written question', answer: 'Keep this' });
    node.x = 731;
    node.custom = 'keep';
    const answers = { archetype: 'Warrior', strength: 'Guards the city with restraint.' };
    const addition = makeCharacter(answers);
    const updated = reviseWizardResult(node, addition, king);
    expect(updated.id).toBe(node.id);
    expect(updated.x).toBe(731);
    expect(updated.custom).toBe('keep');
    expect(updated.questions.find(row => row.id === node.narrativeWizard.questionIds.strength).prompt).toContain('Warrior');
    expect(updated.questions.find(row => row.id === 'custom').answer).toBe('Keep this');
    expect(updated.body).not.toContain('Old strength');
    expect(updated.body).toContain('Guards the city');
    const twice = reviseWizardResult(updated, addition, king);
    expect(twice.questions).toEqual(updated.questions);
    expect(twice.body).toBe(updated.body);
  });
  it('revises an attached plan while preserving its node ID, manual layout, connections, and unrelated inner nodes', () => {
    const source = FRAMEWORK_TYPES.fate;
    const make = answer => createWizardNode({ source, type: 'framework', focus: 'communication', title: 'Warning', id: 'A', questions: frameworkQuestions(source, {}, 'communication'), answers: { 'phase:F': answer } });
    const target = { id: 'C', kind: 'character', title: 'Existing', body: 'Original story', questions: [], sub: { nodes: { keep: { id: 'keep', body: 'Keep' } }, edges: [] } };
    const attached = appendWizardResult(target, make('Old warning'));
    const childId = attached.narrativeWizard.attachedChildId;
    const plan = attached.sub.nodes[childId];
    plan.sub.nodes['answer-1'].x = 999;
    plan.sub.edges.push({ from: 'reference', to: 'answer-1', label: 'Keep link' });
    const updated = reviseWizardResult(attached, make('New warning'), source);
    expect(Object.keys(updated.sub.nodes)).toEqual(['keep', childId]);
    expect(updated.sub.nodes[childId].id).toBe(childId);
    expect(updated.sub.nodes[childId].sub.nodes['answer-1'].x).toBe(999);
    expect(updated.sub.nodes[childId].sub.nodes['answer-1'].body).toBe('New warning');
    expect(updated.sub.nodes[childId].sub.edges).toEqual(plan.sub.edges);
    expect(updated.questions).toEqual([]);
    expect(updated.body).toContain('Original story');
    expect(updated.body).not.toContain('Old warning');
  });
  it('does not confuse an added earlier answer with the existing later answer node', () => {
    const source = FRAMEWORK_TYPES.kolbLearningCycle;
    const make = answers => createWizardNode({ source, type: 'framework', focus: 'learning', title: 'Bridge', id: 'B', questions: frameworkQuestions(source), answers });
    const before = make({ 'phase:AE': 'Test the bridge' });
    before.sub.nodes['answer-1'].x = 921;
    const after = reviseWizardResult(before, make({ 'phase:CE': 'Build a bridge', 'phase:AE': 'Test it with more weight' }), source);
    expect(after.sub.nodes['answer-1'].wizardQuestionKey).toBe('phase:AE');
    expect(after.sub.nodes['answer-1'].x).toBe(921);
    expect(after.sub.nodes['answer-1'].body).toBe('Test it with more weight');
    expect(Object.values(after.sub.nodes).some(node => node.wizardQuestionKey === 'phase:CE' && node.body === 'Build a bridge')).toBe(true);
  });
  it('can recover recorded questions when a concept source has been removed', () => {
    const source = { id: 'deleted', name: 'Lost concept', questions: [{ key: 'x', label: 'What changed?' }] };
    const node = createWizardNode({ source, type: 'concept', focus: 'story', title: 'My scene', questions: conceptQuestions(source), answers: { 'question:x': 'The gate opens.' }, id: 'C' });
    const session = savedWizardSession(node, {});
    expect(session.answers['question:x']).toBe('The gate opens.');
    expect(conceptQuestions(session.source)).toEqual(node.narrativeWizard.questions);
  });
});
