import { describe, expect, it } from 'vitest';
import { BUNDLED_LIBRARY_VERSION, mergeBundledLibrary } from './bundledLibrary.js';

describe('mergeBundledLibrary', () => {
  it('adds missing bundled records while preserving saved records', () => {
    const bundled = { concepts: { A: { name: 'Bundled A' }, B: { name: 'Bundled B' } } };
    const saved = { concepts: { A: { name: 'Edited A' }, C: { name: 'Saved C' } } };

    expect(mergeBundledLibrary(bundled, saved)).toEqual({
      concepts: {
        A: { name: 'Edited A' },
        B: { name: 'Bundled B' },
        C: { name: 'Saved C' },
      },
      bundledLibraryVersion: BUNDLED_LIBRARY_VERSION,
    });
  });

  it('does not restore deleted records after the bundle was applied', () => {
    const saved = {
      concepts: {},
      bundledLibraryVersion: BUNDLED_LIBRARY_VERSION,
    };

    expect(mergeBundledLibrary({ concepts: { A: { name: 'Bundled A' } } }, saved)).toBe(saved);
  });

  it('upgrades an older empty graph with a richer bundled graph', () => {
    const bundled = {
      concepts: {
        A: { name: 'Full concept', nodes: { N1: {}, N2: {} }, edges: [{ from: 'N1', to: 'N2' }] },
      },
    };
    const saved = {
      concepts: { A: { name: 'Empty shell', nodes: {}, edges: [] } },
      bundledLibraryVersion: BUNDLED_LIBRARY_VERSION - 1,
    };

    expect(mergeBundledLibrary(bundled, saved).concepts.A).toEqual(bundled.concepts.A);
  });

  it('keeps a richer saved graph during an upgrade', () => {
    const bundled = { concepts: { A: { nodes: { N1: {} }, edges: [] } } };
    const savedGraph = { nodes: { N1: {}, N2: {} }, edges: [{ from: 'N1', to: 'N2' }] };
    const saved = {
      concepts: { A: savedGraph },
      bundledLibraryVersion: BUNDLED_LIBRARY_VERSION - 1,
    };

    expect(mergeBundledLibrary(bundled, saved).concepts.A).toBe(savedGraph);
  });
});
