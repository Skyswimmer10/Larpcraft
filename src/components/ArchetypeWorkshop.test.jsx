import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import NarrativeWizard from './NarrativeWizard.jsx';
import ArchetypeWorkshop from './ArchetypeWorkshop.jsx';
import bundled from '../data/deployedLibrary.json';
import { makeEmptyProject } from '../data/seed.js';
import { STORY_ARCHETYPES } from '../data/storyArchetypes.js';
import { conceptQuestions } from '../lib/narrativeWizard.js';

vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });
const store = vi.hoisted(() => ({ project: null, library: null }));
vi.mock('../state/store.jsx', () => ({ useGame: () => store.project, useLibrary: () => store.library, useDispatch: () => vi.fn(), useLibraryDispatch: () => vi.fn() }));

describe('archetype Character Canvas with optional mixer', () => {
  it.each(Object.values(STORY_ARCHETYPES).map(row => [row.label, row.id]))('%s opens the canvas directly without unrelated purpose choices or a roles screen', (_, id) => {
    store.project = makeEmptyProject('Archetype test'); store.library = bundled;
    const html = renderToStaticMarkup(<NarrativeWizard initialSource={bundled.concepts[id]} initialType="concept" onClose={() => {}} />);
    for (const text of ['Character Canvas', 'Archetype Mixer', 'Name this character', 'Live character description', 'Purpose', 'Behaviour', 'Gift to others', 'Voice']) expect(html).toContain(text);
    expect(html).toMatch(/role="tab" aria-selected="true"/);
    expect(html).not.toContain('Same story roles');
    expect(html).not.toContain('A threat could be a dragon');
    expect(html).not.toContain('Where will this help your story?');
    expect(html).not.toContain('Skip question');
    expect(html).not.toContain('â†');
  });
  it('keeps the mixer absent when the reference supplies no combinations', () => {
    const reference = STORY_ARCHETYPES.artist, original = reference.blends;
    try {
      reference.blends = [];
      const source = bundled.concepts[reference.id];
      const html = renderToStaticMarkup(<ArchetypeWorkshop source={source} title="Pinky" questions={conceptQuestions(source)} answers={{}} preview="" onClose={() => {}} />);
      expect(html).toContain('Character Canvas');
      expect(html).not.toContain('Archetype Mixer');
      expect(html).not.toContain('role="tablist"');
    } finally { reference.blends = original; }
  });
  it('explains the selected second archetype and offers concrete influences while keeping blend notes separate', () => {
    const source = bundled.concepts[STORY_ARCHETYPES.artist.id], questions = conceptQuestions(source);
    const row = questions.find(row => row.archetypeField === 'blends');
    const html = renderToStaticMarkup(<ArchetypeWorkshop source={source} title="Pinky" questions={questions} answers={{ [row.choiceAnswerKey]: 'Artist + Sage = Storyteller', [row.key]: 'The paintings preserve family memories.' }} preview="Pinky" onClose={() => {}} />);
    expect(html).toContain('What the Sage adds');
    expect(html).toContain('Check evidence before repeating a claim');
    expect(html).toContain('Storyteller: your version');
    expect(html).toContain('The paintings preserve family memories.');
  });
});
