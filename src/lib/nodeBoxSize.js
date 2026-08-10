export const NODE_DEFAULT_WIDTH = 236;
export const NODE_DEFAULT_HEIGHT = 130;
export const NODE_MIN_WIDTH = 148;
export const NODE_MIN_HEIGHT = 74;

const finitePositive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

export function effectiveNodeBoxSize(entity = {}, defaults = {}) {
  const defaultWidth = finitePositive(defaults.width) ? Number(defaults.width) : NODE_DEFAULT_WIDTH;
  const defaultHeight = finitePositive(defaults.height) ? Number(defaults.height) : NODE_DEFAULT_HEIGHT;
  return {
    width: Math.max(NODE_MIN_WIDTH, finitePositive(entity.w) ? Number(entity.w) : defaultWidth),
    height: Math.max(NODE_MIN_HEIGHT, finitePositive(entity.h) ? Number(entity.h) : defaultHeight),
  };
}

export function normalizeNodeBoxDimension(value, axis, fallback) {
  const parsed = Math.round(Number(value));
  const minimum = axis === 'height' ? NODE_MIN_HEIGHT : NODE_MIN_WIDTH;
  return Number.isFinite(parsed) ? Math.max(minimum, parsed) : fallback;
}
