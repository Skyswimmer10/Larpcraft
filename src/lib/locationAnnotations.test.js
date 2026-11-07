import { describe, expect, it } from 'vitest';
import { locationMapDefaults, makeEmptyProject, migrateProject } from '../data/seed.js';
import { undoableReducer } from '../state/store.jsx';
import { mapRows, mapAudienceVisible, mapZoneRect, moveMapAnnotation, resizeMapZone, updateMapOverlay, removeMapOverlay, anchorMapAnnotation, projectMapAnnotation, mapPointToGeo } from './locationAnnotations.js';

describe('location map annotations', () => {
  it('keeps old locations usable without optional notes and gives new locations independent empty arrays', () => {
    expect(mapRows({ markers: [] }, 'mapLabels')).toEqual([]);
    const first = locationMapDefaults(), next = locationMapDefaults();
    first.mapZones.push({ id: 'Z' });
    expect(next.mapZones).toEqual([]);
    const location = { id: 'L', markers: [{ id: 'M', x: 3, y: 4 }], arrows: [{ id: 'A', x1: 1, y1: 2, x2: 3, y2: 4 }] };
    expect(migrateProject({ ...makeEmptyProject(), locations: { L: location } }).locations.L.markers).toEqual(location.markers);
  });

  it('hides only facilitator-only overlays from player preview, retaining legacy visibility', () => {
    const rows = [{ id: 'old' }, { id: 'public', audience: 'all' }, { id: 'private', audience: 'facilitator' }];
    expect(rows.filter(row => mapAudienceVisible(row, 'player')).map(row => row.id)).toEqual(['old', 'public']);
    expect(rows.filter(row => mapAudienceVisible(row, 'facilitator'))).toEqual(rows);
    expect(rows[2].audience).toBe('facilitator');
  });

  it('draws rectangles in any direction and clamps movement and resizing without losing names or visibility', () => {
    expect(mapZoneRect({ x: 60, y: 50 }, { x: 20, y: 10 })).toEqual({ x: 20, y: 10, w: 40, h: 40 });
    expect(mapZoneRect({ x: -20, y: -5 }, { x: 200, y: 150 })).toEqual({ x: 0, y: 0, w: 160, h: 90 });
    const zone = { id: 'Z', x: 30, y: 20, w: 40, h: 20, name: 'Clearing', audience: 'facilitator', storyLocationId: 'STORY' };
    expect(moveMapAnnotation(zone, 300, -500)).toEqual({ ...zone, x: 120, y: 0 });
    expect(resizeMapZone(zone, { x: 200, y: 200 })).toEqual({ ...zone, w: 130, h: 70 });
    expect(resizeMapZone(zone, { x: 0, y: 0 })).toEqual({ ...zone, w: 2, h: 2 });
    expect(zone.w).toBe(40);
  });

  it('edits or removes only the chosen overlay collection, preserving markers, arrows and unrelated location data', () => {
    const location = { notes: 'Existing notes', markers: [{ id: 'same', refId: 'I' }], mapLabels: [{ id: 'same', text: 'Old' }], mapZones: [{ id: 'Z', name: 'Old zone' }] };
    const patch = updateMapOverlay(location, 'mapLabels', 'same', { text: 'Old well', audience: 'facilitator' });
    expect({ ...location, ...patch }).toMatchObject({ notes: 'Existing notes', markers: location.markers, mapZones: location.mapZones, mapLabels: [{ id: 'same', text: 'Old well', audience: 'facilitator' }] });
    expect(removeMapOverlay(location, 'mapLabels', 'same')).toEqual({ mapLabels: [] });
    expect(updateMapOverlay(location, 'items', 'same', { text: 'Bad' })).toEqual({});
    expect(location.mapLabels[0].text).toBe('Old');
  });

  it('preserves street-map positions through panning, zooming and panel resizing while leaving old markers untouched', () => {
    const osm = { lat: 56.9496, lon: 24.1052, zoom: 16 }, size = { w: 1000, h: 562.5 };
    const row = { id: 'Z', x: 30, y: 20, w: 25, h: 15, name: 'Ridge' };
    const anchored = anchorMapAnnotation(row, osm, size);
    const roundTrip = projectMapAnnotation(anchored, osm, size);
    for (const key of ['x', 'y', 'w', 'h']) expect(roundTrip[key]).toBeCloseTo(row[key], 6);
    const after = { lat: osm.lat + 0.001, lon: osm.lon + 0.002, zoom: 17 }, resized = { w: 720, h: 405 };
    const projected = projectMapAnnotation(anchored, after, resized);
    const geo = mapPointToGeo(projected, after, resized);
    expect(geo.lat).toBeCloseTo(anchored.osmAnchor.start.lat, 8);
    expect(geo.lon).toBeCloseTo(anchored.osmAnchor.start.lon, 8);
    expect(projected.w).toBeCloseTo(row.w * 2 * size.w / resized.w);
    expect(projectMapAnnotation(row, after, resized)).toBe(row);
  });

  it('makes map edits undoable, including separate drag commits and deletion', () => {
    const location = { id: 'L', ...locationMapDefaults(), mapZones: [{ id: 'Z', name: 'Ridge', x: 10, y: 20, w: 30, h: 20 }] };
    const initial = { present: { ...makeEmptyProject(), locations: { L: location } }, past: [] };
    let state = undoableReducer(initial, { type: 'UPDATE_ENTITY', coll: 'locations', id: 'L', patch: updateMapOverlay(location, 'mapZones', 'Z', { x: 40 }) });
    state = undoableReducer(state, { type: 'END_UNDO_GROUP' });
    state = undoableReducer(state, { type: 'UPDATE_ENTITY', coll: 'locations', id: 'L', patch: removeMapOverlay(state.present.locations.L, 'mapZones', 'Z') });
    const restored = undoableReducer(state, { type: 'UNDO' });
    expect(restored.present.locations.L.mapZones[0].x).toBe(40);
    expect(undoableReducer(restored, { type: 'UNDO' }).present.locations.L).toEqual(location);
  });
});
