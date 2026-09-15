import { MECHANISM_COLLECTIONS, appliedMechanismRecord } from './mechanismCatalog.js';
import { makeLibrarySeed, migrateLibrary } from './seed.js';
import { describe, expect, it } from 'vitest';
import {
  ACTION_MECHANISM_NODE_KIND,
  ACTION_MECHANISMS,
  actionMechanismNodePatch,
  makeActionMechanicTemplates,
  makeActionPatternMechanisms,
  updateActionPatternSelection,
} from './actionMechanics.js';

describe('action mechanics catalogue', () => {
  it('contains the complete ACT-01 through ACT-23 catalogue', () => {
    expect(ACTION_MECHANISMS).toHaveLength(23);
    expect(ACTION_MECHANISMS.map((mechanism) => mechanism.code)).toEqual(
      Array.from({ length: 23 }, (_, index) => `ACT-${String(index + 1).padStart(2, '0')}`),
    );
  });

  it('builds each mechanism as an action, player instruction, and editable modifier', () => {
    const templates = makeActionMechanicTemplates();
    expect(Object.keys(templates)).toHaveLength(23);
    Object.values(templates).forEach((template) => {
      expect(template.templateKind).toBe('action');
      expect(Object.values(template.nodes)).toHaveLength(3);
      expect(template.nodes.ACTION.mechKind).toBe('action');
      expect(template.nodes.INSTRUCTION.mechKind).toBe('playerFacingInstruction');
      expect(template.nodes.ACTION).not.toHaveProperty('advantages');
      expect(template.nodes.ACTION).not.toHaveProperty('effects');
      expect(template.nodes.ACTION).not.toHaveProperty('variations');
      const chosenPatternIds = [template.nodes.ACTION.tokenMechanismId, template.nodes.ACTION.orderMechanismId, template.nodes.ACTION.specialMechanismId].filter(Boolean);
      expect(chosenPatternIds).toHaveLength(1);
      expect(chosenPatternIds[0]).toBe(template.nodes.PATTERN.fields.activeMechanismId);
      expect(template.nodes.ACTION).not.toHaveProperty('performer');
      expect(template.nodes.ACTION).not.toHaveProperty('numberOfPlayers');
      expect(template.nodes.ACTION).not.toHaveProperty('actionMode');
      expect(template.nodes.ACTION).not.toHaveProperty('playerInstruction');
      expect(template.nodes.ACTION).not.toHaveProperty('completionCondition');
      expect(Object.values(template.nodes).some((node) => node.kind === 'mechanicSubnode')).toBe(true);
      expect(template.nodes.PATTERN.subnodeKind).toBe('actionTypePattern');
      expect(template.edges).toHaveLength(2);
    });
  });

  it('groups clean mechanism names into the three human-facing systems', () => {
    const mechanisms = Object.values(makeActionPatternMechanisms());
    expect(mechanisms).toHaveLength(23);
    expect(mechanisms.every((mechanism) => !/ACT-\d+/i.test(mechanism.label))).toBe(true);
    const tokenNames = mechanisms.filter((mechanism) => mechanism.system === 'token').map((mechanism) => mechanism.label);
    const orderNames = mechanisms.filter((mechanism) => mechanism.system === 'order').map((mechanism) => mechanism.label);
    const specialNames = mechanisms.filter((mechanism) => mechanism.system === 'special').map((mechanism) => mechanism.label);
    expect(tokenNames).toContain('Advantage Token');
    expect(specialNames).not.toContain('Advantage Token');
    expect(orderNames).not.toEqual(expect.arrayContaining(['Events', 'Narrative Choice', 'Bingo']));
    expect(specialNames).toEqual(expect.arrayContaining(['Events', 'Narrative Choice', 'Bingo']));
    expect(mechanisms.every((mechanism) => (
      mechanism.description && mechanism.category && mechanism.image?.dataUrl
      && mechanism.imageScale === 1 && mechanism.imagePositionX === 0 && mechanism.imagePositionY === 0
      && Array.isArray(mechanism.advantages) && Array.isArray(mechanism.effects) && Array.isArray(mechanism.variations)
    ))).toBe(true);
  });

  it('allows each Action Type Pattern system to be independently set to none', () => {
    const mechanisms = makeActionPatternMechanisms();
    const initial = {
      tokenMechanismId: 'APM-ACTION-POINTS',
      orderMechanismId: 'APM-ACTION-QUEUE',
      specialMechanismId: '',
      activeMechanismId: 'APM-ACTION-POINTS',
    };
    const withoutToken = updateActionPatternSelection(initial, 'token', '', mechanisms);
    expect(withoutToken).toMatchObject({
      tokenMechanismId: '',
      orderMechanismId: 'APM-ACTION-QUEUE',
      specialMechanismId: '',
      activeMechanismId: 'APM-ACTION-QUEUE',
    });

    const empty = updateActionPatternSelection(withoutToken, 'order', '', mechanisms);
    expect(empty).toMatchObject({
      tokenMechanismId: '', orderMechanismId: '', specialMechanismId: '', activeMechanismId: '',
    });
  });

  it('replaces an Action placeholder with a self-contained mechanism snapshot', () => {
    const record = makeActionPatternMechanisms()['APM-ACTION-DRAFTING'];
    const patch = actionMechanismNodePatch({
      ...record,
      advantages: ['Makes choices scarce.'],
      effects: ['Removes the chosen action from the pool.'],
      variations: ['Draft face down.'],
    });

    expect(patch).toMatchObject({
      mechKind: ACTION_MECHANISM_NODE_KIND,
      actionMechanismId: record.id,
      mechanismSystem: 'token',
      title: 'Action Drafting',
      body: record.description,
      primitiveId: null,
      tokenMechanismId: undefined,
      orderMechanismId: undefined,
      specialMechanismId: undefined,
      advantages: ['Makes choices scarce.'],
      effects: ['Removes the chosen action from the pool.'],
      variations: ['Draft face down.'],
    });
    expect(patch.image).not.toBe(record.image);
    expect(patch).not.toHaveProperty('id');
    expect(patch).not.toHaveProperty('x');
    expect(patch).not.toHaveProperty('y');
    expect(patch).not.toHaveProperty('w');
    expect(patch).not.toHaveProperty('h');
  });
});


describe('Action selection across the mechanism browser', () => {
  it.each(Object.entries(MECHANISM_COLLECTIONS))('keeps %s mechanisms intact through selection, serialization, and migration', (kind, collection) => {
    const library = makeLibrarySeed();
    const source = Object.values(library[collection])[0];
    const record = { ...source, kind, description: 'Authored description', image: { dataUrl: 'data:image/png;base64,custom' }, imageScale: 1.7, imagePositionX: -18, imagePositionY: 22, effects: ['Effect'], variations: ['Variation'], emotionalSpike: kind === 'probability' ? 'Tension' : '' };
    const patch = actionMechanismNodePatch(record);
    const node = { id: 'A', kind: 'mechanic', x: 120, y: 90, w: 400, attachedSubnodeIds: ['MOD'], ...patch };
    library.mechStructures.CUSTOM = { id: 'CUSTOM', name: 'Test structure', nodes: { A: node }, edges: [] };
    const saved = migrateLibrary(JSON.parse(JSON.stringify(library))).mechStructures.CUSTOM.nodes.A;
    expect(saved).toMatchObject({ id: 'A', x: 120, y: 90, w: 400, attachedSubnodeIds: ['MOD'], mechanismKind: kind, actionMechanismId: source.id, body: 'Authored description', image: record.image, imageScale: 1.7, imagePositionX: -18, imagePositionY: 22, effects: ['Effect'], variations: ['Variation'], emotionalSpike: record.emotionalSpike });
    expect(appliedMechanismRecord(library, saved)).toBe(library[collection][source.id]);
    patch.effects.push('Detached edit');
    expect(record.effects).toEqual(['Effect']);
  });

  it('can change categories and still resolve older pattern snapshots', () => {
    const lib = makeLibrarySeed();
    const probability = actionMechanismNodePatch(Object.values(lib.actionProbabilityMechanisms)[0]);
    const pattern = Object.values(lib.actionPatternMechanisms)[0];
    const switched = { ...probability, ...actionMechanismNodePatch(pattern) };
    expect(switched.emotionalSpike).toBe('');
    expect(appliedMechanismRecord(lib, switched)).toBe(pattern);
    expect(appliedMechanismRecord(lib, { actionMechanismId: pattern.id })).toBe(pattern);
    expect(actionMechanismNodePatch({ id: 'invalid', kind: 'unknown' })).toBeNull();
  });
});
