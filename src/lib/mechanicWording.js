// Display names only: saved type keys and authored text keep their meaning.
const names = {
  failSafeScaffolding: 'Help when players get stuck',
  escalatingPressure: 'Increasing pressure',
  playerFacingInstruction: 'Instructions for players',
};
const oldNames = new Set(['Fail-Safe + Scaffolding Mod', 'Escalating Pressure Mod', 'Player-Facing Instruction']);
export const mechanicDisplayName = node => names[node?.subnodeKind || node?.mechKind || node?.kind] || node?.name || node?.title;

export function updateMechanicWording(node) {
  const next = { ...node };
  const name = mechanicDisplayName(node);
  for (const key of ['name', 'title']) if (oldNames.has(node[key])) next[key] = name;
  if (node.ioNodeIds && ['I/O fallback', 'I/O fallback / reset'].includes(node.title)) {
    next.title = node.title === 'I/O fallback' ? 'If the equipment fails' : 'Equipment fallback and reset';
  }
  return next;
}
