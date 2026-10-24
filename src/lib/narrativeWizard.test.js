import { describe, expect, it } from 'vitest';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { frameworkQuestions, narrativeSources, conceptQuestions, conceptRoles, substituteRoles, adaptConceptGraph, createWizardNode, wizardLibraryRecord } from './narrativeWizard.js';

const source = {
  id: 'dragon-source', name: 'Dragon & the City', category: 'storyConcept', description: 'A dragon threatens a city.',
  questions: [{ key: 'dragon', label: 'What is the dragon?' }], conceptQuestions: [{ id: 'extra', prompt: 'What might help?', choices: [{ label: 'Negotiate' }] }],
  nodes: {
    threat: { id: 'threat', kind: 'character', title: 'What is your dragon', x: 90, y: 210, image: 'data:image/test', customField: 'keep' },
    home: { id: 'home', kind: 'storyLocation', title: 'What is your city', x: 90, y: 40 },
    q: { id: 'q', kind: 'conceptQuestion', title: 'How can you defend the city?', body: 'Think about the dragon.' },
    outer: { id: 'outer', kind: 'concept', title: 'Nested', sub: { nodes: { q: { id: 'q', kind: 'conceptQuestion', title: 'Who helps the city?', body: 'Original note' } }, edges: [] } },
  },
  edges: [{ from: 'threat', to: 'home', label: 'threatens the city', fromSide: 'right', toSide: 'left' }],
  frames: { frame: { id: 'frame', x: 80, y: 10, w: 600, h: 400 } },
  numberMarkers: { mark: { id: 'mark', attachedToNodeId: 'threat', value: 1 } },
};
const roles = () => conceptRoles(source).map(r => ({ ...r, replacement: r.id === 'dragon' ? 'Debt' : 'Home' }));

describe('narrative questions', () => {
  it.each(Object.values(FRAMEWORK_TYPES).map(f => [f.id, f]))('offers distinct questions for %s', (_, framework) => {
    const rows = frameworkQuestions(framework);
    expect(rows.length).toBeGreaterThan(0);
    expect(new Set(rows.map(r => r.key)).size).toBe(rows.length);
    expect(rows.every(r => r.prompt.trim())).toBe(true);
  });
  it('includes the actual archetype forms and does not invent child forms for the feminine reference', () => {
    for (const id of ['jungianMasculineArchetypes', 'jungianFeminineArchetypes']) {
      const fw = FRAMEWORK_TYPES[id];
      for (const phase of fw.phases) {
        const rows = frameworkQuestions(fw, { archetype: phase.key });
        if (phase.descriptions.child) expect(rows.find(r => r.key === 'root').hint).toContain(phase.name);
        else expect(rows.find(r => r.key === 'root')).toBeUndefined();
        expect(rows.find(r => r.key === 'activeShadow').hint).toContain(phase.adultActiveShadow);
        if (phase.childActiveShadow) expect(rows.find(r => r.key === 'activeShadow').hint).toContain(phase.childActiveShadow);
        expect(rows.find(r => r.key === 'passiveShadow').hint).toContain(phase.adultPassiveShadow);
        if (phase.childPassiveShadow) expect(rows.find(r => r.key === 'passiveShadow').hint).toContain(phase.childPassiveShadow);
        expect(rows.every(row => !`${row.prompt} ${row.hint}`.includes('undefined'))).toBe(true);
      }
    }
  });
  it('reads template, custom and nested questions without confusing repeated node IDs', () => {
    const rows = conceptQuestions(source);
    expect(rows.find(r => r.answerKey === 'dragon')).toBeTruthy();
    expect(rows.find(r => r.key === 'custom:extra').choices).toEqual(['Negotiate']);
    expect(rows.find(r => r.key === 'node:q').nodePath).toEqual(['q']);
    expect(rows.find(r => r.key === 'node:outer/q').nodePath).toEqual(['outer', 'q']);
  });
  it('covers character concept facets and shadows rather than asking one generic question', () => {
    const rows = conceptQuestions({ nodes: {
      shadow: { id: 'shadow', kind: 'characterShadow', title: 'Withdrawal', body: 'Refuses responsibility.' },
      'facet-say': { id: 'facet-say', kind: 'characterArchetypeFacet', title: 'You say', body: 'Follow me.' },
    } });
    const graphQuestions = rows.filter(row => row.nodePath);
    expect(graphQuestions).toHaveLength(2);
    expect(graphQuestions[0].hint).toBe('Refuses responsibility.');
    expect(graphQuestions[1].prompt).toContain('say');
  });
  it('supports empty and newly added concepts', () => {
    expect(conceptQuestions({ name: 'New concept', nodes: {} }).some(row => row.key === 'application')).toBe(true);
    expect(narrativeSources({ concepts: { custom: { id: 'custom', name: 'My new concept' } } }).some(r => r.key === 'concept:custom')).toBe(true);
  });
});

describe('concept adaptation', () => {
  it('binds threat and protected roles to their existing positions', () => {
    const result = conceptRoles(source);
    expect(result[0].nodePath).toEqual(['threat']);
    expect(result[1].nodePath).toEqual(['home']);
  });
  it('replaces whole phrases simultaneously with literal replacement text', () => {
    expect(substituteRoles('Dragon dragonfly city Debt', [...roles(), { original: 'Debt', replacement: 'Deadline' }])).toBe('Debt dragonfly Home Deadline');
    expect(substituteRoles('A+B and $5', [{ original: 'A+B', replacement: '$&' }])).toBe('$& and $5');
    expect(substituteRoles('pūķis pūķisks', [{ original: 'pūķis', replacement: 'parāds' }])).toBe('parāds pūķisks');
  });
  it('preserves graph identity, geometry, attachments, custom fields and source data', () => {
    const before = structuredClone(source);
    const rows = conceptQuestions(source);
    const graph = adaptConceptGraph(source, roles(), rows, { 'node:q': 'Negotiate a repayment.', 'node:outer/q': 'The neighbours.' });
    expect(graph.nodes.threat.title).toBe('Debt');
    expect(graph.nodes.home.title).toBe('Home');
    expect(graph.nodes.threat.x).toBe(90);
    expect(graph.nodes.threat.image).toBe('data:image/test');
    expect(graph.nodes.threat.customField).toBe('keep');
    expect(graph.edges[0]).toEqual({ ...source.edges[0], label: 'threatens the Home' });
    expect(graph.frames).toEqual(source.frames);
    expect(graph.numberMarkers).toEqual(source.numberMarkers);
    expect(graph.nodes.q.body).toContain('Negotiate a repayment.');
    expect(graph.nodes.outer.sub.nodes.q.body).toContain('The neighbours.');
    expect(source).toEqual(before);
  });
  it('keeps separate library framework cards and support nodes visible inside a game copy', () => {
    const graph = adaptConceptGraph({ nodes: {}, frameworks: { f: { id: 'f', frameworkId: 'fate', x: 35 } }, subnodes: { s: { id: 's', kind: 'comment', notes: 'Keep this note' } } }, [], [], {});
    expect(graph.nodes.f).toMatchObject({ id: 'f', kind: 'framework', frameworkId: 'fate', x: 35 });
    expect(graph.nodes.s.notes).toBe('Keep this note');
    expect(graph.frameworks).toBeUndefined();
  });
  it('creates an editable character card and reusable library record with answers', () => {
    const fw = FRAMEWORK_TYPES.fate;
    const node = createWizardNode({ source: fw, type: 'framework', title: 'Mara', questions: frameworkQuestions(fw), answers: { 'phase:F': 'Protecting her family.' }, id: 'N1', output: 'character' });
    expect(node.kind).toBe('character');
    expect(node.questions.some(q => q.answer === 'Protecting her family.')).toBe(true);
    expect(node.description).toContain('Protecting her family.');
    const record = wizardLibraryRecord(node, 'LIB1');
    expect(record.coll).toBe('narrative');
    expect(record.entity.template.narrativeWizard.answers['phase:F']).toBe('Protecting her family.');
    record.entity.template.questions[0].answer = 'changed';
    expect(node.questions[0].answer).toBe('');
  });
  it('saves an adapted concept as a detached reusable graph with legacy answers', () => {
    const node = createWizardNode({ source, type: 'concept', title: 'Debt and a home', roles: roles(), questions: conceptQuestions(source), answers: { 'question:dragon': 'Debt', 'node:q': 'Ask for more time.' }, id: 'N2', output: 'concept' });
    expect(node.conceptAnswers.dragon).toBe('Debt');
    expect(node.sub.nodes.home.title).toBe('Home');
    const record = wizardLibraryRecord(node, 'LIB2');
    expect(record.coll).toBe('concepts');
    expect(record.entity.nodes.q.body).toContain('Ask for more time.');
    expect(record.entity.conceptAnswers.dragon).toBe('Debt');
    expect(record.entity.narrativeWizard.sourceId).toBe(source.id);
  });
});
