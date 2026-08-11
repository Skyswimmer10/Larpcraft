import { describe, expect, it } from 'vitest';
import deployedLibrary from '../data/deployedLibrary.json';
import { BUNDLED_LIBRARY_VERSION, mergeBundledLibrary } from './bundledLibrary.js';

describe('mergeBundledLibrary', () => {
  it('ships the complete captured library and mechanism artwork', () => {
    expect(Object.keys(deployedLibrary.concepts || {})).toHaveLength(14);
    expect(Object.keys(deployedLibrary.mechStructures || {})).toHaveLength(24);
    expect(Object.keys(deployedLibrary.actionPatternMechanisms || {})).toHaveLength(23);
    expect(Object.keys(deployedLibrary.actionProbabilityMechanisms || {})).toHaveLength(26);
    expect(Object.values(deployedLibrary.actionPatternMechanisms).every((record) => record.image?.dataUrl)).toBe(true);
    expect(Object.values(deployedLibrary.actionProbabilityMechanisms).every((record) => record.image?.dataUrl)).toBe(true);
  });

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

  it('restores uploaded mechanism artwork without replacing saved text edits', () => {
    const bundledImage = { kind: 'upload', dataUrl: 'data:image/png;base64,local-workspace' };
    const bundled = {
      actionPatternMechanisms: {
        A: { label: 'Bundled name', description: 'Bundled description', image: bundledImage, imageScale: 1.4 },
      },
    };
    const saved = {
      actionPatternMechanisms: {
        A: { label: 'Edited name', description: 'Edited description', image: { kind: 'svg', dataUrl: 'seed' }, imageScale: 1 },
      },
      bundledLibraryVersion: BUNDLED_LIBRARY_VERSION - 1,
    };

    expect(mergeBundledLibrary(bundled, saved).actionPatternMechanisms.A).toMatchObject({
      label: 'Edited name',
      description: 'Edited description',
      image: bundledImage,
      imageScale: 1.4,
    });
  });

  it('does not replace artwork uploaded in the deployed browser', () => {
    const savedImage = { kind: 'upload', dataUrl: 'data:image/png;base64,hosted-edit' };
    const bundled = {
      actionProbabilityMechanisms: {
        A: { label: 'Bundled', image: { kind: 'upload', dataUrl: 'data:image/png;base64,local-workspace' } },
      },
    };
    const saved = {
      actionProbabilityMechanisms: { A: { label: 'Edited', image: savedImage } },
      bundledLibraryVersion: BUNDLED_LIBRARY_VERSION - 1,
    };

    expect(mergeBundledLibrary(bundled, saved).actionProbabilityMechanisms.A.image).toBe(savedImage);
  });
});
