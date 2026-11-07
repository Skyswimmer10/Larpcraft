// Assignment lives on optional support cards. Older beats can still carry a
// direct teamId; use it only until an attached Team Lane card takes over.
export function narrativeTeamIds(node, subnodes = {}) {
  const lanes = Object.values(subnodes).filter(row => row.kind === 'teamLane' && row.parentRef?.nodeId === node.id);
  if (!lanes.length) return node.teamId ? [node.teamId] : [];
  if (lanes.some(row => !row.teamId)) return [];
  return [...new Set(lanes.map(row => row.teamId))];
}

export function narrativeTeamLabel(node, teams = {}, subnodes = {}) {
  const ids = narrativeTeamIds(node, subnodes);
  if (!ids.length) return null;
  return { name: ids.map(id => teams[id]?.name || 'Unavailable team').join(' · '), color: teams[ids[0]]?.color || '#8B92A6' };
}
