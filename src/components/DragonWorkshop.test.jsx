import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import DragonWorkshop, { DragonLiveDescription } from './DragonWorkshop.jsx';
import NarrativeWizard from './NarrativeWizard.jsx';
import BoundWizardFields from './BoundWizardFields.jsx';
import bundled from '../data/deployedLibrary.json';
import { dragonQuestions, dragonKey } from '../lib/dragonWorkshop.js';
import { makeEmptyProject } from '../data/seed.js';

vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });
const store = vi.hoisted(() => ({ project: null, library: null }));
vi.mock('../state/store.jsx', () => ({ useGame: () => store.project, useLibrary: () => store.library, useDispatch: () => vi.fn(), useLibraryDispatch: () => vi.fn() }));
const source = bundled.concepts['LIB-CPT-DRAGON'];
const questions = dragonQuestions(source);
const answers = { [dragonKey('city')]: 'The market', [dragonKey('dragon')]: 'A famine', [dragonKey('defendPlan')]: 'Share the food stores', [dragonKey('attackPlan')]: 'Find the cause' };

describe('Dragon focused workshop UI', () => {
  it('uses the dedicated workshop from the existing Story Wizard entry point', () => {
    store.project = makeEmptyProject('UI test'); store.library = bundled;
    const html = renderToStaticMarkup(<NarrativeWizard initialSource={source} initialType="concept" onClose={() => {}} />);
    expect(html).toContain('Dragon &amp; the City · Focused Workshop');
    expect(html).toContain('Dragon concept sections');
    expect(html).toContain('What is good and valuable here?');
    expect(html).toContain('What is unfair, broken or wasteful?');
    expect(html).toContain('Live concept description');
    expect(html).not.toContain('Continue question by question');
  });

  it('has a full-screen dialog, section navigation and an always-present right preview', () => {
    const html = renderToStaticMarkup(<DragonWorkshop source={source} title="The market" answers={answers} questions={questions} focus="scene" targetId="" onClose={() => {}} onAnswer={() => {}} />);
    expect(html).toContain('nw-fullscreen dragon-workshop');
    for (const text of ['City', 'Dragon', 'Responses', 'People &amp; stakes', 'Review', 'Name this version', 'Concept at a glance']) expect(html).toContain(text);
    expect(html).toContain('dragon-body');
  });

  it('highlights the selected answer and keeps all three routes labelled as possibilities', () => {
    const html = renderToStaticMarkup(<DragonLiveDescription answers={answers} questions={questions} activeKey={dragonKey('defendPlan')} section="responses" route="defend" onSelect={() => {}} />);
    expect(html).toContain('dragon-highlight'); expect(html).toContain('Share the food stores');
    expect(html).toContain('Attack · possible response'); expect(html).toContain('A famine');
    expect(html).toContain('data-dragon-part="dragon:defendPlan"');
    expect(html).toContain('Escape · Defend · Attack');
  });

  it('offers direct native-field edits while retaining free-form writing', () => {
    const Field = ({ label, value }) => <label>{label}<textarea readOnly value={value} /></label>;
    const html = renderToStaticMarkup(<BoundWizardFields node={{ title: 'The dragon', body: 'Keep this authored detail.', wizardFieldGeneratedBody: 'Earlier generated body', wizardFields: { a: { prompt: 'What drives it?', answer: 'Hunger' }, b: { prompt: 'What limits it?', answer: 'Winter' } } }} onPatch={() => {}} Field={Field}><span>Native character fields</span></BoundWizardFields>);
    expect(html).toContain('What drives it?'); expect(html).toContain('Hunger'); expect(html).toContain('Winter');
    expect(html).toContain('Keep this authored detail.'); expect(html).toContain('Other node details');
    expect(html).not.toContain('Native character fields');
  });
});
