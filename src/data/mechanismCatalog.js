export const MECHANISM_COLLECTIONS = {
  pattern: 'actionPatternMechanisms',
  probability: 'actionProbabilityMechanisms',
  victory: 'victoryConditionMechanisms',
  uncertainty: 'uncertaintyMechanisms',
  economy: 'economyMechanisms',
  auction: 'auctionMechanisms',
  workerPlacement: 'workerPlacementMechanisms',
  movement: 'movementMechanisms',
  areaControl: 'areaControlMechanisms',
  setCollection: 'setCollectionMechanisms',
  cardMechanism: 'cardMechanisms',
};

export const mechanismCollectionForKind = (kind) => MECHANISM_COLLECTIONS[kind];

// Older applied nodes only referenced the action-pattern catalogue.
export const appliedMechanismRecord = (library, node) => (
  library[mechanismCollectionForKind(node.mechanismKind || 'pattern')]?.[node.actionMechanismId]
);

// Reopen the current game copy rather than silently replacing its local edits
// with the reusable catalogue entry.
export function mechanismDraftFromNode(library, node) {
  const source = appliedMechanismRecord(library, node);
  if (!source) return null;
  const draft = { ...source, kind: node.mechanismKind || 'pattern', label: node.title ?? source.label, description: node.body ?? source.description };
  for (const key of ['image', 'imageScale', 'imagePositionX', 'imagePositionY', 'color', 'icon', 'advantages', 'effects', 'variations', 'emotionalSpike', 'playerActions', 'gameRules', 'successCondition']) {
    if (node[key] !== undefined) draft[key] = node[key];
  }
  return draft;
}
