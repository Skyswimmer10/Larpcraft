import { describe, expect, it } from 'vitest';
import deployedProject from '../data/deployedProject.json';
import { makeProjectSeed } from '../data/seed.js';
import { BUNDLED_PROJECT_VERSION, mergeBundledProject } from './bundledProject.js';

describe('mergeBundledProject', () => {
  it('ships the complete captured Operation Chimera canvases', () => {
    expect(Object.keys(deployedProject.nodes || {})).toHaveLength(14);
    expect(Object.keys(deployedProject.taskNodes || {})).toHaveLength(11);
    expect(Object.keys(deployedProject.frames || {})).toHaveLength(2);
  });

  it('upgrades the deployed demo project to the captured canvas counts', () => {
    const merged = mergeBundledProject(deployedProject, makeProjectSeed());
    expect(Object.keys(merged.nodes || {})).toHaveLength(14);
    expect(Object.keys(merged.taskNodes || {})).toHaveLength(11);
    expect(merged.edges).toEqual(deployedProject.edges);
  });

  it('uses the captured project when no browser project exists', () => {
    const bundled = { meta: { name: 'Operation Chimera', prefix: 'CHM' }, nodes: { A: {} } };
    expect(mergeBundledProject(bundled, null)).toEqual({
      ...bundled,
      bundledProjectVersion: BUNDLED_PROJECT_VERSION,
    });
  });

  it('upgrades richer graph groups together while preserving saved database edits', () => {
    const bundled = {
      meta: { name: 'Operation Chimera', prefix: 'CHM' },
      nodes: { A: {}, B: {} },
      edges: [{ from: 'A', to: 'B' }],
      frames: { F: {} },
      items: { ITEM: { name: 'Bundled item' } },
    };
    const saved = {
      meta: { name: 'Operation Chimera', prefix: 'CHM' },
      nodes: { A: { title: 'Old node' } },
      edges: [],
      frames: {},
      items: { ITEM: { name: 'Edited item' }, EXTRA: { name: 'Hosted item' } },
    };

    const merged = mergeBundledProject(bundled, saved);
    expect(merged.nodes).toBe(bundled.nodes);
    expect(merged.edges).toBe(bundled.edges);
    expect(merged.frames).toBe(bundled.frames);
    expect(merged.items).toEqual({
      ITEM: { name: 'Edited item' },
      EXTRA: { name: 'Hosted item' },
    });
  });

  it('does not inject Operation Chimera into a different game', () => {
    const bundled = { meta: { name: 'Operation Chimera', prefix: 'CHM' }, nodes: { A: {} } };
    const saved = { meta: { name: 'Another Game', prefix: 'ALT' }, nodes: { X: {} } };
    expect(mergeBundledProject(bundled, saved)).toBe(saved);
  });

  it('does not restore deleted project records after the bundle was applied', () => {
    const saved = {
      meta: { name: 'Operation Chimera', prefix: 'CHM' },
      nodes: {},
      bundledProjectVersion: BUNDLED_PROJECT_VERSION,
    };
    expect(mergeBundledProject({ nodes: { A: {} } }, saved)).toBe(saved);
  });
});
