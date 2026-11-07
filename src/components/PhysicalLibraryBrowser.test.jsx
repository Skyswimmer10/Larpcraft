import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import PhysicalLibraryBrowser, { physicalLibrarySections } from './PhysicalLibraryBrowser.jsx';
import { filterLibrarySections } from './NarrativeLibraryBrowser.jsx';

vi.mock('./TypeChips.jsx', () => ({ default: ({ totalLabel }) => <button>{totalLabel}</button> }));

const library = {
  items: { I: { id: 'I', name: 'Red stick', type: 'artifact', image: { dataUrl: 'data:image/png;base64,prop' } }, J: { id: 'J', name: 'Torch', type: 'gadget' } },
  locations: { L: { id: 'L', name: 'Forest venue' } },
  sensors: { S: { id: 'S', kind: 'Pressure switch', label: 'Floor trigger' } },
};

describe('Physical library categories', () => {
  it('routes every card to its original collection and preserves the library', () => {
    const before = JSON.stringify(library);
    const pick = vi.fn();
    const sections = physicalLibrarySections(library, pick, 'L');
    for (const section of sections) for (const item of section.items) item.onPick();
    expect(pick.mock.calls).toEqual([['items', 'I'], ['items', 'J'], ['locations', 'L'], ['sensors', 'S']]);
    expect(sections[1].items[0].selected).toBe(true);
    expect(JSON.stringify(library)).toBe(before);
  });

  it('combines item-type filtering, search and categories without filtering locations or sensors', () => {
    const sections = physicalLibrarySections(library, () => {}, null, 'gadget');
    expect(sections.map(section => section.items.length)).toEqual([1, 1, 1]);
    expect(filterLibrarySections(sections, 'floor', 'sensors')[0].items[0].label).toBe('Pressure switch');
    expect(filterLibrarySections(sections, 'torch', 'locations')[0].items).toEqual([]);
    expect(physicalLibrarySections({}, () => {}).map(section => section.items)).toEqual([[], [], []]);
  });

  it('keeps all category creation buttons and filters accessible even with no saved records', () => {
    const html = renderToStaticMarkup(<PhysicalLibraryBrowser library={{}} onPick={() => {}} onCreate={() => {}} />);
    expect(html).toContain('aria-label="Physical content categories"');
    expect(html).toContain('<b>All content</b><span>0</span>');
    for (const label of ['+ New item template', '+ New location template', '+ New sensor type', 'All types · 0']) expect(html).toContain(label);
    expect(html).toContain('Search library');
  });

  it('uses the photo-card shell, portrait and keyboard-selectable buttons', () => {
    const html = renderToStaticMarkup(<PhysicalLibraryBrowser library={library} selectedId="L" onPick={() => {}} onCreate={() => {}} />);
    expect(html).toContain('card lib library-asset-card sel');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('data:image/png;base64,prop');
    expect(html).toContain('Pressure switch');
    expect(html).toContain('Floor trigger');
  });
});
