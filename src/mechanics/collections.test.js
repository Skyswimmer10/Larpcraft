import { expect, it } from 'vitest';
import { collectionPayload, collectionSources, favoritesFirst, libraryWithMechanismDraft, readableColumnCount, savedMechanicsForSource } from './collections.js';
import { mechanicsPayloadToNode } from './palette.js';
import { makeLibrarySeed, migrateLibrary, makeEmptyProject } from '../data/seed.js';
import { createWorkspaceBackup, readWorkspaceBackup } from '../lib/workspaceTransfer.js';
import { reducer } from '../state/reducer.js';

it('keeps image-bearing cards readable while allowing four and five columns', () => {
  expect(readableColumnCount(850, 4)).toBe(4);
  expect(readableColumnCount(1034, 5)).toBe(5);
  expect(readableColumnCount(850, 5)).toBe(4);
  expect(readableColumnCount(240, 5)).toBe(1);
});

it('keeps starred records first without replacing the ordinary name order', () => {
  const records = [{ label: 'Alpha' }, { label: 'Zulu', favorite: true }, { label: 'Beta' }];
  expect([...records].sort((a, b) => favoritesFirst(a, b) || a.label.localeCompare(b.label)).map(r => r.label)).toEqual(['Zulu', 'Alpha', 'Beta']);
});

it('copies edited catalogue details and images into a new node without changing the library', () => {
  const lib = makeLibrarySeed();
  const original = Object.values(lib.actionPatternMechanisms)[0];
  const record = { ...original, playerActions: 'My game action', imageScale: 1.25, imagePositionX: -17, imagePositionY: 4, effects: ['Reveal'] };
  const draftLib = libraryWithMechanismDraft(lib, record);
  const node = mechanicsPayloadToNode(collectionPayload(record.kind, record.id), draftLib, {}, 300, 500);
  expect(node).toMatchObject({ kind: 'mechanic', mechKind: 'actionMechanism', title: record.label, playerActions: record.playerActions, imageScale: 1.25, imagePositionX: -17, x: 300, y: 500 });
  expect(node.image).toEqual(record.image);
  node.effects.push('Another result');
  expect(record.effects).toEqual(['Reveal']);
  expect(lib.actionPatternMechanisms[record.id]).toBe(original);
  expect(original.imageScale).toBe(1);
});

it('preserves source metadata, stars, and complete saved trees through a workspace round trip', () => {
  let lib = makeLibrarySeed();
  const record = Object.values(lib.actionPatternMechanisms)[0];
  lib = reducer(lib, { type: 'UPDATE_ENTITY', coll: 'actionPatternMechanisms', id: record.id, patch: { favorite: true } });
  lib = reducer(lib, { type: 'ADD_ENTITY', coll: 'mechanicsSources', entity: { id: 'source-1', label: 'Outdoor games', categories: { route: { id: 'route', label: 'Routes' } } } });
  lib = reducer(lib, { type: 'ADD_ENTITY', coll: 'mechStructures', entity: { id: 'T', name: 'Route', sourceId: 'source-1', collectionCategoryId: 'route', favorite: true, nodes: { A: { id: 'A', sub: { nodes: { B: { id: 'B', title: 'Nested' } }, edges: [] } } }, edges: [], numberMarkers: { N: { id: 'N', value: '1' } }, titleMarkers: { L: { id: 'L', text: 'Title' } } } });
  const copy = readWorkspaceBackup(JSON.stringify(createWorkspaceBackup(lib, makeEmptyProject())));
  expect(copy.library.actionPatternMechanisms[record.id].favorite).toBe(true);
  expect(copy.library.mechanicsSources['source-1'].categories.route.label).toBe('Routes');
  expect(savedMechanicsForSource(copy.library, 'source-1').map(r => r.id)).toEqual(['T']);
  expect(savedMechanicsForSource(copy.library, 'saved').some(r => r.id === 'T')).toBe(false);
  expect(collectionSources(copy.library).map(s => s.id)).toEqual(['board', 'saved', 'source-1']);
  const node = mechanicsPayloadToNode('template:T', copy.library);
  expect(node.sub.nodes.A.sub.nodes.B.title).toBe('Nested');
  expect(node.sub.numberMarkers.N.value).toBe('1');
  expect(node.sub.titleMarkers.L.text).toBe('Title');
  node.sub.nodes.A.sub.nodes.B.title = 'Changed in game';
  expect(copy.library.mechStructures.T.nodes.A.sub.nodes.B.title).toBe('Nested');
  expect(migrateLibrary(copy.library).mechanicsSources).toEqual(copy.library.mechanicsSources);
});
