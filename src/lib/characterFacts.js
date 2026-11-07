const text = value => typeof value === 'string' ? value.trim() : value == null ? '' : String(value);
export const CHARACTER_ROLES = ['Main character', 'Antagonist', 'Gatekeeper', 'Minor character', 'Guide', 'Supporting character'];
export const RELATIONSHIP_TYPES = ['Loyal to', 'Enemies', 'Friends', 'Siblings', 'Family', 'Allies', 'Rivals'];

export function characterFacts(node) {
  const roleGroup = node.typeGroups?.find(group => /^role$/i.test(group.label));
  const oldRole = roleGroup?.options?.find(option => option.id === roleGroup.selectedId)?.label || '';
  return { gender: node.gender || '', race: node.race || '', age: node.age ?? '', role: node.storyRole ?? oldRole,
    goal: node.characterProfile?.details?.goals || '', relationships: [], ...(node.characterFacts || {}) };
}

export function relationshipTargets(graph = {}) {
  return [
    ...Object.values(graph.nodes || {}).filter(node => ['character', 'group'].includes(node.kind)).map(node => ({ id: node.id, type: 'node', name: node.title || node.name || node.id })),
    ...['teams', 'factions'].flatMap(type => Object.values(graph[type] || {}).map(entity => ({ id: entity.id, type, name: entity.name || entity.title || entity.id }))),
  ];
}

export function characterRelationships(node, graph = {}) {
  const targets = relationshipTargets(graph);
  return characterFacts(node).relationships.map(row => {
    const live = row.targetId && targets.find(target => target.id === row.targetId && target.type === row.targetType);
    return { ...row, name: live?.name || row.name || '', missing: row.relationshipId ? !!row.missing : !!row.targetId && !live };
  });
}

export function characterFactsText(node, graph = {}) {
  const facts = characterFacts(node);
  const rows = [['Story role', facts.role], ['Gender', facts.gender], ['Race', facts.race], ['Age', facts.age], ['Goal / motivation', facts.goal]]
    .filter(([, value]) => text(value)).map(([label, value]) => `${label}: ${text(value)}`);
  const relationships = characterRelationships(node, graph).filter(row => text(row.name));
  for (const type of [...new Set(relationships.map(row => row.type))]) {
    rows.push(`${type}: ${relationships.filter(row => row.type === type).map(row => row.name).filter(Boolean).join(', ')}`);
  }
  return rows.join('\n');
}

export function refreshCharacterRelationships(node, graph = {}) {
  const stored = node.characterFacts?.relationships;
  if (!stored?.length) return node;
  const current = characterRelationships(node, graph);
  if (stored.every((row, index) => row.name === current[index].name)) return node;
  return { ...node, characterFacts: { ...node.characterFacts, relationships: stored.map((row, index) => ({ ...row, name: current[index].name })) } };
}

export function remapCharacterRelationships(node, idMap = {}) {
  if (!node.characterFacts?.relationships?.length) return node;
  return { ...node, characterFacts: { ...node.characterFacts, relationships: node.characterFacts.relationships.map(row => {
    const { relationshipId, missing, ...detached } = row;
    return row.targetType === 'node' && idMap[row.targetId] ? { ...detached, targetId: idMap[row.targetId] } : { ...detached, targetId: null };
  }) } };
}
