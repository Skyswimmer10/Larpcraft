import { describe, expect, it } from 'vitest';
import { makeLibrarySeed, MECHANIC_SUBNODE_TYPES, migrateLibrary } from './seed.js';
import { isCurrentMechanicPrimitive, isCurrentMechanicSubnode, isOldMechanicPrimitive, isOldMechanicSubnode } from '../mechanics/nodeArchive.js';
import {
  MECHANIC_NODE_KINDS, MECHANIC_NODE_TYPE_META, SPECTRUM_OF_YES,
  MECHANIC_SUBNODE_KINDS, MECHANIC_SUBNODE_TYPE_META,
} from './mechanicsModel.ts';
import { buildMechanicsPaletteGroups, mechanicsPayloadToNode } from '../mechanics/palette.js';

describe('mechanics model', () => {
  it('defines the core mechanics node types', () => {
    expect(MECHANIC_NODE_KINDS).toEqual([
      'taskTemplate',
      'cooperation',
      'physicalRestriction',
      'propInteraction',
      'sensorNode',
      'actuatorNode',
      'action',
      'playerFacingInstruction',
      'actionSequence',
      'actionProbability',
      'characterState',
      'progressState',
    ]);
    for (const kind of MECHANIC_NODE_KINDS) {
      expect(MECHANIC_NODE_TYPE_META[kind]).toEqual(expect.objectContaining({
        label: expect.any(String),
        color: expect.any(String),
        icon: expect.any(String),
        blurb: expect.any(String),
      }));
    }
  });

  it('keeps the Spectrum of Yes as six graduated outcomes', () => {
    expect(SPECTRUM_OF_YES.map((x) => x.id)).toEqual(['yes-and', 'yes', 'yes-but', 'no-but', 'no', 'no-and']);
  });

  it('seeds the mechanics library with those node types', () => {
    const lib = makeLibrarySeed();
    const seededKinds = Object.values(lib.mechPrimitives).map((node) => node.mechKind).filter(Boolean);
    expect(seededKinds).toEqual(expect.arrayContaining([...MECHANIC_NODE_KINDS]));
    expect(seededKinds).not.toContain('challengeCore');
    expect(lib.mechPrimitives['LIB-MPRIM-COOPERATION']).toMatchObject({
      name: 'Cooperation',
      mechKind: 'cooperation',
      cooperationStyle: 'Parallel',
    });
  });

  it('migrates Challenge Core nodes to Cooperation without losing their links', () => {
    const old = makeLibrarySeed();
    old.rev = 17;
    delete old.mechPrimitives['LIB-MPRIM-COOPERATION'];
    old.mechPrimitives['LIB-MPRIM-CHALLENGE-CORE'] = {
      id: 'LIB-MPRIM-CHALLENGE-CORE', name: 'Challenge Core', mechKind: 'challengeCore', baseKind: 'mechanic',
    };
    old.mechSubnodes['LIB-MSUB-noSoloEnforcer'].attachesTo = ['challengeCore', 'taskTemplate'];
    old.mechStructures.LEGACY = {
      id: 'LEGACY', name: 'Legacy', edges: [], nodes: {
        C1: {
          id: 'C1', primitiveId: 'LIB-MPRIM-CHALLENGE-CORE', mechKind: 'challengeCore', kind: 'mechanic',
          title: 'Bridge Challenge Core', body: 'Coordinate the crossing.', goal: 'Cross together.',
          cooperationStyle: 'Relay', physicalTrackSubnodeIds: ['P1'], cognitiveTrackSubnodeIds: ['M1'],
        },
      },
    };

    const migrated = migrateLibrary(old);
    expect(migrated.mechPrimitives['LIB-MPRIM-CHALLENGE-CORE']).toBeUndefined();
    expect(migrated.mechStructures.LEGACY.nodes.C1).toMatchObject({
      primitiveId: 'LIB-MPRIM-COOPERATION', mechKind: 'cooperation', title: 'Bridge Cooperation',
      cooperationStyle: 'Relay', attachedSubnodeIds: ['P1', 'M1'],
    });
    expect(migrated.mechStructures.LEGACY.nodes.C1.body).toContain('Goal: Cross together.');
    expect(migrated.mechSubnodes['LIB-MSUB-noSoloEnforcer'].attachesTo).toEqual(['cooperation', 'taskTemplate']);
  });

  it('defines and seeds the mechanic subnodes as separate library records', () => {
    const lib = makeLibrarySeed();
    expect(MECHANIC_SUBNODE_KINDS).toHaveLength(22);
    expect(MECHANIC_SUBNODE_KINDS).toEqual(expect.arrayContaining(['triggerDelay', 'frequencyControl', 'multipleOutputLogic', 'conditionalActivation', 'value', 'lifespan', 'spendUseRule', 'spectrumOfYesOutcomes', 'readinessStatus', 'player', 'team', 'comment', 'actionTypePattern']));
    expect(MECHANIC_SUBNODE_KINDS).not.toEqual(expect.arrayContaining(['actionEconomy', 'actionFlow', 'actionAccess', 'actionPrompt', 'physicalActionPattern']));
    for (const kind of MECHANIC_SUBNODE_KINDS) {
      expect(MECHANIC_SUBNODE_TYPE_META[kind].purpose).toEqual(expect.any(String));
    }
    const seededKinds = Object.values(lib.mechSubnodes).map((node) => node.kind);
    expect(seededKinds).toEqual(expect.arrayContaining([...MECHANIC_SUBNODE_KINDS]));
  });

  it('categorizes mechanic subnodes into gameplay modifiers and supporting nodes', () => {
    const lib = makeLibrarySeed();
    const supporting = ['facilitatorNote', 'comment', 'readinessStatus', 'player', 'team'];
    const gameplay = [
      'noSoloEnforcer',
      'arbitration',
      'cooperativeEthosRole',
      'escalatingPressure',
      'failSafeScaffolding',
      'progressiveFeedback',
      'teamDiscussionPrompt',
      'coreMechanicModifier',
    ];

    expect(supporting.map((kind) => MECHANIC_SUBNODE_TYPES[kind].category)).toEqual(supporting.map(() => 'supporting'));
    expect(gameplay.map((kind) => MECHANIC_SUBNODE_TYPES[kind].category)).toEqual(gameplay.map(() => 'gameplayModifiers'));
    for (const node of Object.values(lib.mechSubnodes)) {
      expect(['gameplayModifiers', 'supporting']).toContain(node.category);
    }
  });

  it('migrates saved libraries by backfilling mechanic subnodes', () => {
    const old = makeLibrarySeed();
    delete old.mechSubnodes;
    const migrated = migrateLibrary(old);
    expect(Object.keys(migrated.mechSubnodes)).toHaveLength(22);
  });

  it('seeds and migrates all action templates without replacing custom structures', () => {
    const seeded = makeLibrarySeed();
    const actionTemplates = Object.values(seeded.mechStructures).filter((template) => template.templateKind === 'action');
    expect(actionTemplates).toHaveLength(23);
    expect(actionTemplates.map((template) => template.actionCode)).toEqual(expect.arrayContaining(['ACT-01', 'ACT-10', 'ACT-18', 'ACT-23']));

    const old = makeLibrarySeed();
    old.rev = 16;
    old.mechStructures.CUSTOM = { id: 'CUSTOM', name: 'My structure', nodes: {}, edges: [] };
    Object.keys(old.mechStructures).filter((id) => id.startsWith('LIB-MSTRUCT-ACT-')).forEach((id) => delete old.mechStructures[id]);
    const migrated = migrateLibrary(old);
    expect(migrated.mechStructures.CUSTOM.name).toBe('My structure');
    expect(Object.values(migrated.mechStructures).filter((template) => template.templateKind === 'action')).toHaveLength(23);
  });

  it('exposes board game nodes and action templates as separate mechanics palette groups', () => {
    const lib = makeLibrarySeed();
    const groups = buildMechanicsPaletteGroups(lib, { includeTemplates: true });
    expect(groups.find((group) => group.id === 'boardGame').items.map((item) => item.label)).toEqual(['Action', 'Action Sequence', 'Resolution']);
    expect(groups.find((group) => group.id === 'supporting').items.map((item) => item.label)).toContain('Player-Facing Instruction');
    expect(groups.find((group) => group.id === 'actionTemplates').items).toHaveLength(23);
    expect(groups.find((group) => group.id === 'templates').items.every((item) => !item.kicker.startsWith('ACT-'))).toBe(true);

    const inserted = mechanicsPayloadToNode('template:LIB-MSTRUCT-ACT-01', lib, {});
    expect(inserted.mechKind).toBe('actionSequence');
    expect(Object.keys(inserted.sub.nodes)).toHaveLength(3);
    expect(inserted.sequenceMode).toBe('Custom');
  });

  it('uses the simplified Action schemas and custom sequence modes', () => {
    const lib = makeLibrarySeed();
    expect(lib.mechPrimitives['LIB-MPRIM-ACTION']).toMatchObject({
      tokenMechanismId: '', orderMechanismId: '', specialMechanismId: '',
    });
    expect(lib.mechPrimitives['LIB-MPRIM-ACTION']).not.toHaveProperty('advantages');
    expect(lib.mechPrimitives['LIB-MPRIM-ACTION']).not.toHaveProperty('effects');
    expect(lib.mechPrimitives['LIB-MPRIM-ACTION']).not.toHaveProperty('variations');
    expect(lib.mechPrimitives['LIB-MPRIM-PLAYER-INSTRUCTION'].category).toBe('supporting');
    expect(Object.values(lib.actionPatternMechanisms).every((record) => (
      Array.isArray(record.advantages) && Array.isArray(record.effects) && Array.isArray(record.variations)
    ))).toBe(true);
    expect(lib.mechPrimitives['LIB-MPRIM-ACTION']).not.toHaveProperty('performer');
    expect(lib.mechPrimitives['LIB-MPRIM-ACTION']).not.toHaveProperty('numberOfPlayers');
    expect(lib.mechPrimitives['LIB-MPRIM-ACTION']).not.toHaveProperty('actionMode');
    expect(lib.mechPrimitives['LIB-MPRIM-ACTION']).not.toHaveProperty('playerInstruction');
    expect(lib.mechPrimitives['LIB-MPRIM-ACTION']).not.toHaveProperty('completionCondition');
    expect(lib.mechPrimitives['LIB-MPRIM-ACTION-SEQUENCE']).toMatchObject({ sequenceMode: 'Custom' });
    expect(lib.mechPrimitives['LIB-MPRIM-ACTION-SEQUENCE']).not.toHaveProperty('completionCondition');
    expect(Object.values(lib.mechanicSequenceModes).map((mode) => mode.label)).toEqual(['Custom']);
  });

  it('seeds Resolution with a human-readable resolution schema', () => {
    expect(makeLibrarySeed().mechPrimitives['LIB-MPRIM-ACTION-PROBABILITY']).toMatchObject({
      name: 'Resolution',
      mechKind: 'actionProbability',
      category: 'action',
      resolutionType: 'High Number',
      variations: [''],
      emotionalSpike: '',
      effects: [''],
      imageScale: 1,
      imagePositionX: 0,
      imagePositionY: 0,
    });
    expect(makeLibrarySeed().mechPrimitives['LIB-MPRIM-ACTION-PROBABILITY']).not.toHaveProperty('resolutionCategory');
    expect(makeLibrarySeed().mechPrimitives['LIB-MPRIM-ACTION-PROBABILITY']).not.toHaveProperty('resolutionProcedure');
  });

  it('keeps the mechanics restart set visible and archives the remaining node definitions', () => {
    const lib = makeLibrarySeed();
    expect(Object.values(lib.mechPrimitives).filter(isCurrentMechanicPrimitive).map((node) => node.mechKind)).toEqual([
      'sensorNode', 'actuatorNode', 'action', 'playerFacingInstruction', 'actionSequence', 'actionProbability', 'progressState',
    ]);
    expect(Object.values(lib.mechSubnodes).filter(isCurrentMechanicSubnode).map((node) => node.kind)).toEqual([
      'progressiveFeedback', 'failSafeScaffolding', 'escalatingPressure', 'teamDiscussionPrompt', 'facilitatorNote',
      'value', 'readinessStatus', 'team', 'comment', 'actionTypePattern',
    ]);
    expect(Object.values(lib.mechPrimitives).filter(isOldMechanicPrimitive).length).toBeGreaterThan(0);
    expect(Object.values(lib.mechSubnodes).filter(isOldMechanicSubnode).length).toBeGreaterThan(0);
  });

  it('migrates existing mechanic definitions into current and old-node shelves without deleting either', () => {
    const old = makeLibrarySeed();
    old.rev = 24;
    old.mechPrimitives['LIB-MPRIM-ACTION-PROBABILITY'].name = 'Action Probability';
    old.mechPrimitives['LIB-MPRIM-ACTION-PROBABILITY'].resolutionCategory = 'Numeric';
    old.mechPrimitives['LIB-MPRIM-ACTION-PROBABILITY'].resolutionProcedure = 'Roll and compare.';
    const migrated = migrateLibrary(old);
    expect(migrated.mechPrimitives['LIB-MPRIM-SENSOR-NODE'].oldNode).toBe(false);
    expect(migrated.mechPrimitives['LIB-MPRIM-TASK-TEMPLATE'].oldNode).toBe(true);
    expect(migrated.mechPrimitives['LIB-MPRIM-ACTION-PROBABILITY'].name).toBe('Resolution');
    expect(migrated.mechPrimitives['LIB-MPRIM-ACTION-PROBABILITY']).not.toHaveProperty('resolutionCategory');
    expect(migrated.mechPrimitives['LIB-MPRIM-ACTION-PROBABILITY']).not.toHaveProperty('resolutionProcedure');
    expect(migrated.mechSubnodes['LIB-MSUB-progressiveFeedback'].oldNode).toBe(false);
    expect(migrated.mechSubnodes['LIB-MSUB-noSoloEnforcer'].oldNode).toBe(true);
  });

  it('migrates old Action fields into the simplified nodes', () => {
    const old = makeLibrarySeed();
    old.rev = 18;
    old.mechStructures.LEGACY_ACTION = {
      id: 'LEGACY_ACTION', name: 'Legacy Action', edges: [], nodes: {
        A1: {
          id: 'A1', primitiveId: 'LIB-MPRIM-ACTION', kind: 'mechanic', mechKind: 'action',
          title: 'Pull Together', body: 'A coordinated pull.', playerInstruction: 'Pull when the bell rings.',
          actionMode: 'Manipulate', performer: 'Everyone', completionCondition: 'The gate opens.',
          advantage: 'Fast to teach.', effect: 'Opens the gate.', variation: 'Use two ropes.', x: 20, y: 40,
        },
        S1: {
          id: 'S1', primitiveId: 'LIB-MPRIM-ACTION-SEQUENCE', kind: 'mechanic', mechKind: 'actionSequence',
          title: 'Old Sequence', sequenceMode: 'Repeat', completionCondition: 'Three rounds.', x: 500, y: 40,
        },
      },
    };

    const migrated = migrateLibrary(old);
    const graph = migrated.mechStructures.LEGACY_ACTION;
    expect(graph.nodes.A1).toMatchObject({
      advantages: ['Fast to teach.'], effects: ['Opens the gate.'], variations: ['Use two ropes.'],
      tokenMechanismId: '', orderMechanismId: '', specialMechanismId: '',
    });
    expect(graph.nodes.A1).not.toHaveProperty('performer');
    expect(graph.nodes.A1).not.toHaveProperty('numberOfPlayers');
    expect(graph.nodes.A1).not.toHaveProperty('playerInstruction');
    expect(graph.nodes.A1).not.toHaveProperty('actionMode');
    expect(graph.nodes.A1).not.toHaveProperty('completionCondition');
    expect(graph.nodes['A1-INSTRUCTION']).toMatchObject({
      mechKind: 'playerFacingInstruction', body: 'Pull when the bell rings.',
    });
    expect(graph.edges).toContainEqual(expect.objectContaining({ from: 'A1', to: 'A1-INSTRUCTION' }));
    expect(graph.nodes.S1).toMatchObject({ sequenceMode: 'Custom' });
    expect(graph.nodes.S1).not.toHaveProperty('completionCondition');
  });

  it('consolidates legacy action modifiers into Action Type Pattern', () => {
    const old = makeLibrarySeed();
    old.rev = 19;
    old.mechSubnodes['LIB-MSUB-actionEconomy'] = {
      id: 'LIB-MSUB-actionEconomy', kind: 'actionEconomy', name: 'Action Economy', fields: {},
    };
    old.mechStructures.LEGACY_PATTERN = {
      id: 'LEGACY_PATTERN', name: 'Legacy Pattern', edges: [], nodes: {
        M1: {
          id: 'M1', primitiveId: 'LIB-MSUB-actionEconomy', kind: 'mechanicSubnode', subnodeKind: 'actionEconomy',
          title: 'Action Economy', body: 'Controls action budgets.', x: 20, y: 40,
          fields: { mechanism: 'ACT-14 Advantage Token', rule: 'The holder may act.', budgetOrLimit: 'One token', availabilityRule: 'Transfer after use.' },
        },
      },
    };

    const migrated = migrateLibrary(old);
    expect(migrated.mechSubnodes['LIB-MSUB-actionEconomy']).toBeUndefined();
    expect(migrated.mechStructures.LEGACY_PATTERN.nodes.M1).toMatchObject({
      primitiveId: 'LIB-MSUB-actionTypePattern', subnodeKind: 'actionTypePattern', title: 'Action Type Pattern',
      fields: {
        tokenMechanismId: 'APM-ADVANTAGE-TOKEN', activeMechanismId: 'APM-ADVANTAGE-TOKEN',
        coreRule: 'The holder may act.', budgetLimit: 'One token', availability: 'Transfer after use.',
      },
    });
  });

  it('starts a blank Action Type Pattern with every system optional', () => {
    const pattern = makeLibrarySeed().mechSubnodes['LIB-MSUB-actionTypePattern'];
    expect(pattern.fields).toMatchObject({
      tokenMechanismId: '', orderMechanismId: '', specialMechanismId: '', activeMechanismId: '',
    });
  });

  it('starts new Task Templates with a Cooperation node', () => {
    const lib = makeLibrarySeed();
    const task = mechanicsPayloadToNode('mech:LIB-MPRIM-TASK-TEMPLATE', lib, {});
    expect(task.sub.nodes['COOP-1']).toMatchObject({
      primitiveId: 'LIB-MPRIM-COOPERATION',
      mechKind: 'cooperation',
      cooperationStyle: 'Parallel',
    });
  });
});
