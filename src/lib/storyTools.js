import { buildStoryLibrarySections } from './narrativeLibrary.js';
import { narrativeGuidance } from '../data/narrativeGuidance.js';
import { buildNarrativeLinkInsertion } from './narrativeLinks.js';
import { genId } from '../data/csvSchemas.js';
import { SUBNODE_BLANK } from '../data/seed.js';
import { GROUP_FOUNDATIONS_ID } from './groupFoundations.js';

// One reference catalogue; developed products remain in Created Content.
export function storyWizardSources(library, { includeSubnodes = true } = {}) {
  const rows = [];
  buildStoryLibrarySections(library, 'tools', payload => rows.push(payload), { includeSubnodes })
    .forEach(section => section.items.forEach(item => item.onPick()));
  // Saved support cards now live in Created Content. Keep their existing
  // manual-insertion shortcut in the wizard catalogue as well.
  if (includeSubnodes) for (const record of Object.values(library.narrative || {})) {
    if (record.nodeClass === 'subnode' && !rows.some(row => row.coll === 'narrative' && row.id === record.id)) rows.push({ coll: 'narrative', id: record.id, record });
  }
  return rows.filter(({ coll, id }) => coll !== 'concepts' || id !== GROUP_FOUNDATIONS_ID).map(payload => {
    const { coll, id, record: source } = payload;
    const type = coll === 'frameworks' ? 'framework' : coll === 'concepts' ? 'concept' : coll === 'stories' ? 'structure' : 'template';
    const canWizard = type === 'framework' || type === 'concept';
    return { key: `${type}:${id}`, type, source, payload, canWizard,
      label: source.label || source.name || source.title || id,
      guidance: canWizard ? narrativeGuidance(source, type) : {
        best: [type === 'structure' ? 'story' : 'scene'], useful: [type === 'structure' ? 'scene' : 'story'],
        reason: source.description || source.body || (type === 'structure' ? 'Add this reusable story structure and develop its nodes on the canvas.' : 'Add this supporting template to the canvas.'),
      },
    };
  });
}

// Fallback for the master Library and nested canvases. Main Narrative and Act
// canvases can supply their existing insertion callbacks instead.
export function storyToolInsertion(library, payload, game, scope, position, scopedNodes) {
  const { coll, id, record } = payload;
  if (!scope && coll === 'frameworks') {
    const entity = { id: genId(game.frameworks || {}, `${game.meta.prefix}-FW-`), kind: 'framework', frameworkId: id, title: record.title || record.label, color: record.color, ...position };
    return { action: { type: 'ADD_ENTITY', coll: 'frameworks', entity }, selection: { kind: 'framework', id: entity.id } };
  }
  if (!scope && coll === 'narrative' && record.nodeClass === 'subnode') {
    const kind = record.subKind || record.template?.kind || 'comment';
    const entityId = genId(game.subnodes || {}, 'SN-');
    const entity = { ...SUBNODE_BLANK(entityId, kind), ...JSON.parse(JSON.stringify(record.template || {})), id: entityId, kind, ...position, parentRef: null, history: [] };
    return { action: { type: 'ADD_ENTITY', coll: 'subnodes', entity }, selection: { kind: 'subnode', id: entityId } };
  }
  const graphNodes = scopedNodes || game.nodes || {};
  const actualScope = scope && { coll: scope.coll, parentPath: scope.parentPath || [] };
  const node = coll === 'frameworks'
    ? { id: genId(graphNodes, 'STORY-FW-'), kind: 'framework', frameworkId: id, title: record.title || record.label, body: record.summary, color: record.color, ...position }
    : buildNarrativeLinkInsertion(library, { type: coll, id }, graphNodes, position, 'STORY-');
  if (!node) return null;
  return { action: actualScope ? { type: 'GRAPH_ADD_NODE', scope: actualScope, node } : { type: 'ADD_NODE', node },
    selection: actualScope ? { kind: 'graphnode', scope: actualScope, id: node.id } : { kind: 'node', id: node.id } };
}
