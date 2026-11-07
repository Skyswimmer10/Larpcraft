import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import NarrativeWizard from './NarrativeWizard.jsx';
import ArchetypeDetails from './ArchetypeDetails.jsx';
import { FRAMEWORK_TYPES, makeEmptyProject } from '../data/seed.js';
import { KWML_ID } from '../data/kwml.js';

vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });
const store = vi.hoisted(() => ({ project: null }));
vi.mock('../state/store.jsx', () => ({ useGame: () => store.project, useLibrary: () => ({ concepts: {} }), useDispatch: () => vi.fn(), useLibraryDispatch: () => vi.fn() }));

describe('combined archetype framework UI', () => {
  it('opens a compact structured foundation in the current framework entry point', () => {
    store.project = makeEmptyProject('Framework QA');
    const html = renderToStaticMarkup(<NarrativeWizard initialSource={FRAMEWORK_TYPES[KWML_ID]} initialType="framework" onClose={() => {}} />);
    for (const label of ['King, Warrior, Magician &amp; Lover', 'Character name / working title', 'One-sentence role or concept', 'Primary energy', 'Balanced mix', 'Interactions', 'Expression &amp; limits', 'Synthesis']) expect(html).toContain(label);
    expect(html).not.toContain('Who is this character, and what do they want right now?');
    expect(html).not.toContain('Skip question');
    expect(html).not.toContain('Where will this help your story?');
  });
  it('updates the framework reference with mature cores, aliases, directional and pair effects while retaining older developing forms', () => {
    const html = renderToStaticMarkup(<ArchetypeDetails framework={FRAMEWORK_TYPES[KWML_ID]} />);
    for (const label of ['Tyrant', 'Weakling', 'Sadist', 'Masochist', 'Trickster', 'Innocent One', 'Addict', 'Impotent', 'Directional effects', 'Pairwise effects', 'Earlier developing-form reference', 'Divine Child']) expect(html).toContain(label);
  });
});
