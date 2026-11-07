import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import NarrativeReferenceInfo from './NarrativeReferenceInfo.jsx';

describe('read-only concept and structure information', () => {
  it('shows the original description, tree parts and questions without editing or inserting a copy', () => {
    const item = { type: 'concept', label: 'Dragon & the City', source: { description: 'A threat and three responses.',
      nodes: { D: { id: 'D', title: 'Dragon', body: 'What is your dragon?', x: 10, y: 20 } },
      templateQuestions: ['What is protected?'] }, guidance: { reason: 'A dilemma.' } };
    const before = JSON.stringify(item);
    const html = renderToStaticMarkup(<NarrativeReferenceInfo item={item} library={{}} onClose={() => {}} />);
    for (const text of ['A threat and three responses.', 'Dragon', 'What is your dragon?', 'What is protected?', 'Information about Dragon']) expect(html).toContain(text);
    expect(html).not.toMatch(/<(input|textarea|select)\b/);
    expect(html).not.toContain('Add to canvas');
    expect(JSON.stringify(item)).toBe(before);
  });
  it('uses the corrected archetype reference without displaying corrupted transcription labels', () => {
    const item = { type: 'concept', label: 'Artist', source: { id: 'LIB-CPT-N033', description: 'Old transcription', nodes: { a: { id: 'a', kind: 'characterShadow', title: 'â† Excessive', body: 'The pauser' } } } };
    const html = renderToStaticMarkup(<NarrativeReferenceInfo item={item} library={{}} onClose={() => {}} />);
    expect(html).toContain('Poseur');
    expect(html).toContain('Artist + Ruler = Trendsetter');
    expect(html).not.toContain('Old transcription');
    expect(html).not.toContain('â†');
  });
});
