import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import NarrativeSourceSymbol from './NarrativeSourceSymbol.jsx';
import { narrativeSymbol, FRAMEWORK_SYMBOLS, CONCEPT_SYMBOLS } from '../data/narrativeSymbols.js';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import library from '../data/deployedLibrary.json';

describe('Story Wizard source symbols', () => {
  it('provides drawn built-in emblems and usable fallbacks for newly authored concepts', () => {
    const sources = [...Object.values(FRAMEWORK_TYPES).map(source => ({ source, type: 'framework', catalog: FRAMEWORK_SYMBOLS })),
      ...Object.values(library.concepts).map(source => ({ source, type: 'concept', catalog: CONCEPT_SYMBOLS }))];
    expect(sources).toHaveLength(Object.keys(FRAMEWORK_TYPES).length + Object.keys(library.concepts).length);
    for (const { source, type, catalog } of sources) {
      const symbol=catalog[source.id]||narrativeSymbol(source,type);
      expect(symbol, source.name || source.label).toBeTruthy();
      const html = renderToStaticMarkup(<NarrativeSourceSymbol source={source} type={type} />);
      expect(html).toContain(`data-symbol="${symbol}"`);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('focusable="false"');
      expect(html).toContain('<path');
      expect(html).not.toMatch(/<image|<foreignObject|#[a-f0-9]{6}|https?:/i);
    }
    expect(new Set(Object.values(FRAMEWORK_SYMBOLS)).size).toBe(Object.keys(FRAMEWORK_TYPES).length);
    expect(new Set(Object.values(CONCEPT_SYMBOLS)).size).toBe(42);
  });

  it('keeps visual identities when references are renamed, copied or saved as wizard versions', () => {
    expect(narrativeSymbol({ conceptId: 'LIB-CPT-DRAGON', name: 'A new dragon story' }, 'concept')).toBe('dragon-city');
    expect(narrativeSymbol({ id: 'COPY', name: 'Artist' }, 'concept')).toBe('artist');
    expect(narrativeSymbol({ id: 'COPY', name: 'A custom profile', narrativeWizard: { sourceType: 'framework', sourceId: 'kolbLearningCycle' } }, 'concept')).toBe('kolb');
    expect(narrativeSymbol({ id: 'NEW', category: 'characterConcept' }, 'concept')).toBe('profile');
    expect(narrativeSymbol({ id: 'LIB-CPT-N039' }, 'concept')).toBe('drive');
  });

  it('draws Kolb as a complete four-stage cycle rather than a generic framework icon', () => {
    const html = renderToStaticMarkup(<NarrativeSourceSymbol source={FRAMEWORK_TYPES.kolbLearningCycle} type="framework" />);
    for (const phase of ['CE', 'RO', 'AC', 'AE']) expect(html).toContain(`>${phase}</text>`);
    expect((html.match(/<circle/g) || []).length).toBe(4);
  });
});
