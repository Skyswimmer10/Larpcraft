import { describe, expect, it } from 'vitest';
import { makeLibrarySeed, MECHANIC_SUBNODE_TYPES, migrateLibrary } from './seed.js';
import {
  MECHANIC_NODE_KINDS, MECHANIC_NODE_TYPE_META, SPECTRUM_OF_YES,
  MECHANIC_SUBNODE_KINDS, MECHANIC_SUBNODE_TYPE_META,
} from './mechanicsModel.ts';

describe('mechanics model', () => {
  it('defines the core mechanics node types', () => {
    expect(MECHANIC_NODE_KINDS).toEqual([
      'taskTemplate',
      'challengeCore',
      'physicalRestriction',
      'propInteraction',
      'sensorNode',
      'actuatorNode',
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
  });

  it('defines and seeds the twenty-one mechanic subnodes as separate library records', () => {
    const lib = makeLibrarySeed();
    expect(MECHANIC_SUBNODE_KINDS).toHaveLength(21);
    expect(MECHANIC_SUBNODE_KINDS).toEqual(expect.arrayContaining(['triggerDelay', 'frequencyControl', 'multipleOutputLogic', 'conditionalActivation', 'value', 'lifespan', 'spendUseRule', 'spectrumOfYesOutcomes', 'readinessStatus', 'player', 'team', 'comment']));
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
    expect(Object.keys(migrated.mechSubnodes)).toHaveLength(21);
  });
});
