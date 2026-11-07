import { STAGE_W, STAGE_H } from '../data/seed.js';

export const MAP_OVERLAY_COLLECTIONS = ['mapLabels', 'mapZones', 'markers', 'arrows'];
export const mapRows = (location, key) => Array.isArray(location?.[key]) ? location[key] : [];
export const mapAudienceVisible = (row, audience) => audience !== 'player' || row.audience !== 'facilitator';
export const mapColor = color => /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#79c9a5';
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const round = value => Math.round(value * 10) / 10;

export function mapZoneRect(start, end) {
  const x1 = clamp(start.x, 0, STAGE_W), y1 = clamp(start.y, 0, STAGE_H);
  const x2 = clamp(end.x, 0, STAGE_W), y2 = clamp(end.y, 0, STAGE_H);
  return { x: round(Math.min(x1, x2)), y: round(Math.min(y1, y2)), w: round(Math.abs(x2 - x1)), h: round(Math.abs(y2 - y1)) };
}

export function moveMapAnnotation(row, dx, dy) {
  const w = Math.min(STAGE_W, Math.max(0, Number(row.w) || 0)), h = Math.min(STAGE_H, Math.max(0, Number(row.h) || 0));
  return { ...row, x: round(clamp(row.x + dx, 0, STAGE_W - w)), y: round(clamp(row.y + dy, 0, STAGE_H - h)) };
}

export function resizeMapZone(row, point) {
  return { ...row, w: round(clamp(point.x - row.x, 2, STAGE_W - row.x)), h: round(clamp(point.y - row.y, 2, STAGE_H - row.y)) };
}

export function updateMapOverlay(location, collection, id, changes) {
  if (!MAP_OVERLAY_COLLECTIONS.includes(collection)) return {};
  return { [collection]: mapRows(location, collection).map(row => row.id === id ? { ...row, ...changes } : row) };
}

export function removeMapOverlay(location, collection, id) {
  return MAP_OVERLAY_COLLECTIONS.includes(collection) ? { [collection]: mapRows(location, collection).filter(row => row.id !== id) } : {};
}

// New street-map notes retain geographic anchors as the tile viewport changes.
// Older overlays without anchors retain their original canvas coordinates.
const worldPoint = (lat, lon, zoom) => {
  const scale = 256 * 2 ** zoom, rad = Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI / 180;
  return { x: (lon + 180) / 360 * scale, y: (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * scale };
};
const validMapSize = (osm, size) => osm && Number.isFinite(osm.lat) && Number.isFinite(osm.lon) && Number.isFinite(osm.zoom) && size?.w > 0 && size?.h > 0;
export function mapPointToGeo(point, osm, size) {
  const center = worldPoint(osm.lat, osm.lon, osm.zoom), scale = 256 * 2 ** osm.zoom;
  const x = center.x + (point.x / STAGE_W - 0.5) * size.w, y = center.y + (point.y / STAGE_H - 0.5) * size.h;
  return { lon: x / scale * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / scale))) * 180 / Math.PI };
}
export function mapGeoToPoint(point, osm, size) {
  const center = worldPoint(osm.lat, osm.lon, osm.zoom), world = worldPoint(point.lat, point.lon, osm.zoom);
  return { x: ((world.x - center.x) / size.w + 0.5) * STAGE_W, y: ((world.y - center.y) / size.h + 0.5) * STAGE_H };
}
export function anchorMapAnnotation(row, osm, size) {
  if (!validMapSize(osm, size)) return row;
  return { ...row, osmAnchor: { start: mapPointToGeo(row, osm, size), ...(row.w !== undefined && row.h !== undefined ? { end: mapPointToGeo({ x: row.x + row.w, y: row.y + row.h }, osm, size) } : {}) } };
}
export function projectMapAnnotation(row, osm, size) {
  if (!row.osmAnchor?.start || !validMapSize(osm, size)) return row;
  const start = mapGeoToPoint(row.osmAnchor.start, osm, size);
  const end = row.osmAnchor.end && mapGeoToPoint(row.osmAnchor.end, osm, size);
  return { ...row, ...start, ...(end ? { w: end.x - start.x, h: end.y - start.y } : {}) };
}
