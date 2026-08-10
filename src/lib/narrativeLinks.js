import { ADDITIONAL_NODE_TYPES, BASE_NODE_TYPES, FRAMEWORK_TYPES } from '../data/seed.js';

export const LINKING_NODE_KIND = 'linkingNode';
export const STORY_STRUCTURE_CONTAINER_KIND = 'storyStructureContainer';

export const LINK_TARGET_TYPES = [
  { id: 'narrative', label: 'Node' },
  { id: 'concepts', label: 'Concept' },
  { id: 'stories', label: 'Story Structure' },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const uniqueId = (nodes, prefix) => {
  let index = 1;
  let id = `${prefix}${index}`;
  while (nodes?.[id]) id = `${prefix}${++index}`;
  return id;
};

const frameworkNodes = (frameworks = {}) => Object.fromEntries(
  Object.values(frameworks).map((framework) => {
    const type = FRAMEWORK_TYPES[framework.frameworkId] || FRAMEWORK_TYPES.fate;
    return [framework.id, {
      ...clone(framework),
      kind: 'framework',
      title: framework.title || type.title,
      body: type.summary,
    }];
  }),
);

const sourceGraph = (source) => ({
  nodes: {
    ...clone(source?.nodes || {}),
    ...frameworkNodes(source?.frameworks || {}),
  },
  edges: clone(source?.edges || []),
  frames: clone(source?.frames || {}),
  numberMarkers: clone(source?.numberMarkers || {}),
  titleMarkers: clone(source?.titleMarkers || {}),
});

export function narrativeLinkRecords(lib, type) {
  if (type === 'narrative') {
    return Object.values(lib?.narrative || {})
      .filter((record) => record.nodeClass !== 'subnode')
      .map((record) => ({
        id: record.id,
        type,
        label: record.name,
        description: record.body || 'Reusable narrative node.',
        color: record.color || BASE_NODE_TYPES[record.nodeKind]?.color || '#5CA8F5',
        icon: record.icon || BASE_NODE_TYPES[record.nodeKind]?.icon || 'flag',
      }));
  }
  if (type === 'concepts') {
    return Object.values(lib?.concepts || {}).map((record) => {
      const meta = ADDITIONAL_NODE_TYPES[record.category] || ADDITIONAL_NODE_TYPES.storyConcept;
      return {
        id: record.id,
        type,
        label: record.name,
        description: record.description || `${meta.label} with ${Object.keys(record.nodes || {}).length} internal nodes.`,
        color: meta.color,
        icon: meta.icon,
      };
    });
  }
  if (type === 'stories') {
    return Object.values(lib?.stories || {}).map((record) => ({
      id: record.id,
      type,
      label: record.name,
      description: record.description || `Story structure with ${Object.keys(record.nodes || {}).length} internal nodes.`,
      color: '#5CA8F5',
      icon: 'layers',
    }));
  }
  return [];
}

export function resolveNarrativeLink(lib, ref) {
  if (!ref?.type || !ref?.id) return null;
  return narrativeLinkRecords(lib, ref.type).find((record) => record.id === ref.id) || null;
}

export function createLinkingNode(nodes, position = { x: 100, y: 100 }, prefix = 'LINK-') {
  return {
    id: uniqueId(nodes, prefix),
    kind: LINKING_NODE_KIND,
    title: 'Link to library',
    body: 'Choose a narrative node, concept, or story structure in the inspector.',
    x: position.x,
    y: position.y,
    w: 280,
    h: 150,
    color: '#68D7C0',
    linkTarget: { type: 'narrative', id: null },
  };
}

export function buildNarrativeLinkInsertion(lib, ref, nodes, position = { x: 100, y: 100 }, prefix = 'INS-') {
  const record = resolveNarrativeLink(lib, ref);
  if (!record) return null;
  const id = uniqueId(nodes, prefix);

  if (ref.type === 'narrative') {
    const template = lib.narrative?.[ref.id];
    const source = clone(template?.template || {});
    return {
      ...source,
      id,
      primitiveId: template.id,
      kind: source.kind || template.nodeKind || 'event',
      title: template.name,
      body: source.body ?? template.body ?? '',
      x: position.x,
      y: position.y,
      color: source.color ?? template.color ?? null,
      history: [],
    };
  }

  if (ref.type === 'concepts') {
    const concept = lib.concepts?.[ref.id];
    const meta = ADDITIONAL_NODE_TYPES[concept.category] || ADDITIONAL_NODE_TYPES.storyConcept;
    return {
      id,
      kind: 'concept',
      conceptKind: concept.category,
      conceptId: concept.id,
      title: concept.name,
      name: concept.name,
      body: concept.description || '',
      description: concept.description || '',
      conceptType: concept.conceptType || 'unset',
      status: concept.status || 'seed',
      onePromise: concept.onePromise || '',
      referenceFrameworkIds: clone(concept.referenceFrameworkIds || []),
      x: position.x,
      y: position.y,
      w: 300,
      h: 150,
      color: meta.color,
      collapsed: true,
      sub: sourceGraph(concept),
      history: [],
    };
  }

  const story = lib.stories?.[ref.id];
  return {
    id,
    kind: STORY_STRUCTURE_CONTAINER_KIND,
    sourceStoryId: story.id,
    title: story.name,
    body: story.description || '',
    x: position.x,
    y: position.y,
    w: 320,
    h: 155,
    color: '#5CA8F5',
    collapsed: true,
    sub: sourceGraph(story),
    history: [],
  };
}
