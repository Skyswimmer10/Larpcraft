import { describe, it, expect } from 'vitest';
import {
  makeProjectSeed, makeEmptyProject, migrateProject,
  NARR_NODE_TYPES, NARRATIVE_KINDS, FACT_KINDS, FACT_BLANK,
  BASE_NODE_TYPES, CONCEPT_INTERNAL_NODE_TYPES,
  cloneCharacterCardTemplate, normalizeCharacterCard,
} from './seed.js';

describe('facts registry seed', () => {
  it('the demo game ships a facts collection', () => {
    const s = makeProjectSeed();
    expect(Object.keys(s.facts).length).toBeGreaterThan(0);
    for (const f of Object.values(s.facts)) {
      expect(FACT_KINDS[f.kind]).toBeTruthy();
    }
  });

  it('a fresh empty game has an (empty) facts collection', () => {
    expect(makeEmptyProject('x').facts).toEqual({});
  });

  it('every fact a node records exists in the registry', () => {
    const s = makeProjectSeed();
    for (const n of Object.values(s.nodes)) {
      for (const set of n.sets || []) {
        expect(s.facts[set.factId], `${n.id} sets missing fact ${set.factId}`).toBeTruthy();
        expect(['set', 'unset']).toContain(set.to);
      }
    }
  });

  it('every fact-gated edge references a real fact and a valid expectation', () => {
    const s = makeProjectSeed();
    const gated = s.edges.filter((e) => e.factId);
    expect(gated.length).toBeGreaterThan(0);
    for (const e of gated) {
      expect(s.facts[e.factId], `edge ${e.from}->${e.to} gates missing fact ${e.factId}`).toBeTruthy();
      expect(['set', 'unset']).toContain(e.expect);
    }
  });

  it('sensor-kind facts bind to a real sensor instance when set', () => {
    const s = makeProjectSeed();
    for (const f of Object.values(s.facts)) {
      if (f.kind === 'sensor' && f.sensorId) expect(s.sensors[f.sensorId]).toBeTruthy();
    }
  });
});

describe('typed narrative nodes', () => {
  it('concept question helpers stay separate from main base nodes', () => {
    expect(Object.keys(CONCEPT_INTERNAL_NODE_TYPES)).toEqual(['conceptTitle', 'conceptQuestion', 'conceptChoice']);
    for (const kind of Object.keys(CONCEPT_INTERNAL_NODE_TYPES)) {
      expect(BASE_NODE_TYPES[kind]).toBeUndefined();
    }
  });

  it('NARRATIVE_KINDS covers every typed node plus legacy story', () => {
    expect(NARRATIVE_KINDS).toContain('story');
    for (const k of Object.keys(NARR_NODE_TYPES)) expect(NARRATIVE_KINDS).toContain(k);
  });

  it('the demo uses the Narrative Weaver base + concept node kinds', () => {
    const kinds = new Set(Object.values(makeProjectSeed().nodes).map((n) => n.kind));
    expect(kinds.has('event')).toBe(true);
    expect(kinds.has('quest')).toBe(true);
    expect(kinds.has('concept')).toBe(true);
  });

  it('every node type has a colour and a known icon', () => {
    for (const t of Object.values(NARR_NODE_TYPES)) {
      expect(t.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(t.icon).toBeTruthy();
    }
  });
});

describe('migrateProject (additive)', () => {
  it('returns a fresh demo for null/garbage', () => {
    expect(Object.keys(migrateProject(null).facts).length).toBeGreaterThan(0);
    expect(migrateProject({}).meta.name).toBe('Operation Chimera');
  });

  it('backfills a missing facts collection on an older saved game', () => {
    const old = makeProjectSeed();
    delete old.facts;
    const migrated = migrateProject(old);
    expect(migrated.facts).toEqual({});
    // user content preserved
    expect(migrated.nodes['N-BRIEF']).toBeTruthy();
  });

  it('never discards an existing game with content', () => {
    const saved = makeEmptyProject('My Game');
    saved.nodes = { X: { id: 'X', kind: 'beat', title: 'keep me', x: 10, y: 10 } };
    const migrated = migrateProject(saved);
    expect(migrated.nodes.X.title).toBe('keep me');
    expect(migrated.meta.name).toBe('My Game');
  });
});

describe('FACT_BLANK', () => {
  it('produces a valid new knowledge fact', () => {
    const f = FACT_BLANK('F-NEW');
    expect(f.id).toBe('F-NEW');
    expect(FACT_KINDS[f.kind]).toBeTruthy();
    expect(f.sensorId).toBeNull();
  });
});

describe('Character card loose schema', () => {
  it('deep-copies the project template with fresh ids and empty selections', () => {
    const template = makeEmptyProject('x').meta.characterCardTemplate;
    const a = cloneCharacterCardTemplate(template);
    const b = cloneCharacterCardTemplate(template);
    expect(a.questions.map((q) => q.prompt)).toEqual(template.questions.map((q) => q.prompt));
    expect(a.questions.every((q) => q.answer === '')).toBe(true);
    expect(a.typeGroups.every((g) => g.selectedId === null)).toBe(true);
    expect(a.questions[0].id).not.toBe(template.questions[0].id);
    expect(a.questions[0].id).not.toBe(b.questions[0].id);
  });

  it('migrates old character text fields into authored question rows', () => {
    const card = normalizeCharacterCard({
      id: 'N-OLD',
      kind: 'character',
      title: 'The Guide',
      body: 'Helpful but costly.',
      casting: 'Played by a senior facilitator.',
      emptyNote: '',
    });
    expect(card.title).toBe('The Guide');
    expect(card.description).toBe('Helpful but costly.');
    expect(card.questions).toEqual(expect.arrayContaining([
      expect.objectContaining({ prompt: 'Casting', answer: 'Played by a senior facilitator.' }),
    ]));
    expect(card.questions.some((q) => q.prompt === 'Empty Note')).toBe(false);
  });
});
