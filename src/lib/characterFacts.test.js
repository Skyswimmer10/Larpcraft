import { describe, expect, it } from 'vitest';
import { characterFacts, characterFactsText, characterRelationships } from './characterFacts.js';
import { characterExport, characterProfilePatch, characterSources, characterUsesMasculineArchetypes, remapCharacterInputs } from './characterProfile.js';
import { createWizardNode, wizardLibraryRecord } from './narrativeWizard.js';
import { FRAMEWORK_TYPES, makeEmptyProject, migrateProject, normalizeCharacterCard } from '../data/seed.js';
import { createCanvasClipboard, remapCanvasClipboard } from './canvasClipboard.js';
import { undoableReducer } from '../state/store.jsx';

const character = { id: 'C', kind: 'character', title: 'Uno', body: 'They guard a bridge.' };
const relationship = { id: 'r', type: 'Loyal to', name: 'The King', targetId: 'K', targetType: 'node' };

describe('compact character facts', () => {
  it('retains an old role and goal until explicitly replaced, including a deliberately empty replacement', () => {
    const old = { ...character, gender: 'Man', race: 'Human', age: 0, typeGroups: [{ label: 'Role', selectedId: 'g', options: [{ id: 'g', label: 'Guide' }] }], characterProfile: { details: { goals: 'Protect the village' } } };
    expect(characterFacts(old)).toMatchObject({ role: 'Guide', goal: 'Protect the village', gender: 'Man', race: 'Human', age: 0 });
    const edited = { ...old, characterFacts: { goal: '', role: 'Main character' } };
    expect(characterFacts(edited)).toMatchObject({ goal: '', role: 'Main character' });
    expect(characterFactsText(edited)).not.toContain('Protect the village');
    expect(old.characterProfile.details.goals).toBe('Protect the village');
  });

  it('resolves relationships by both collection and ID and retains names when the target disappears', () => {
    const node = { ...character, characterFacts: { relationships: [relationship, { ...relationship, id: 'f', type: 'Enemies', name: 'Old faction', targetType: 'factions' }] } };
    const graph = { nodes: { K: { id: 'K', kind: 'character', title: 'King Arno' } }, factions: { K: { id: 'K', name: 'Invaders' } } };
    expect(characterRelationships(node, graph).map(row => row.name)).toEqual(['King Arno', 'Invaders']);
    expect(characterFactsText(node, graph)).toBe('Loyal to: King Arno\nEnemies: Invaders');
    expect(characterRelationships(node, {})[0]).toMatchObject({ name: 'The King', missing: true });
  });

  it('updates linked name snapshots in one undoable transaction, even without a derived profile', () => {
    const node = { ...character, characterFacts: { relationships: [relationship] } };
    const project = { ...makeEmptyProject(), nodes: { C: node, K: { id: 'K', kind: 'character', title: 'The King' } } };
    const changed = undoableReducer({ present: project, past: [] }, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'K', patch: { title: 'King Arno' } });
    expect(changed.present.nodes.C.characterFacts.relationships[0].name).toBe('King Arno');
    expect(undoableReducer(changed, { type: 'UNDO' }).present.nodes.C.characterFacts.relationships[0].name).toBe('The King');
    expect(node.characterProfile).toBeUndefined();
  });

  it('copies relationships to copied characters and detaches external targets safely in templates', () => {
    const node = { ...character, characterFacts: { relationships: [relationship] } };
    const king = { id: 'K', kind: 'character', title: 'The King' };
    const copy = remapCanvasClipboard(createCanvasClipboard({ C: node, K: king }, [], ['C', 'K']), {});
    expect(copy.nodes[copy.idMap.C].characterFacts.relationships[0].targetId).toBe(copy.idMap.K);
    expect(remapCharacterInputs(node).characterFacts.relationships[0]).toMatchObject({ targetId: null, name: 'The King' });
    expect(wizardLibraryRecord(node, 'LIB-C').entity.template.characterFacts.relationships[0].targetId).toBeNull();
    expect(node.characterFacts.relationships[0].targetId).toBe('K');
  });

  it('keeps facts through project migration without converting them into question answers', () => {
    const node = { ...character, gender: 'Man', race: 'Human', age: '41', storyRole: 'Guide', characterFacts: { goal: 'Guard the bridge', relationships: [relationship] } };
    const restored = migrateProject(JSON.parse(JSON.stringify({ ...makeEmptyProject(), nodes: { C: node } }))).nodes.C;
    expect(restored.characterFacts).toEqual(node.characterFacts);
    expect(normalizeCharacterCard(restored).questions.some(question => ['Gender', 'Race', 'Age', 'Story Role'].includes(question.prompt))).toBe(false);
  });

  it('exports current brief facts and companion performance writing, without obsolete goal text', () => {
    const node = characterProfilePatch({ ...character, characterFacts: { gender: 'Man', race: 'Human', age: '41', role: 'Gatekeeper', goal: 'Guard the bridge', relationships: [relationship] } }, {}, { details: { goals: 'An old goal', voice: 'An old voice', secrets: 'They hid the key.' }, performanceText: 'They whisper.\nExample: Who goes there?' });
    const graph = { nodes: { K: { id: 'K', kind: 'character', title: 'King Arno' } } };
    const full = characterExport(node, graph, 'full');
    expect(full).toContain('Goal / motivation: Guard the bridge');
    expect(full).toContain('Loyal to: King Arno');
    expect(full).not.toContain('An old goal');
    const ai = characterExport(node, graph, 'ai');
    expect(ai).toContain('## Voice, dialogue and performance');
    expect(ai).toContain('Who goes there?');
    expect(ai).toContain('They hid the key.');
    expect(ai).not.toContain('An old voice');
  });
});

describe('source-specific character controls and export', () => {
  const make = source => createWizardNode({ source, type: 'framework', id: 'C', title: 'Uno', focus: 'character', questions: [{ key: 'q', prompt: 'Which exact promise guides their decisions?' }], answers: { q: 'They keep their word.' } });

  it('includes framework provenance in default AI context and questions only when requested', () => {
    const node = make(FRAMEWORK_TYPES.fate);
    const normal = characterExport(node, {}, 'ai');
    expect(normal).toContain('Uno — FATE');
    expect(normal).not.toContain('Which exact promise guides their decisions?');
    const detailed = characterExport(node, {}, 'ai', { includeQuestions: true });
    expect(detailed).toContain('Which exact promise guides their decisions?');
    expect(detailed).toContain('They keep their word.');
    expect(detailed).toContain('Uno · FATE');
  });

  it('shows the masculine archetype controls only for accepted matching sources, independently of gender', () => {
    const node = { ...make(FRAMEWORK_TYPES.jungianMasculineArchetypes), characterFacts: { gender: 'Woman' } };
    expect(characterUsesMasculineArchetypes(node)).toBe(true);
    const excluded = characterProfilePatch(node, {}, { excluded: [characterSources(node)[0].key] });
    expect(characterUsesMasculineArchetypes(excluded)).toBe(false);
    expect(characterUsesMasculineArchetypes(make(FRAMEWORK_TYPES.fate))).toBe(false);
  });

  it('recognizes live and detached masculine references and preserves dormant dark-side data', () => {
    const input = { id: 'F', kind: 'framework', frameworkId: 'jungianMasculineArchetypes', title: 'Male archetypes' };
    const node = characterProfilePatch({ ...character, archetypeEnabled: true, archetypeDarkSideUp: 'Demanding', archetypeDarkSideBack: 'Withdrawn' }, { nodes: { F: input } }, { links: [{ nodeId: 'F', snapshot: input }] });
    expect(characterUsesMasculineArchetypes(node, { nodes: { F: input } })).toBe(true);
    expect(characterUsesMasculineArchetypes(wizardLibraryRecord(node, 'LIB-C').entity.template)).toBe(true);
    const excluded = characterProfilePatch(node, {}, { excluded: ['node:F'] });
    expect(excluded.body).not.toContain('One recorded dark side');
    expect(excluded.archetypeDarkSideUp).toBe('Demanding');
  });
});
