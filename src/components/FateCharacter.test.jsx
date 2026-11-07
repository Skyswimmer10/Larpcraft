import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import FateWizard from './FateWizard.jsx';
import { createFateDraft, editFate, fateOutput } from '../lib/fateWizard.js';
import { makeEmptyProject } from '../data/seed.js';
import { FateSignalEditor, FatePeopleEditor, FateCharacterPatterns, FateCharacterNavigation, FateCharacterPreview } from './FateCharacter.jsx';
import { fateCharacterEntities } from '../lib/fateCharacter.js';
import { createWizardNode } from '../lib/narrativeWizard.js';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { savedWizardSession } from '../lib/narrativeMemory.js';
import { fateQuestions, fateAnswers } from '../lib/fateWizard.js';

const fixture = vi.hoisted(() => ({ game: null }));
vi.mock('../state/store.jsx', () => ({ useGame: () => fixture.game, useLibrary: () => ({ concepts: {}, narrative: {} }), useDispatch: () => vi.fn(), useLibraryDispatch: () => vi.fn() }));
vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });

describe('FATE character screens', () => {
  it('keeps a live description in the right pane and updates from selections while protecting edited prose', () => {
    let draft = createFateDraft({ purpose: 'character', title: 'Uno' });
    draft = editFate(draft, 'focus.signals', [{ id: 'signal', label: 'Loud sounds', kind: 'attention', channel: 'Audio', strength: 2 }]);
    const initial = renderToStaticMarkup(<FateCharacterPreview draft={draft} />);
    expect(initial).toContain('They notice Loud sounds (brief pause).');
    draft = editFate(draft, 'output.text', 'My carefully edited character description.');
    draft = editFate(draft, 'focus.signals.0.strength', 5);
    const updated = renderToStaticMarkup(<FateCharacterPreview draft={draft} />);
    expect(updated).toContain('They notice Loud sounds (full concentration).');
    expect(updated).not.toContain('(brief pause)');
    expect(updated).toContain('Your edited description is kept');
    expect(fateOutput(draft)).toBe('My carefully edited character description.');
    const node = createWizardNode({ source: FRAMEWORK_TYPES.fate, type: 'framework', id: 'UNO', title: 'Uno', focus: 'character', fateDraft: draft, questions: fateQuestions(draft), answers: fateAnswers(draft) });
    fixture.game = { ...makeEmptyProject(), nodes: { UNO: node } };
    const html = renderToStaticMarkup(<FateWizard session={savedWizardSession(node, {})} onClose={() => {}} />);
    const sidebar = html.slice(html.indexOf('<aside class="fw-live-preview fc-ideas"'));
    expect(sidebar).toContain('Live character description');
    expect(sidebar).toContain('They notice Loud sounds (full concentration).');
    expect(sidebar).toContain('Selected ideas');
  });

  it('restores the colored character step navigation before the main editor and jumps to the selected step', () => {
    fixture.game = makeEmptyProject();
    const html = renderToStaticMarkup(<FateWizard initialPurpose="character" onClose={() => {}} />);
    const rail = html.slice(html.indexOf('<nav class="fc-step-nav"'), html.indexOf('</nav>') + 6);
    expect(rail).toContain('aria-label="Character FATE steps"');
    for (const label of ['Start', 'Focus', 'Authority', 'Tribe', 'Emotion', 'Character description']) expect(rail).toContain(label);
    for (const color of ['#B8A4F4', '#E8D25C', '#68B5F0', '#73CCB2', '#EF91B7', '#B7C7D8']) expect(rail).toContain(color);
    expect(rail.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html.indexOf('class="fc-step-nav"')).toBeLessThan(html.indexOf('<main'));
    expect(html).not.toContain('class="fw-stepper"');
    const onGo = vi.fn(), draft = editFate(createFateDraft({ purpose: 'character' }), 'lastStep', 'T');
    const navigation = FateCharacterNavigation({ draft, onGo });
    const buttons = navigation.props.children[1];
    expect(buttons.find(button => button.key === 'T').props['aria-current']).toBe('step');
    buttons.find(button => button.key === 'E').props.onClick();
    expect(onGo).toHaveBeenCalledWith('E');
  });

  it('opens with two prominent modes, a character name and a small header draft control', () => {
    fixture.game = makeEmptyProject();
    const html = renderToStaticMarkup(<FateWizard initialPurpose="character" onClose={() => {}} />);
    for (const value of ['Character profile', 'Communication / dialogue', 'Character name', 'Drafts &amp; saved work', 'Start exploring']) expect(html).toContain(value);
    expect(html.indexOf('Drafts &amp; saved work')).toBeLessThan(html.indexOf('class="fw-body"'));
    expect(html).not.toContain('Where should this be saved?');
    expect(html).not.toContain('Name this version');
    expect(html).not.toContain('Situation or background');
    expect(html).not.toContain('Overall scene intensity');
  });

  it('shows VAK groups and one unset or individually chosen slider per signal', () => {
    const d = editFate(createFateDraft({ purpose: 'character' }), 'focus.signals', [{ id: 'one', label: 'A shout', channel: 'Audio', kind: 'attention', strength: null }, { id: 'two', label: 'Touch', channel: 'Kinesthetic', kind: 'overlooked', strength: 1 }]);
    const html = renderToStaticMarkup(<FateSignalEditor draft={d} onEdit={() => {}} />);
    for (const word of ['Visual', 'Audio', 'Kinesthetic', 'Custom signal', 'Not chosen', 'Passing glance']) expect(html).toContain(word);
    expect(html.match(/type="range"/g)).toHaveLength(2);
  });

  it('keeps a new opening on the mode choices rather than automatically jumping into an unfinished draft', () => {
    const previous = editFate(createFateDraft({ purpose: 'character', title: 'Earlier draft', scope: { coll: 'nodes' } }), 'lastStep', 'E');
    fixture.game = { ...makeEmptyProject(), fateWizardDrafts: { [previous.id]: previous } };
    const html = renderToStaticMarkup(<FateWizard initialPurpose="character" onClose={() => {}} />);
    expect(html).toContain('Start exploring');
    expect(html).toContain('class="fp-types"');
    expect(html).not.toContain('Recurring emotional patterns');
    expect(fixture.game.fateWizardDrafts[previous.id].lastStep).toBe('E');
  });

  it('offers existing and name-only references in both Authority and Tribe, excluding non-characters', () => {
    fixture.game = { ...makeEmptyProject(), nodes: { B: { id: 'B', kind: 'character', title: 'Bernie' }, M: { id: 'M', kind: 'mechanic', title: 'Mechanic' } }, teams: { G: { id: 'G', name: 'Town guard' } } };
    const entities = fateCharacterEntities(fixture.game), draft = createFateDraft({ purpose: 'character' });
    for (const section of ['authority', 'tribe']) {
      const html = renderToStaticMarkup(<FatePeopleEditor draft={draft} section={section} entities={entities} onEdit={() => {}} />);
      expect(html).toContain('Bernie'); expect(html).toContain('Town guard'); expect(html).toContain('Enter a name instead');
      expect(html).not.toContain('Mechanic');
    }
  });

  it('keeps response, strength and exception in each emotional pattern card', () => {
    const d = editFate(createFateDraft({ purpose: 'character' }), 'emotion.patterns', [{ id: 'p', situation: 'A challenge', feelings: ['Fear'], direction: 'Pull away', intensity: 2, response: '', exception: 'A friend is nearby' }]);
    const html = renderToStaticMarkup(<FateCharacterPatterns draft={d} onEdit={() => {}} onTransition={() => {}} advanced preferences={{}} onRemember={() => {}} />);
    for (const text of ['What brings this pattern out?', 'What might they do with these feelings?', 'Feeling strength in pattern 1', 'A friend is nearby']) expect(html).toContain(text);
    expect(html).not.toContain('Feeling across the scene');
  });

  it.each(['F', 'A', 'T', 'E', 'review'])('renders the complete advanced %s screen when continuing saved work', stage => {
    let d = createFateDraft({ purpose: 'character', title: 'John' });
    d = editFate(d, 'meta.depth', 'advanced'); d = editFate(d, 'lastStep', stage);
    d = editFate(d, 'meta.locks.A', true);
    const node = createWizardNode({ source: FRAMEWORK_TYPES.fate, type: 'framework', id: 'J', title: 'John', focus: 'character', fateDraft: d, questions: fateQuestions(d), answers: fateAnswers(d) });
    fixture.game = { ...makeEmptyProject(), nodes: { J: node } };
    const html = renderToStaticMarkup(<FateWizard session={savedWizardSession(node, {})} onClose={() => {}} />);
    expect(html).not.toContain('Show all context');
    expect(html).not.toContain('Result format');
    expect(html).not.toContain('Feeling across the scene');
    if (stage === 'A') expect(html).toContain('Unlock step');
    if (stage === 'F') expect(html).toContain('Kinesthetic');
    if (stage === 'review') expect(html).toContain('Character description · FATE contribution');
  });
});
