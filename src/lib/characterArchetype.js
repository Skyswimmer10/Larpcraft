export const CHARACTER_SHADOW_KIND = 'characterShadow';
export const CHARACTER_ARCHETYPE_FACET_KIND = 'characterArchetypeFacet';
export const CHARACTER_ARCHETYPE_COMBINATIONS_KIND = 'characterArchetypeCombinations';

export const CHARACTER_SHADOW_SIDES = [
  {
    key: 'up',
    symbol: '\u2191',
    field: 'archetypeDarkSideUp',
    fallback: 'Excessive, Pushed Too Far, Dark Side',
    description: '',
    color: '#E86464',
    offset: { x: 310, y: -90 },
    fromSide: 'right',
    toSide: 'left',
  },
  {
    key: 'back',
    symbol: '\u21a9',
    field: 'archetypeDarkSideBack',
    fallback: 'Withdrawing dark side',
    description: 'The archetype pulled back: avoidant, passive, or diminished.',
    color: '#8B92A6',
    offset: { x: -270, y: 90 },
    fromSide: 'left',
    toSide: 'right',
  },
];

export const CHARACTER_ARCHETYPE_FACETS = [
  { key: 'when', title: 'This is you when', color: '#5CA8F5', offset: { x: -250, y: 240 }, fromSide: 'bottom', toSide: 'top' },
  { key: 'say', title: 'You say', color: '#A87BF0', offset: { x: 0, y: 260 }, fromSide: 'bottom', toSide: 'top' },
  { key: 'gift', title: 'Your gift to others', color: '#43BF87', offset: { x: 250, y: 240 }, fromSide: 'bottom', toSide: 'top' },
];

const generatedShadow = (node, characterId, side) => (
  node?.kind === CHARACTER_SHADOW_KIND
  && node.generatedForCharacterId === characterId
  && node.shadowDirection === side
);
const generatedArchetypeNode = (node, characterId) => (
  node?.generatedForCharacterId === characterId
  && (node.generatedByArchetype || node.kind === CHARACTER_SHADOW_KIND || node.kind === CHARACTER_ARCHETYPE_FACET_KIND || node.kind === CHARACTER_ARCHETYPE_COMBINATIONS_KIND)
);

export function includeGeneratedCharacterNodes(nodes = {}, ids = []) {
  const expanded = new Set(ids);
  Object.values(nodes).forEach((node) => {
    if (expanded.has(node.generatedForCharacterId) && generatedArchetypeNode(node, node.generatedForCharacterId)) expanded.add(node.id);
  });
  return expanded;
}

const availableShadowId = (nodes, characterId, side) => {
  const existing = Object.values(nodes).find((node) => generatedShadow(node, characterId, side));
  if (existing) return existing.id;
  const base = `${characterId}--shadow-${side}`;
  if (!nodes[base]) return base;
  let index = 2;
  while (nodes[`${base}-${index}`]) index += 1;
  return `${base}-${index}`;
};

export function syncCharacterArchetypeGraph(graph, characterId, patch = {}) {
  const currentNodes = graph?.nodes || {};
  const character = currentNodes[characterId];
  if (!character) return graph;

  const nextCharacter = { ...character, ...patch };
  let nodes = { ...currentNodes, [characterId]: nextCharacter };
  let edges = [...(graph?.edges || [])];

  if (!nextCharacter.archetypeEnabled) {
    const removedIds = new Set(
      Object.values(nodes)
        .filter((node) => generatedArchetypeNode(node, characterId))
        .map((node) => node.id),
    );
    if (removedIds.size) {
      nodes = Object.fromEntries(Object.entries(nodes).filter(([id]) => !removedIds.has(id)));
      edges = edges.filter((edge) => !removedIds.has(edge.from) && !removedIds.has(edge.to));
    }
    return { ...graph, nodes, edges };
  }

  for (const side of CHARACTER_SHADOW_SIDES) {
    const id = availableShadowId(nodes, characterId, side.key);
    const existing = nodes[id];
    const value = `${nextCharacter[side.field] || ''}`.trim();
    nodes[id] = {
      id,
      kind: CHARACTER_SHADOW_KIND,
      title: `${side.symbol} ${value || side.fallback}`,
      body: side.description,
      color: existing?.color || side.color,
      x: existing?.x ?? Math.max(20, (Number(nextCharacter.x) || 80) + side.offset.x),
      y: existing?.y ?? Math.max(20, (Number(nextCharacter.y) || 80) + side.offset.y),
      w: existing?.w ?? 220,
      h: existing?.h ?? 112,
      generatedForCharacterId: characterId,
      generatedByArchetype: true,
      shadowDirection: side.key,
    };
    const edgeIndex = edges.findIndex((edge) => edge.from === characterId && edge.to === id);
    const edge = {
      from: characterId,
      to: id,
      label: `${side.symbol} dark side`,
      color: side.color,
      fromSide: side.fromSide,
      toSide: side.toSide,
    };
    if (edgeIndex >= 0) edges[edgeIndex] = { ...edges[edgeIndex], ...edge };
    else edges.push(edge);
  }

  for (const facet of CHARACTER_ARCHETYPE_FACETS) {
    const existing = Object.values(nodes).find((node) => (
      node.kind === CHARACTER_ARCHETYPE_FACET_KIND
      && node.generatedForCharacterId === characterId
      && node.archetypeFacet === facet.key
    ));
    const id = existing?.id || availableShadowId(nodes, characterId, `facet-${facet.key}`);
    nodes[id] = {
      id,
      kind: CHARACTER_ARCHETYPE_FACET_KIND,
      title: facet.title,
      body: existing?.body || '',
      color: existing?.color || facet.color,
      x: existing?.x ?? Math.max(20, (Number(nextCharacter.x) || 80) + facet.offset.x),
      y: existing?.y ?? Math.max(20, (Number(nextCharacter.y) || 80) + facet.offset.y),
      w: existing?.w ?? 220,
      h: existing?.h ?? 120,
      generatedForCharacterId: characterId,
      generatedByArchetype: true,
      archetypeFacet: facet.key,
    };
    const edgeIndex = edges.findIndex((edge) => edge.from === characterId && edge.to === id);
    const edge = {
      from: characterId,
      to: id,
      label: facet.title,
      color: facet.color,
      fromSide: facet.fromSide,
      toSide: facet.toSide,
    };
    if (edgeIndex >= 0) edges[edgeIndex] = { ...edges[edgeIndex], ...edge };
    else edges.push(edge);
  }

  const combinationsIdBase = `${characterId}--archetype-combinations`;
  const existingCombinations = Object.values(nodes).find((node) => (
    node.kind === CHARACTER_ARCHETYPE_COMBINATIONS_KIND && node.generatedForCharacterId === characterId
  ));
  let combinationsId = existingCombinations?.id || combinationsIdBase;
  let combinationSuffix = 2;
  while (nodes[combinationsId] && nodes[combinationsId].kind !== CHARACTER_ARCHETYPE_COMBINATIONS_KIND) {
    combinationsId = `${combinationsIdBase}-${combinationSuffix}`;
    combinationSuffix += 1;
  }
  const combinations = Array.from({ length: 8 }, (_, index) => ({
    base: existingCombinations?.combinations?.[index]?.base ?? nextCharacter.title ?? '',
    plus: existingCombinations?.combinations?.[index]?.plus ?? '',
    result: existingCombinations?.combinations?.[index]?.result ?? '',
  }));
  nodes[combinationsId] = {
    id: combinationsId,
    kind: CHARACTER_ARCHETYPE_COMBINATIONS_KIND,
    title: existingCombinations?.title || nextCharacter.title || 'Archetype Combinations',
    body: '',
    combinations,
    color: existingCombinations?.color || '#E0A23C',
    x: existingCombinations?.x ?? Math.max(20, (Number(nextCharacter.x) || 80) + 560),
    y: existingCombinations?.y ?? Math.max(20, (Number(nextCharacter.y) || 80) + 180),
    w: existingCombinations?.w ?? 620,
    h: existingCombinations?.h ?? 455,
    generatedForCharacterId: characterId,
    generatedByArchetype: true,
  };

  return { ...graph, nodes, edges };
}
