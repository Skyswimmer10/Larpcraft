import { describe, expect, it } from 'vitest';
import { ATTRIBUTE_PRESETS, attributeValues, characterAttributesText, newAttributeField, toggleAttributeValue } from './characterAttributes.js';
import { characterExport, editCharacterDescription, syncCharacterProfile } from './characterProfile.js';
import { appendWizardResult, createWizardNode, wizardLibraryRecord } from './narrativeWizard.js';
import { FRAMEWORK_TYPES, makeEmptyProject, migrateProject } from '../data/seed.js';
import { createCanvasClipboard, remapCanvasClipboard } from './canvasClipboard.js';
import { undoableReducer } from '../state/store.jsx';

const attributes = () => ({ version: 1, fields: [
  { id: 'personality', label: 'Personality', category: 'personality', kind: 'tags', values: ['Curious', 'Patient'] },
  { id: 'custom:mark', label: 'Distinguishing mark', category: 'custom', kind: 'text', value: 'A silver hand.' },
  { ...newAttributeField(ATTRIBUTE_PRESETS.find(field => field.id === 'skills')) },
] });
const character = () => ({ id: 'C', kind: 'character', title: 'Uno', body: '', characterAttributes: attributes() });

describe('optional quick character attributes', () => {
  it('supports an attributes-only character without requiring or creating a wizard profile', () => {
    const node = character(), before = JSON.stringify(node);
    expect(syncCharacterProfile(node)).toBe(node);
    for (const format of ['full', 'short', 'ai']) {
      const output = characterExport(node, {}, format);
      expect(output).toContain('Personality: Curious, Patient');
      expect(output).toContain('Distinguishing mark: A silver hand.');
      expect(output).not.toContain('Skills:');
    }
    expect(JSON.stringify(node)).toBe(before);
    expect(node.characterProfile).toBeUndefined();
  });

  it('keeps custom tag wording, removes duplicate values and toggles a tag without mutating the old selection', () => {
    const field = { id: 'custom:weather', label: 'Weather sense', kind: 'tags', values: [' Patient ', 'patient', '', 'Storm-watcher'] };
    expect(attributeValues(field)).toEqual(['Patient', 'Storm-watcher']);
    const next = toggleAttributeValue(field, 'PATIENT');
    expect(next.values).toEqual(['Storm-watcher']);
    expect(toggleAttributeValue(next, ' Unusual trigger ').values).toEqual(['Storm-watcher', 'Unusual trigger']);
    expect(field.values).toEqual([' Patient ', 'patient', '', 'Storm-watcher']);
  });

  it('updates attributes and framework answers independently, retaining protected author prose', () => {
    const make = answer => createWizardNode({ source: FRAMEWORK_TYPES.fate, type: 'framework', id: 'C', title: 'Uno', focus: 'character', questions: [{ key: 'phase:E', prompt: 'Which feeling returns?' }], answers: { 'phase:E': answer } });
    let node = { ...make('They feel fear.'), characterAttributes: attributes() };
    node = editCharacterDescription(node, {}, `${node.body}\n\nThey carry a sealed letter.`);
    const before = node.body, wizard = JSON.stringify(node.narrativeWizard);
    const nextAttributes = { ...attributes(), fields: [{ ...attributes().fields[0], values: ['Bold'] }] };
    const project = { ...makeEmptyProject(), nodes: { C: node } };
    const changed = undoableReducer({ present: project, past: [] }, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'C', patch: { characterAttributes: nextAttributes } });
    expect(changed.present.nodes.C.body).toBe(before);
    expect(JSON.stringify(changed.present.nodes.C.narrativeWizard)).toBe(wizard);
    const revised = appendWizardResult(changed.present.nodes.C, make('They feel hope.'));
    expect(revised.body).toContain('They carry a sealed letter.');
    expect(revised.characterAttributes).toEqual(nextAttributes);
    expect(characterExport(revised, {}, 'full')).toContain('Personality: Bold');
    expect(undoableReducer(changed, { type: 'UNDO' }).present.nodes.C.characterAttributes).toEqual(attributes());
  });

  it('survives JSON migration, library templates and independent canvas copies, including nested characters', () => {
    const node = character();
    const project = { ...makeEmptyProject(), nodes: { C: node, P: { id: 'P', kind: 'storyBeat', sub: { nodes: { N: { ...node, id: 'N' } }, edges: [] } } } };
    const restored = migrateProject(JSON.parse(JSON.stringify(project)));
    expect(restored.nodes.C.characterAttributes).toEqual(node.characterAttributes);
    expect(restored.nodes.P.sub.nodes.N.characterAttributes).toEqual(node.characterAttributes);
    const template = wizardLibraryRecord(node, 'LIB-C').entity.template;
    expect(template.characterAttributes).toEqual(node.characterAttributes);
    template.characterAttributes.fields[0].values.push('New library value');
    expect(node.characterAttributes.fields[0].values).not.toContain('New library value');
    const copy = remapCanvasClipboard(createCanvasClipboard({ C: node }, [], ['C']), {});
    expect(copy.nodes[copy.idMap.C].characterAttributes).toEqual(node.characterAttributes);
  });

  it('omits unset attributes for older characters and for empty selected fields', () => {
    expect(characterAttributesText({})).toBe('');
    expect(characterAttributesText({ characterAttributes: { fields: [{ id: 'blank', label: 'Blank', kind: 'text', value: ' ' }] } })).toBe('');
    expect(characterExport({ kind: 'character', body: 'Older description.' }, {}, 'full')).toBe('Older description.');
  });
});
