export const CURRENT_MECHANIC_PRIMITIVE_KINDS = new Set([
  'action',
  'goal',
  'gameType',
  'playerFacingInstruction',
  'sensorNode',
  'actuatorNode',
  'progressState',
]);

export const isRetiredMechanicPrimitive = (node) => (
  node?.mechKind === 'actionSequence' || node?.mechKind === 'actionProbability'
);

export const CURRENT_MECHANIC_SUBNODE_KINDS = new Set([
  'progressiveFeedback',
  'failSafeScaffolding',
  'escalatingPressure',
  'teamDiscussionPrompt',
  'value',
  'facilitatorNote',
  'readinessStatus',
  'team',
  'comment',
]);

export const isOldMechanicPrimitive = (node) => (
  !isRetiredMechanicPrimitive(node) && (node?.oldNode === true
  || (node?.oldNode == null && !CURRENT_MECHANIC_PRIMITIVE_KINDS.has(node?.mechKind)))
);

export const isOldMechanicSubnode = (node) => (
  node?.kind === 'actionTypePattern' ||
  node?.oldNode === true
  || (node?.oldNode == null && !CURRENT_MECHANIC_SUBNODE_KINDS.has(node?.kind))
);

export const isCurrentMechanicPrimitive = (node) => !isRetiredMechanicPrimitive(node) && !isOldMechanicPrimitive(node);
export const isCurrentMechanicSubnode = (node) => !isOldMechanicSubnode(node);
