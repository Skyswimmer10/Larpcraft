import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import StoryLibraryBrowser from './StoryLibraryBrowser.jsx';
import NarrativeLibraryBrowser, { filterLibrarySections } from './NarrativeLibraryBrowser.jsx';

vi.mock('react-dom', () => ({ createPortal: children => children }));
vi.stubGlobal('document', { body: {} });
const lib = { concepts: { DRAGON: { id: 'LIB-CPT-DRAGON', name: 'Dragon & the City', category: 'storyConcept' } }, stories: { STORY: { id: 'STORY', name: 'Story structure' } }, narrative: { C: { id: 'C', name: 'Moro', nodeKind: 'character', nodeClass: 'base', template: { image: { dataUrl: 'data:image/png;base64,portrait' } } } } };

describe('story library browser presentation', () => {
  it('reuses the Story Wizard emblems for framework, concept and structure reference cards', () => {
    const html = renderToStaticMarkup(<StoryLibraryBrowser library={lib} mode="tools" onClose={() => {}} />);
    expect(html).toContain('aria-label="Story Tools"');
    for (const symbol of ['fate', 'preferences', 'dragon-city', 'story-building']) expect(html).toContain(`data-symbol="${symbol}"`);
    expect(html).toContain('library-browser-reference framework');
    expect(html).toContain('library-browser-reference concept');
    expect(html).not.toContain('Moro');
  });

  it('shows saved products and portraits separately and explains an empty content library', () => {
    const html = renderToStaticMarkup(<StoryLibraryBrowser library={lib} mode="content" onClose={() => {}} />);
    expect(html).toContain('aria-label="Created Content"'); expect(html).toContain('Characters'); expect(html).toContain('Moro');
    expect(html).toContain('data:image/png;base64,portrait');
    expect(html).toContain('card lib library-asset-card');
    expect(html).toContain('library-asset-grid');
    expect(html).not.toContain('library-browser-card-main');
    expect(html).toContain('aria-label="Created content categories"');
    expect(html).toContain('<b>All content</b>');
    expect(html).toContain('<b>Story Locations</b><span>0</span>');
    expect(html).toContain('<b>Story Items</b><span>0</span>');
    expect(html).toContain('<b>Conversations</b><span>0</span>');
    expect(html).not.toContain('data-symbol="fate"'); expect(html).not.toContain('Dragon &amp; the City');
    expect(renderToStaticMarkup(<StoryLibraryBrowser library={{}} mode="content" onClose={() => {}} />)).toContain('No created content saved yet.');
  });

  it('preserves the generic mechanics browser without applying story symbols or filters', () => {
    const html = renderToStaticMarkup(<NarrativeLibraryBrowser title="Mechanics Library" sections={[{ id: 'task', label: 'Tasks', items: [{ id: 't', label: 'Timed puzzle', icon: 'layers' }] }]} onClose={() => {}} />);
    expect(html).toContain('Timed puzzle'); expect(html).not.toContain('data-symbol=');
    expect(html).not.toContain('Created content categories');
  });

  it('uses the same created records and category counts on a full page without modal close controls', () => {
    const before = JSON.stringify(lib);
    const html = renderToStaticMarkup(<StoryLibraryBrowser library={lib} mode="content" inline headerAction={<span>Library · Master Database</span>} />);
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Created Content"');
    expect(html).toContain('<h2>Created Content</h2>');
    expect(html).toContain('<b>Characters</b><span>1</span>');
    expect(html).toContain('Moro');
    expect(html).toContain('Search library');
    expect(html).toContain('Library · Master Database');
    expect(html).not.toContain('modal-backdrop');
    expect(html).not.toContain('aria-modal');
    expect(html).not.toContain('aria-label="Close"');
    expect(html).not.toContain('data-symbol="fate"');
    expect(JSON.stringify(lib)).toBe(before);
  });

  it('combines category selection with search without leaking records from other categories', () => {
    const sections = [{ id: 'characters', items: [{ label: 'Forest keeper' }] }, { id: 'places', items: [{ label: 'Magical Forest', blurb: 'Ancient trees' }] }, { id: 'items', items: [] }];
    expect(filterLibrarySections(sections, 'FOREST', 'places')).toEqual([{ id: 'places', items: sections[1].items }]);
    expect(filterLibrarySections(sections, 'keeper', 'places')[0].items).toEqual([]);
    expect(filterLibrarySections(sections, '', 'items')).toEqual([{ id: 'items', items: [] }]);
    expect(filterLibrarySections(sections, 'forest').flatMap(section => section.items)).toHaveLength(2);
  });
});
