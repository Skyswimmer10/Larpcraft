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
