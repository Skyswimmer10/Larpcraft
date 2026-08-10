const DEFAULT_NODE_W = 236;
const DEFAULT_NODE_H = 130;

const rectsFrom = (coll = {}, fallbackW = DEFAULT_NODE_W, fallbackH = DEFAULT_NODE_H) => (
  Object.values(coll || {})
    .filter((item) => Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.y)))
    .map((item) => ({
      x: Number(item.x),
      y: Number(item.y),
      w: Math.max(24, Number(item.w) || fallbackW),
      h: Math.max(24, Number(item.h) || fallbackH),
    }))
);

const overlaps = (a, b, pad = 0) => (
  a.x < b.x + b.w + pad
  && a.x + a.w + pad > b.x
  && a.y < b.y + b.h + pad
  && a.y + a.h + pad > b.y
);

export function findEmptyFrameSpot(graph = {}, {
  x = 70,
  y = 70,
  w = 360,
  h = 220,
  padding = 32,
  stepX = 96,
  stepY = 76,
  maxCols = 10,
  maxRows = 12,
} = {}) {
  const occupied = [
    ...rectsFrom(graph.nodes),
    ...rectsFrom(graph.subnodes, 196, DEFAULT_NODE_H),
    ...rectsFrom(graph.frameworks),
    ...rectsFrom(graph.numberMarkers, 42, 42),
    ...rectsFrom(graph.titleMarkers, 280, 56),
    ...rectsFrom(graph.frames, w, h),
  ];
  const free = (candidate) => !occupied.some((rect) => overlaps(candidate, rect, padding));

  for (let row = 0; row < maxRows; row += 1) {
    for (let col = 0; col < maxCols; col += 1) {
      const candidate = { x: x + col * stepX, y: y + row * stepY, w, h };
      if (free(candidate)) return { x: candidate.x, y: candidate.y };
    }
  }

  const bottom = occupied.length ? Math.max(...occupied.map((rect) => rect.y + rect.h)) : y;
  return { x, y: bottom + padding };
}
