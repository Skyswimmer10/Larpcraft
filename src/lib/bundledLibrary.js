export const BUNDLED_LIBRARY_VERSION = 2;

const isRecord = (value) => value && typeof value === 'object' && !Array.isArray(value);
const RICH_GRAPH_COLLECTIONS = new Set(['concepts', 'stories', 'mechStructures']);

const graphScore = (record) => {
  if (!isRecord(record)) return 0;
  return Object.keys(record.nodes || {}).length
    + (record.edges || []).length
    + Object.keys(record.frames || {}).length
    + Object.keys(record.frameworks || {}).length
    + Object.keys(record.numberMarkers || {}).length
    + Object.keys(record.titleMarkers || {}).length
    + (record.questions || []).length;
};

// Apply a captured master-library baseline once. Saved browser records win on
// ID collisions, so hosted edits are preserved while missing local records are
// added. The marker prevents deleted bundled records from returning later.
export function mergeBundledLibrary(bundled, saved) {
  if (!isRecord(bundled)) return saved;
  if (saved?.bundledLibraryVersion >= BUNDLED_LIBRARY_VERSION) return saved;
  if (!isRecord(saved)) {
    return { ...bundled, bundledLibraryVersion: BUNDLED_LIBRARY_VERSION };
  }

  const merged = { ...bundled, ...saved };
  for (const [key, bundledValue] of Object.entries(bundled)) {
    const savedValue = saved[key];
    if (isRecord(bundledValue) && isRecord(savedValue)) {
      merged[key] = { ...bundledValue, ...savedValue };
      if (RICH_GRAPH_COLLECTIONS.has(key)) {
        for (const [id, bundledRecord] of Object.entries(bundledValue)) {
          const savedRecord = savedValue[id];
          if (!savedRecord || graphScore(bundledRecord) > graphScore(savedRecord)) {
            merged[key][id] = bundledRecord;
          }
        }
      }
    }
  }
  merged.bundledLibraryVersion = BUNDLED_LIBRARY_VERSION;
  return merged;
}
