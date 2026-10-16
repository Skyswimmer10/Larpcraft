import { it, expect } from 'vitest';
import { GAME_TYPE_QUESTIONS, gameTypeSummary } from './gameTypes.js';
import { makeLibrarySeed, migrateLibrary, migrateProject, makeEmptyProject } from './seed.js';
import { mechanicsPayloadToNode } from '../mechanics/palette.js';

it('backfills Game Type and keeps settings independent for separate activities', () => {
  const old = makeLibrarySeed();
  delete old.mechPrimitives['LIB-MPRIM-GAME-TYPE'];
  const lib = migrateLibrary(old);
  const a = mechanicsPayloadToNode('mech:LIB-MPRIM-GAME-TYPE', lib, {});
  const b = mechanicsPayloadToNode('mech:LIB-MPRIM-GAME-TYPE', lib, { [a.id]: a });
  a.gameType.scope = 'game';
  a.gameType.relationship = 'cooperative';
  a.gameType.betweenTries = 'carryForward';
  a.gameType.carriedChanges = 'Keep points, keys and unlocked rules';
  b.gameType.relationship = 'competitive';
  expect(b.gameType.scope).toBe('activity');
  expect(lib.mechPrimitives['LIB-MPRIM-GAME-TYPE'].gameType).toEqual({ scope: 'activity' });
  const project = { ...makeEmptyProject('Game'), taskNodes: { [a.id]: a, [b.id]: b } };
  const loaded = migrateProject(JSON.parse(JSON.stringify(project)));
  expect(loaded.taskNodes[a.id].gameType).toEqual(a.gameType);
  expect(loaded.taskNodes[b.id].gameType.relationship).toBe('competitive');
  expect(gameTypeSummary(loaded.taskNodes[a.id]).map(row => row.text)).toContain('Changes carry forward');
});

it('offers the three agreed try policies and summarises custom outcomes and hidden roles', () => {
  expect(GAME_TYPE_QUESTIONS.find(q => q.key === 'betweenTries').options.map(([, label]) => label)).toEqual(['Everything resets', 'Changes carry forward', 'Intended to be played once']);
  const rows = gameTypeSummary({ gameType: { players: 'teams', outcome: 'custom', customOutcome: 'Two teams can win', hiddenRoles: true, traitor: true } });
  expect(rows.map(row => row.text)).toEqual(['Teams', 'Two teams can win', 'Hidden roles', 'Hidden traitor']);
  expect(gameTypeSummary({})).toEqual([]);
});
