import { describe, expect, it, vi } from 'vitest';
import { buildStoryLibrarySections, narrativeLibraryMode } from './narrativeLibrary.js';
import { buildNarrativeLinkInsertion } from './narrativeLinks.js';
import { createWizardNode, wizardLibraryRecord } from './narrativeWizard.js';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import bundled from '../data/deployedLibrary.json';

const character = wizardLibraryRecord(createWizardNode({ id: 'C', title: 'Moro', source: FRAMEWORK_TYPES.fate, type: 'framework', focus: 'character', questions: [{ key: 'trust', prompt: 'Whom do they trust?' }], answers: { trust: 'Their sister.' } }), 'CHARACTER').entity;
const library = () => ({
  narrative: { CHARACTER: character, FOREST: { id: 'FOREST', name: 'Magical forest', nodeClass: 'base', nodeKind: 'storyLocation', body: 'An ancient enchanted wood.', template: { kind: 'storyLocation', body: 'An ancient enchanted wood.' } }, GUILD: { id: 'GUILD', name: 'Lantern Guild', nodeKind: 'group', nodeClass: 'base' }, SUB: { id: 'SUB', name: 'A relationship change', nodeClass: 'subnode', subKind: 'relChange' } },
  concepts: { DRAGON: { ...bundled.concepts['LIB-CPT-DRAGON'] }, PLAN: { id: 'PLAN', name: 'The forest encounter', narrativeWizard: { sourceId: 'LIB-CPT-DRAGON', sourceType: 'concept', answers: { danger: 'The trees awaken.' } }, nodes: {}, edges: [] }, CUSTOM: { id: 'CUSTOM', name: 'An original storytelling technique', premade: false, nodes: {} } },
  stories: { STRUCTURE: { id: 'STRUCTURE', name: 'Three-act structure', nodes: {}, edges: [] } },
});
const items = (lib, mode, onPick, options) => buildStoryLibrarySections(lib, mode, onPick, options).flatMap(section => section.items);

describe('separate story library browsers', () => {
  it('keeps reference concepts and frameworks separate from created characters, places, groups and wizard plans', () => {
    const lib = library(), before = JSON.stringify(lib);
    const tools = items(lib, 'tools').map(item => item.label), content = items(lib, 'content').map(item => item.label);
    for (const label of ['FATE', 'Dragon & the City', 'Three-act structure', 'An original storytelling technique']) expect(tools).toContain(label);
    for (const label of ['Moro', 'Magical forest', 'Lantern Guild', 'The forest encounter', 'A relationship change']) { expect(content).toContain(label); expect(tools).not.toContain(label); }
    expect(content).not.toContain('FATE'); expect(content).not.toContain('Dragon & the City');
    expect(buildStoryLibrarySections(lib, 'content').find(section => section.id === 'places').items[0].label).toBe('Magical forest');
    expect(JSON.stringify(lib)).toBe(before);
  });

  it('keeps every bundled reference concept in tools and recognizes saved session history as content', () => {
    const tools = items(bundled, 'tools');
    expect(tools.filter(item => item.id.startsWith('frameworks:'))).toHaveLength(Object.keys(FRAMEWORK_TYPES).length);
    for (const record of Object.values(bundled.concepts)) expect(tools.find(item => item.id === `concepts:${record.id}`)?.symbolSource).toBe(record);
    expect(narrativeLibraryMode({ narrativeWizardHistory: [{ sourceId: 'fate' }] }, 'concepts')).toBe('content');
    expect(items(library(), 'tools', null, { includeSubnodes: false }).some(item => item.id === 'narrative:SUB')).toBe(false);
  });

  it('routes picks to the original collection and inserts independent editable copies', () => {
    const lib = library(), pick = vi.fn();
    items(lib, 'content', pick).find(item => item.id === 'narrative:CHARACTER').onPick();
    expect(pick).toHaveBeenCalledWith({ coll: 'narrative', id: 'CHARACTER', record: lib.narrative.CHARACTER });
    const copy = buildNarrativeLinkInsertion(lib, { type: 'narrative', id: 'CHARACTER' }, {}, { x: 120, y: 80 });
    expect(copy.kind).toBe('character'); expect(copy.narrativeWizard.answers.trust).toBe('Their sister.');
    copy.narrativeWizard.answers.trust = 'Someone else.';
    expect(lib.narrative.CHARACTER.template.narrativeWizard.answers.trust).toBe('Their sister.');
    expect(buildNarrativeLinkInsertion(lib, { type: 'narrative', id: 'FOREST' }, {}).body).toBe('An ancient enchanted wood.');
    items(lib, 'tools', pick).find(item => item.id === 'frameworks:fate').onPick();
    expect(pick).toHaveBeenLastCalledWith({ coll: 'frameworks', id: 'fate', record: FRAMEWORK_TYPES.fate });
  });
});
