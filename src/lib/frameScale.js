const patchCollection = (collection = {}, patches = {}) => {
  let changed = false;
  const next = { ...collection };
  Object.entries(patches).forEach(([id, patch]) => {
    if (!next[id]) return;
    next[id] = { ...next[id], ...patch };
    changed = true;
  });
  return changed ? next : collection;
};

// Calculates a frame-only resize from the original drag geometry. Using the
// drag origin avoids losing accumulated movement when React rerenders mid-drag.
export function resizeFrameOnly(source, start, current, { circle = false } = {}) {
  const dx = Number(current?.x || 0) - Number(start?.x || 0);
  const dy = Number(current?.y || 0) - Number(start?.y || 0);
  if (circle) {
    const diameter = Math.max(24, Math.round(Math.max(source.w + dx, source.h + dy)));
    return { w: diameter, h: diameter };
  }
  return {
    w: Math.max(160, Math.round(source.w + dx)),
    h: Math.max(100, Math.round(source.h + dy)),
  };
}

// Applies the geometry calculated by FlowCanvas to any graph-shaped object.
// Collections that are not present on a particular graph are left untouched.
export function applyFrameScale(graph, frameId, transform = {}) {
  if (!graph?.frames?.[frameId] || !transform.frame) return graph;
  const next = { ...graph };
  const frames = patchCollection(graph.frames, transform.framePatches);
  next.frames = { ...frames, [frameId]: { ...frames[frameId], ...transform.frame } };
  ['nodes', 'subnodes', 'frameworks'].forEach((key) => {
    if (graph[key]) next[key] = patchCollection(graph[key], transform.nodePatches);
  });
  if (graph.numberMarkers) next.numberMarkers = patchCollection(graph.numberMarkers, transform.numberMarkerPatches);
  if (graph.titleMarkers) next.titleMarkers = patchCollection(graph.titleMarkers, transform.titleMarkerPatches);
  return next;
}
