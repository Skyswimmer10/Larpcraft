import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import CharacterQuestions, { characterQuestionGroups, CharacterQuestionPanel } from './CharacterQuestions.jsx';
import { appendWizardResult, createWizardNode } from '../lib/narrativeWizard.js';
import { FRAMEWORK_TYPES, makeEmptyProject } from '../data/seed.js';
import { savedWizardSession } from '../lib/narrativeMemory.js';
import { reducer } from '../state/reducer.js';

const make = (id, source, prompt, answer) => createWizardNode({ id, title: 'Uno', source, type: source.id === 'ARTIST' ? 'concept' : 'framework', focus: 'character', questions: [{ key: 'q', prompt }], answers: { q: answer } });
const fixture = () => appendWizardResult(appendWizardResult(make('C', FRAMEWORK_TYPES.fate, 'Which sound captures attention?', 'Footsteps.'), make('NLP', FRAMEWORK_TYPES.nlpMetaPrograms, 'How do they process information?', 'In detail.')), make('SECOND', FRAMEWORK_TYPES.fate, 'What changes at sunrise?', 'They become calm.'));

describe('source-based saved character questions', () => {
  it('groups repeated framework sessions without losing their questions and starts with the source chooser', () => {
    const node = fixture(), before = JSON.stringify(node);
    const groups = characterQuestionGroups(node);
    expect(groups.find(group => group.key === 'framework:fate').rows).toHaveLength(2);
    expect(groups.find(group => group.key === 'framework:nlpMetaPrograms').rows).toHaveLength(1);
    const html = renderToStaticMarkup(<CharacterQuestions node={node} onPatch={() => {}} />);
    expect(html).toContain('data-symbol="fate"'); expect(html).toContain('data-symbol="preferences"');
    expect(html).toContain('2 questions'); expect(html).toContain('1 question');
    expect(html).not.toContain('Which sound captures attention?'); expect(html).not.toContain('How do they process information?');
    expect(html).not.toContain('<textarea');
    expect(JSON.stringify(node)).toBe(before);
  });

  it('shows only the chosen source and preserves the original session when its answer is edited', () => {
    const node = fixture(), group = characterQuestionGroups(node).find(group => group.key === 'framework:nlpMetaPrograms');
    const html = renderToStaticMarkup(<CharacterQuestionPanel group={group} questions={node.questions} onPatch={() => {}} />);
    expect(html).toContain('How do they process information?'); expect(html).toContain('In detail.');
    expect(html).not.toContain('Which sound captures attention?'); expect(html).not.toContain('What changes at sunrise?');
    let updated;
    const panel = CharacterQuestionPanel({ group, questions: node.questions, onPatch: patch => {
      updated = reducer({ ...makeEmptyProject(), nodes: { C: node } }, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'C', patch }).nodes.C;
    } });
    panel.props.children[1][0].props.children.find(child => child?.props?.label === 'Answer').props.onCommit('They start with the overall picture.');
    expect(savedWizardSession(updated, {}, group.rows[0].record).answers.q).toBe('They start with the overall picture.');
    const fate = characterQuestionGroups(updated).find(group => group.key === 'framework:fate');
    expect(fate.rows.map(row => row.question.answer)).toEqual(['Footsteps.', 'They become calm.']);
  });

  it('retains concept identities, excluded sources and personal questions as separate editable groups', () => {
    const concept = { id: 'ARTIST', conceptId: 'LIB-CPT-N033', name: 'Artist', category: 'characterConcept' };
    let node = appendWizardResult(fixture(), make('ART', concept, 'What do they create?', 'Masks.'));
    node = { ...node, questions: [...node.questions, { id: 'PERSONAL', prompt: 'A private question', answer: 'An answer.' }], characterProfile: { ...node.characterProfile, excluded: ['wizard:ART:wizard'] } };
    const groups = characterQuestionGroups(node), personal = groups.find(group => group.key === 'personal');
    expect(personal.rows.some(row => row.question.id === 'PERSONAL')).toBe(true);
    expect(groups.find(group => group.key === 'concept:ARTIST').rows[0].question.answer).toBe('Masks.');
    expect(renderToStaticMarkup(<CharacterQuestions node={node} onPatch={() => {}} />)).toContain('data-symbol="artist"');
    const html = renderToStaticMarkup(<CharacterQuestionPanel group={personal} questions={node.questions} onPatch={() => {}} />);
    expect(html).toContain('A private question'); expect(html).toContain('Remove question'); expect(html).toContain('Add question');
    expect(html).not.toContain('What do they create?');
  });
});
