const hasValue = value => value !== undefined && value !== null && String(value).trim() !== '';

export function narrativeSubnodeSummary(node, teams = {}) {
  switch (node.kind) {
    case 'teamLane': return node.teamId ? teams[node.teamId]?.name || 'Unavailable team' : 'Shared · all teams';
    case 'value': return [['initialValue', 'Initial'], ['currentValue', 'Current'], ['maxValue', 'Max']].filter(([key]) => hasValue(node[key])).map(([key, label]) => `${label}: ${node[key]}`).join(' · ') || 'No values set';
    case 'outcomeBranches': return `${node.branches?.length ?? 0} branches · ${node.mode}`;
    case 'relChange': return `${node.relType || 'relationship'} · ${node.direction}`;
    case 'internalState': return `${node.stateType || 'state'}${node.level ? ` · ${node.level}` : ''}`;
    case 'locationArchetype': return node.archetype;
    case 'narrativeResponse': return node.text ? `${node.text.slice(0, 60)}…` : 'empty';
    case 'emotionalTone': return (node.tags || []).join(' · ') || 'no tags';
    case 'comment': return node.notes ? `${node.notes.slice(0, 80)}${node.notes.length > 80 ? '...' : ''}` : 'empty comment';
    default: return '';
  }
}
