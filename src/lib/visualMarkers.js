export const MARKER_LETTERS = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
export const VISUAL_MARKER_BASE_SIZE = 34;
export const VISUAL_MARKER_MIN_SIZE = 18;
export const VISUAL_MARKER_MAX_SIZE = 240;

export function visualMarkerPixelSize(marker = {}) {
  return Math.round(VISUAL_MARKER_BASE_SIZE * (Number(marker.scale) || 1));
}

export function visualMarkerScaleFromPixels(value, fallback = VISUAL_MARKER_BASE_SIZE) {
  const parsed = Math.round(Number(value));
  const pixels = Number.isFinite(parsed)
    ? Math.max(VISUAL_MARKER_MIN_SIZE, Math.min(VISUAL_MARKER_MAX_SIZE, parsed))
    : fallback;
  return +(pixels / VISUAL_MARKER_BASE_SIZE).toFixed(4);
}

export function nextVisualMarkerValue(markers = {}, markerType = 'number') {
  const list = Object.values(markers);
  if (markerType === 'letter') {
    const used = new Set(list
      .filter((marker) => marker.markerType === 'letter')
      .map((marker) => String(marker.value || '').toUpperCase()));
    return MARKER_LETTERS.find((letter) => !used.has(letter)) || 'A';
  }
  const values = list
    .filter((marker) => marker.markerType !== 'letter')
    .map((marker) => Number(marker.value))
    .filter(Number.isFinite);
  return values.length ? Math.max(...values) + 1 : 1;
}

export const visualMarkerLabel = (marker) => marker?.markerType === 'letter' ? 'Letter' : 'Number';

export function visualMarkerPosition(marker, nodes = {}) {
  const parent = marker?.attachedToNodeId && nodes[marker.attachedToNodeId];
  if (!parent) return { x: Number(marker?.x) || 0, y: Number(marker?.y) || 0 };
  return {
    x: parent.x + (Number(marker.attachmentOffsetX) || 0),
    y: parent.y + (Number(marker.attachmentOffsetY) || 0),
  };
}

export function visualMarkerAttachment(position, size, nodeRects = []) {
  const center = { x: position.x + size / 2, y: position.y + size / 2 };
  const target = [...nodeRects].reverse().find((node) => (
    center.x >= node.x && center.x <= node.x + node.w
    && center.y >= node.y && center.y <= node.y + node.h
  ));
  if (!target) return null;
  return {
    attachedToNodeId: target.id,
    attachmentOffsetX: Math.round(position.x - target.x),
    attachmentOffsetY: Math.round(position.y - target.y),
  };
}
