import { it, expect } from 'vitest';
import { PLAYER_TYPES } from './playerTypes.js';
import { CSV_SCHEMAS } from './csvSchemas.js';
import { parseCsv, toCsv } from '../lib/csv.js';

it('keeps overlapping model labels distinct and preserves multiple selections in CSV', () => {
  expect(new Set(PLAYER_TYPES.map(t => t.id)).size).toBe(14);
  const player = { id: 'P', name: 'Test', teamId: 'T', flags: [], playerTypeIds: ['bartle:explorer', 'playstyles:explorer', 'playstyles:artist'] };
  const state = { players: { P: player }, teams: { T: { name: 'Team' } } };
  const schema = CSV_SCHEMAS.players;
  const rows = schema.toRows(state);
  expect(rows[0].playerTypeIds).toBe(player.playerTypeIds.join(';'));
  expect(schema.fromRow(rows[0], state, () => {}).playerTypeIds).toEqual(player.playerTypeIds);
  expect(schema.fromRow({ id: 'P', teamId: 'T' }, state, () => {}).playerTypeIds).toEqual(player.playerTypeIds);
  expect(schema.fromRow({ id: 'P', teamId: 'T', playerTypeIds: '' }, state, () => {}).playerTypeIds).toEqual([]);
});
