export const BUNDLED_PROJECT_VERSION = 1;

const isRecord = (value) => value && typeof value === 'object' && !Array.isArray(value);
const sizeOf = (value) => Array.isArray(value)
  ? value.length
  : (isRecord(value) ? Object.keys(value).length : 0);

const GRAPH_GROUPS = [
  ['nodes', 'subnodes', 'edges', 'frames', 'frameworks', 'numberMarkers', 'titleMarkers', 'alignments'],
  ['taskNodes', 'taskEdges', 'taskFrames', 'taskNumberMarkers', 'taskTitleMarkers'],
  ['masterNodes', 'masterEdges', 'masterFrames', 'masterNumberMarkers', 'masterTitleMarkers'],
  ['storyboardNodes', 'storyboardEdges', 'storyboardFrames', 'storyboardNumberMarkers', 'storyboardTitleMarkers'],
];

const graphScore = (project, keys) => keys.reduce((score, key) => score + sizeOf(project?.[key]), 0);

const isSameGame = (bundled, saved) => {
  const bundledName = bundled?.meta?.name;
  const savedName = saved?.meta?.name;
  const bundledPrefix = bundled?.meta?.prefix;
  const savedPrefix = saved?.meta?.prefix;
  return (!bundledName || !savedName || bundledName === savedName)
    && (!bundledPrefix || !savedPrefix || bundledPrefix === savedPrefix);
};

// Apply the captured active game once. Record maps retain browser-side edits,
// while a fuller captured graph replaces the matching older graph as a unit so
// its nodes, relationships, frames, and visual markers cannot become detached.
export function mergeBundledProject(bundled, saved) {
  if (!isRecord(bundled)) return saved;
  if (saved?.bundledProjectVersion >= BUNDLED_PROJECT_VERSION) return saved;
  if (!isRecord(saved)) {
    return { ...bundled, bundledProjectVersion: BUNDLED_PROJECT_VERSION };
  }
  if (!isSameGame(bundled, saved)) return saved;

  const merged = { ...bundled, ...saved };
  for (const [key, bundledValue] of Object.entries(bundled)) {
    const savedValue = saved[key];
    if (key !== 'meta' && isRecord(bundledValue) && isRecord(savedValue)) {
      merged[key] = { ...bundledValue, ...savedValue };
    }
  }

  merged.meta = {
    ...(bundled.meta || {}),
    ...(saved.meta || {}),
    backdrops: { ...(bundled.meta?.backdrops || {}), ...(saved.meta?.backdrops || {}) },
  };

  for (const keys of GRAPH_GROUPS) {
    if (graphScore(bundled, keys) > graphScore(saved, keys)) {
      for (const key of keys) merged[key] = bundled[key];
    }
  }

  if (sizeOf(bundled.storyDynamicsGraph) > sizeOf(saved.storyDynamicsGraph)) {
    merged.storyDynamicsGraph = bundled.storyDynamicsGraph;
  }

  merged.bundledProjectVersion = BUNDLED_PROJECT_VERSION;
  return merged;
}
