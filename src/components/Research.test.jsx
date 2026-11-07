import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ResearchBrowser } from '../views/Research.jsx';
import { ResearchRecordContents } from './ResearchRecord.jsx';
import { CharacterMediaContents } from './CharacterMediaGallery.jsx';
import { ReferenceLink, ReferenceTable } from './ReferenceControls.jsx';

const table = { id: 'T', type: 'table', columns: [{ id: 'name', label: 'Name' }, { id: 'value', label: 'Value' }, { id: 'unit', label: 'Unit' }], rows: [{ id: 'R', cells: { name: 'Cloth', value: '12', unit: 'm' } }] };
const record = { id: 'REF', title: 'History notes', credit: 'Source author', panels: [{ id: 'NOTE', type: 'note', text: 'A useful passage.' }, table] };

describe('optional research and media views', () => {
  it('offers a separate reusable reference collection rather than more character inspector fields', () => {
    const html = renderToStaticMarkup(<ResearchBrowser library={{ research: { REF: record } }} dispatch={() => {}} />);
    for (const label of ['Research &amp; References', 'Search references', 'New reference', 'History notes']) expect(html).toContain(label);
  });

  it('provides text, file, link and table panels with source attribution', () => {
    const html = renderToStaticMarkup(<ResearchRecordContents record={record} onPatch={() => {}} />);
    for (const label of ['Source / author credit', 'Source URL', 'Text note', 'Web / video link', 'Table / stats', 'Images / PDF / files', 'A useful passage.', 'Add row', 'Add column']) expect(html).toContain(label);
  });

  it('shows a read-only table with real headings and no editing controls', () => {
    const html = renderToStaticMarkup(<ReferenceTable panel={table} readOnly />);
    expect(html).toContain('<th>Name</th>'); expect(html).toContain('Cloth');
    expect(html).not.toContain('<input'); expect(html).not.toContain('Delete row');
  });

  it('keeps missing research links visible and supports image, video, file and ordering controls', () => {
    const node = { title: 'Mira', researchIds: ['MISSING'], mediaGallery: [{ id: 'A', type: 'external', title: 'Greeting', path: 'D:/clips/greeting.mp4', caption: 'Play at dusk.' }] };
    const html = renderToStaticMarkup(<CharacterMediaContents node={node} onPatch={() => {}} library={{ research: { REF: record } }} />);
    for (const label of ['Add images', 'Add video link', 'Add file reference', 'Caption / timing notes', 'Unavailable library reference', 'History notes', 'Move media 1 up']) expect(html).toContain(label);
    expect(html).not.toContain('href="file:');
  });

  it('renders read-only media without giving editing controls or unsafe links', () => {
    const node = { mediaGallery: [{ id: 'A', type: 'video', title: 'Unsafe', url: 'javascript:alert(1)' }] };
    const html = renderToStaticMarkup(<CharacterMediaContents node={node} />);
    expect(html).not.toContain('href="javascript:'); expect(html).not.toContain('<video');
    expect(html).not.toContain('Delete media'); expect(html).not.toContain('Add images');
    expect(renderToStaticMarkup(<ReferenceLink url="https://example.com/source" />)).toContain('rel="noopener noreferrer"');
  });
});
