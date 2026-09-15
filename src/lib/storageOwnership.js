export const MASTER_LIBRARY_COLLECTIONS = new Set([
  'actionPatternMechanisms',
  'actionProbabilityMechanisms',
  'victoryConditionMechanisms',
  'uncertaintyMechanisms',
  'economyMechanisms',
  'auctionMechanisms',
  'workerPlacementMechanisms',
  'movementMechanisms',
  'areaControlMechanisms',
  'setCollectionMechanisms',
  'cardMechanisms',
  'concepts',
  'gmRules',
  'itemTypes',
  'mechPrimitives',
  'mechStructures',
  'mechSubnodes',
  'mechanicActuatorTypes',
  'mechanicCharacterEmotionTypes',
  'mechanicInteractionTypes',
  'mechanicRestrictionTypes',
  'mechanicSensorTypes',
  'mechanicSequenceModes',
  'narrative',
  'narrativeCategories',
  'stories',
]);

const isRecord = (value) => value && typeof value === 'object' && !Array.isArray(value);
const recordWeight = (record) => {
  if (!isRecord(record)) return 0;
  try {
    return JSON.stringify(record).length;
  } catch {
    return Object.keys(record).length;
  }
};

const mergeRecoveredCollection = (libraryCollection, projectCollection) => {
  const merged = { ...(libraryCollection || {}) };
  for (const [id, projectRecord] of Object.entries(projectCollection || {})) {
    const libraryRecord = merged[id];
    if (!libraryRecord || recordWeight(projectRecord) > recordWeight(libraryRecord)) {
      merged[id] = projectRecord;
    }
  }
  return merged;
};

export function masterCollectionForAction(action) {
  const collection = action?.coll || action?.scope?.coll;
  return MASTER_LIBRARY_COLLECTIONS.has(collection) ? collection : null;
}

export function stripMasterCollectionsFromProject(project) {
  if (!isRecord(project)) return project;
  let cleaned = project;
  for (const collection of MASTER_LIBRARY_COLLECTIONS) {
    if (!Object.prototype.hasOwnProperty.call(cleaned, collection)) continue;
    if (cleaned === project) cleaned = { ...project };
    delete cleaned[collection];
  }
  return cleaned;
}

// Repair older or accidentally mixed saves. Master-only collections are
// recovered into the library and removed from the active game. Shared
// collections (items, locations, sensors, mechanics) intentionally remain in
// both stores because they represent templates in one and instances in the other.
export function enforceStorageOwnership(library, project) {
  if (!isRecord(library) || !isRecord(project)) return { library, project };
  let nextLibrary = library;
  let foundMisplacedData = false;

  for (const collection of MASTER_LIBRARY_COLLECTIONS) {
    const misplaced = project[collection];
    if (!isRecord(misplaced)) continue;
    foundMisplacedData = true;
    if (nextLibrary === library) nextLibrary = { ...library };
    nextLibrary[collection] = mergeRecoveredCollection(nextLibrary[collection], misplaced);
  }

  return {
    library: nextLibrary,
    project: foundMisplacedData ? stripMasterCollectionsFromProject(project) : project,
  };
}
