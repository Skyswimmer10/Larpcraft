import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CharacterProfile from './CharacterProfile.jsx';
import CharacterFacts from './CharacterFacts.jsx';
import { CharacterWorkspaceContents } from './CharacterWorkspace.jsx';
import { CharacterQuestionPanel, characterQuestionGroups } from './CharacterQuestions.jsx';
import { createWizardNode, appendWizardResult } from '../lib/narrativeWizard.js';
import { FRAMEWORK_TYPES, makeEmptyProject } from '../data/seed.js';
import { characterInputSnapshot, characterProfilePatch } from '../lib/characterProfile.js';

const fixture = vi.hoisted(() => ({ game: null, library: { narrative: {} }, buttons: [] }));
vi.mock('../state/store.jsx', () => ({ useGame: () => fixture.game, useLibrary: () => fixture.library, useDispatch: () => vi.fn(), useLibraryDispatch: () => vi.fn() }));
vi.mock('./NarrativeWizard.jsx', () => ({ NarrativeWizardButton: props => { fixture.buttons.push(props); return <button className={props.className} aria-label={props.ariaLabel} data-target={props.targetId || props.resumeNode?.id} data-session={props.resumeRecord?.sessionId}>{props.label}</button>; } }));

const make = (id, title, answer) => createWizardNode({ source: FRAMEWORK_TYPES.fate, type: 'framework', id, title, focus: 'character', questions: [{ key: 'phase:E', prompt: 'Which feeling returns?' }], answers: { 'phase:E': answer } });

describe('Character development controls', () => {
  it('puts the saved wizard between inclusion and deletion on each compact input card', () => {
    const node = appendWizardResult(make('C', 'Mira', 'They welcome travellers.'), make('OTHER', 'Their exception', 'They avoid strangers after dark.'));
    fixture.game = { ...makeEmptyProject(), nodes: { C: node } };
    const html = renderToStaticMarkup(<CharacterProfile node={node} onPatch={() => {}} />);
    expect(html).toContain('Edit wizard: FATE · Mira');
    expect(html).toContain('Edit wizard: FATE · Their exception');
    expect(html).toContain('data-session="C:wizard"');
    expect(html).toContain('data-session="OTHER:wizard"');
    expect(html).not.toContain('They welcome travellers.');
    expect(html).not.toContain('They avoid strangers after dark.');
    expect(html).not.toContain('Compare inputs');
    expect(html.match(/>Edit wizard<\/button>/g)).toHaveLength(2);
    expect(html.indexOf('data-session="C:wizard"')).toBeGreaterThan(html.indexOf('type="checkbox"'));
    expect(html.indexOf('data-session="C:wizard"')).toBeLessThan(html.indexOf('class="cp-input-delete"'));
    expect(html).toContain('Edit Character’s Profile');
    expect(html.match(/class="cp-input-delete"/g)).toHaveLength(2);
    expect(html).toContain('Delete FATE input: Mira');
    expect(html).not.toContain('>Voice and dialogue</button>');
    expect(html).not.toContain('>Export text</button>');
    expect(html).not.toContain('Review and edit individual passages');
    expect(html).not.toContain('<textarea');
  });

  it('offers explicit activation for an older authored character', () => {
    const node = { id: 'OLD', kind: 'character', title: 'An older character', body: 'Keep these words.' };
    fixture.game = { ...makeEmptyProject(), nodes: { OLD: node } };
    const html = renderToStaticMarkup(<CharacterProfile node={node} onPatch={() => {}} />);
    expect(html).toContain('Combine into a living character description');
    const workspace = renderToStaticMarkup(<CharacterWorkspaceContents node={node} graph={fixture.game} view="profile" />);
    expect(workspace).toContain('Keep these words.');
    expect(node.characterProfile).toBeUndefined();
  });

  it('shows compact facts first with short relationship names, without the old personality fields', () => {
    const node = { id: 'C', kind: 'character', title: 'Uno', characterFacts: { gender: 'Man', race: 'Human', age: '41', role: 'Gatekeeper', goal: 'Guard the bridge', relationships: [{ id: 'r', type: 'Loyal to', name: 'King' }] } };
    fixture.game = { ...makeEmptyProject(), nodes: { C: node } };
    const html = renderToStaticMarkup(<CharacterFacts node={node} onPatch={() => {}} />);
    expect(html).toContain('>Add image</button>');
    expect(html.indexOf('>Add image</button>')).toBeLessThan(html.indexOf('Name / title'));
    expect(html).not.toContain('cp-character-portrait');
    const withImage = renderToStaticMarkup(<CharacterFacts node={{ ...node, image: { dataUrl: 'data:image/png;base64,portrait' } }} onPatch={() => {}} />);
    expect(withImage).toContain('src="data:image/png;base64,portrait"');
    expect(withImage.indexOf('cp-character-portrait')).toBeLessThan(withImage.indexOf('Name / title'));
    expect(withImage).toContain('>Change image</button>'); expect(withImage).toContain('>Remove image</button>');
    expect(html.indexOf('Name / title')).toBeLessThan(html.indexOf('Story role'));
    for (const label of ['Gender', 'Race', 'Age', 'Goal / motivation', 'Loyal to', 'King']) expect(html).toContain(label);
    expect(html).not.toContain('Background');
    expect(html).not.toContain('Secrets');
    expect(html).not.toContain('textarea');
  });

  it('keeps duplicate character titles distinguishable by their concepts', () => {
    const first = make('C', 'Uno', 'They welcome travellers.');
    const second = createWizardNode({ source: { id: 'promise', name: 'A promise', category: 'characterConcept' }, type: 'concept', id: 'P', title: 'Uno', focus: 'character', questions: [{ key: 'q', prompt: 'What promise?' }], answers: { q: 'Protect their sister' } });
    const node = appendWizardResult(first, second);
    fixture.game = { ...makeEmptyProject(), nodes: { C: node } };
    const html = renderToStaticMarkup(<CharacterProfile node={node} onPatch={() => {}} />);
    expect(html).toContain('Edit wizard: FATE · Uno');
    expect(html).toContain('Edit wizard: A promise · Uno');
  });

  it('offers a large voice editor and retains populated older notes away from the compact inspector', () => {
    const node = { id: 'C', kind: 'character', title: 'Uno', characterProfile: { details: { voice: 'They speak softly.', secrets: 'They hid the key.' } } };
    const voice = renderToStaticMarkup(<CharacterWorkspaceContents node={node} graph={{}} view="voice" />);
    expect(voice).toContain('rows="24"');
    expect(voice).toContain('They speak softly.');
    const earlier = renderToStaticMarkup(<CharacterWorkspaceContents node={node} graph={{}} view="earlier" />);
    expect(earlier).toContain('They hid the key.');
    expect(earlier).not.toContain('Earlier note: Background');
  });

  it('keeps every linked framework session editable from its compact card', () => {
    const input = appendWizardResult(make('INPUT', 'Uno', 'They welcome travellers.'), createWizardNode({ source: { id: 'promise', name: 'A promise', category: 'characterConcept' }, type: 'concept', id: 'P', title: 'Uno', focus: 'character', questions: [{ key: 'q', prompt: 'What promise?' }], answers: { q: 'They protect their sister.' } }));
    const node = characterProfilePatch({ id: 'C', kind: 'character', title: 'Uno', body: '' }, { nodes: { INPUT: input } }, { links: [{ nodeId: 'INPUT', snapshot: characterInputSnapshot(input) }] });
    fixture.game = { ...makeEmptyProject(), nodes: { C: node, INPUT: input } };
    fixture.buttons = [];
    const html = renderToStaticMarkup(<CharacterProfile node={node} onPatch={() => {}} />);
    expect(html).toContain('>Edit FATE</button>');
    expect(html).toContain('>Edit A promise</button>');
    expect(html).not.toContain('cp-comparison-text');
    const editors = fixture.buttons.filter(button => button.resumeRecord);
    expect(editors).toHaveLength(2);
    expect(editors.every(button => button.resumeNode === input)).toBe(true);
    expect(editors.map(button => button.resumeRecord.sessionId)).toEqual(['INPUT:wizard', 'P:wizard']);
  });

  it('shows complete saved prompts and merges format/sharing controls into the profile without duplicate prose', () => {
    const prompt = 'What do they want, and why right now, when the bridge has just been closed to every visitor?';
    const node = { id: 'C', kind: 'character', title: 'Uno', body: 'One combined description.', questions: [{ id: 'Q', prompt, answer: 'To let their sister cross.' }] };
    const questions = renderToStaticMarkup(<CharacterWorkspaceContents node={node} graph={{}} view="questions" />);
    expect(questions).toContain('Personal questions');
    expect(questions).not.toContain(prompt);
    const panel = renderToStaticMarkup(<CharacterQuestionPanel group={characterQuestionGroups(node)[0]} questions={node.questions} onPatch={() => {}} />);
    expect(panel).toContain(`<h4 class="cp-question-prompt">${prompt}</h4>`);
    const output = renderToStaticMarkup(<CharacterWorkspaceContents node={node} graph={{}} view="profile" />);
    expect(output).toContain('AI dialogue and story context');
    expect(output).toContain('Download text');
    expect(output).toContain('One combined description.');
    expect(output).toContain('Combined character description');
    expect(output).toContain('Short introduction'); expect(output).toContain('Copy text');
    expect(output).not.toContain('>Export</button>');
    expect(output.match(/One combined description\./g)).toHaveLength(1);
    expect(output.indexOf('Output format')).toBeGreaterThan(output.indexOf('Combined character description'));
  });
});
