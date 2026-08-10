const normalizedRect = (item) => {
  const x = Number(item?.x) || 0;
  const y = Number(item?.y) || 0;
  const w = Number(item?.w) || 0;
  const h = Number(item?.h) || 0;
  return {
    x: Math.min(x, x + w),
    y: Math.min(y, y + h),
    w: Math.abs(w),
    h: Math.abs(h),
  };
};

const containsPoint = (frame, x, y) => (
  x >= frame.x && x <= frame.x + frame.w
  && y >= frame.y && y <= frame.y + frame.h
);

const containsRect = (frame, item) => {
  const rect = normalizedRect(item);
  return containsPoint(frame, rect.x, rect.y)
    && containsPoint(frame, rect.x + rect.w, rect.y + rect.h);
};

const shiftCollection = (collection = {}, frame, dx, dy) => Object.fromEntries(
  Object.entries(collection).map(([id, item]) => [
    id,
    containsPoint(frame, item.x, item.y)
      ? { ...item, x: item.x + dx, y: item.y + dy }
      : item,
  ]),
);

// Frames, circles, and arrows share one collection. Normalizing their bounds
// is important because arrows may be drawn right-to-left or bottom-to-top.
export function moveFrameContents(graph, frameId, dx, dy) {
  const source = graph?.frames?.[frameId];
  if (!source) return null;

  if (source.shape === 'circle' || source.shape === 'arrow' || source.shape === 'spline') {
    return {
      frames: {
        ...(graph.frames || {}),
        [frameId]: { ...source, x: source.x + dx, y: source.y + dy },
      },
    };
  }

  if (source.sticky !== true) {
    return {
      frames: {
        ...(graph.frames || {}),
        [frameId]: { ...source, x: source.x + dx, y: source.y + dy },
      },
    };
  }

  const frame = normalizedRect(source);
  const frames = Object.fromEntries(Object.entries(graph.frames || {}).map(([id, item]) => {
    if (id === frameId) return [id, { ...item, x: item.x + dx, y: item.y + dy }];
    return [id, containsRect(frame, item) ? { ...item, x: item.x + dx, y: item.y + dy } : item];
  }));

  return {
    nodes: shiftCollection(graph.nodes || {}, frame, dx, dy),
    subnodes: shiftCollection(graph.subnodes || {}, frame, dx, dy),
    frameworks: shiftCollection(graph.frameworks || {}, frame, dx, dy),
    frames,
    numberMarkers: shiftCollection(graph.numberMarkers || {}, frame, dx, dy),
    titleMarkers: shiftCollection(graph.titleMarkers || {}, frame, dx, dy),
  };
}
