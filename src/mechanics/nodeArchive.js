export const CURRENT_MECHANIC_PRIMITIVE_KINDS = new Set([
  'action',
  'playerFacingInstruction',
  'actionSequence',
  'actionProbability',
  'sensorNode',
  'actuatorNode',
  'progressState',
]);

export const CURRENT_MECHANIC_SUBNODE_KINDS = new Set([
  'progressiveFeedback',
  'failSafeScaffolding',
  'escalatingPressure',
  'teamDiscussionPrompt',
  'value',
  'actionTypePattern',
  'facilitatorNote',
  'readinessStatus',
  'team',
  'comment',
]);

export const isOldMechanicPrimitive = (node) => (
  node?.oldNode === true
  || (node?.oldNode == null && !CURRENT_MECHANIC_PRIMITIVE_KINDS.has(node?.mechKind))
);

export const isOldMechanicSubnode = (node) => (
  node?.oldNode === true
  || (node?.oldNode == null && !CURRENT_MECHANIC_SUBNODE_KINDS.has(node?.kind))
);

export const isCurrentMechanicPrimitive = (node) => !isOldMechanicPrimitive(node);
export const isCurrentMechanicSubnode = (node) => !isOldMechanicSubnode(node);
