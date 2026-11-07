import { characterReferenceKey } from './conversations.js';

export const RELATIONSHIP_WORDS = [
  ['parent', 'Parent of', 'Child of', 'Family'], ['father', 'Father of', 'Child of', 'Family'], ['mother', 'Mother of', 'Child of', 'Family'],
  ['child', 'Child of', 'Parent of', 'Family'], ['son', 'Son of', 'Parent of', 'Family'], ['daughter', 'Daughter of', 'Parent of', 'Family'],
  ['sibling', 'Sibling of', 'Sibling of', 'Family'], ['ancestor', 'Ancestor of', 'Descendant of', 'Family'],
  ['ally', 'Ally of', 'Ally of', 'Connections'], ['friend', 'Friend of', 'Friend of', 'Connections'], ['rival', 'Rival of', 'Rival of', 'Connections'],
  ['enemy', 'Enemy of', 'Enemy of', 'Connections'], ['spouse', 'Spouse of', 'Spouse of', 'Connections'], ['consort', 'Consort of', 'Consort of', 'Connections'], ['lover', 'Lover of', 'Lover of', 'Connections'],
  ['creator', 'Creator of', 'Created by', 'Origins'], ['created', 'Created by', 'Creator of', 'Origins'],
  ['patron', 'Patron of', 'Patronized by', 'Influence'], ['mentor', 'Mentor of', 'Student of', 'Influence'],
  ['blessed', 'Blessed by', 'Blesses', 'Influence'], ['cursed', 'Cursed by', 'Curses', 'Influence'],
  ['championed', 'Championed by', 'Champion of', 'Influence'], ['protected', 'Protected by', 'Protects', 'Influence'],
  ['loyal', 'Loyal to', 'Has loyalty from', 'Influence'], ['trust', 'Trusts', 'Trusted by', 'Influence'],
].map(([id, label, inverse, group]) => ({ id, label, inverse, group }));

const clone = value => JSON.parse(JSON.stringify(value));
const nameOf = node => node?.title || node?.name || node?.id || '';
export const relationshipRefKey = characterReferenceKey;
export const relationshipScope = ref => ({ coll: ref.coll || 'nodes', parentPath: ref.parentPath || [] });
const sameRef = (a, b) => !!a && !!b && relationshipRefKey(a) === relationshipRefKey(b);
const sameScope = (a, b) => (a.coll || 'nodes') === (b.coll || 'nodes') && JSON.stringify(a.parentPath || []) === JSON.stringify(b.parentPath || (b.parentId ? [b.parentId] : []));

export function relationshipEntities(game = {}) {
  const rows = [];
  const walk = (nodes, coll, parentPath = [], labels = []) => {
    for (const node of Object.values(nodes || {})) {
      const name = nameOf(node);
      if (['character', 'group', 'item', 'storyLocation'].includes(node.kind)) {
        const ref = { coll, parentPath, nodeId: node.id };
        rows.push({ ref, key: relationshipRefKey(ref), node, name, kind: node.kind, location: [coll === 'nodes' ? 'Narrative' : coll === 'masterNodes' ? 'Master Story' : coll === 'taskNodes' ? 'Mechanics' : 'Storyboard', ...labels].join(' / ') });
      }
      if (node.sub?.nodes) walk(node.sub.nodes, coll, [...parentPath, node.id], [...labels, name]);
    }
  };
  for (const coll of ['nodes', 'masterNodes', 'taskNodes', 'storyboardNodes']) walk(game[coll], coll);
  for (const coll of ['teams', 'factions']) for (const node of Object.values(game[coll] || {})) {
    const ref = { coll, parentPath: [], nodeId: node.id };
    rows.push({ ref, key: relationshipRefKey(ref), node, name: nameOf(node), kind: coll === 'teams' ? 'team' : 'faction', location: coll });
  }
  return rows;
}

// Keep old real-world links resolvable, but offer only story entities for new links.
export const relationshipStoryTargets = game => relationshipEntities(game).filter(row => !['teams', 'players'].includes(row.ref.coll));

export function relationshipEntity(game, ref) {
  if (!ref) return null;
  let nodes = game[ref.coll || 'nodes'] || {};
  for (const id of ref.parentPath || []) nodes = nodes[id]?.sub?.nodes || {};
  return nodes[ref.nodeId] || null;
}

export function relationshipView(record, game, viewerRef = record.fromRef) {
  const reverse = sameRef(viewerRef, record.toRef);
  const from = relationshipEntity(game, record.fromRef), to = relationshipEntity(game, record.toRef);
  return { ...record, fromName: nameOf(from) || record.fromName, toName: nameOf(to) || record.toName,
    label: reverse ? record.reverseLabel : record.forwardLabel, targetRef: reverse ? record.fromRef : record.toRef,
    targetName: reverse ? nameOf(from) || record.fromName : nameOf(to) || record.toName,
    missing: reverse ? !!record.fromRef && !from : !!record.toRef && !to, reverse };
}

export function relationshipsFor(game, ref) {
  return Object.values(game.relationships || {}).filter(record => sameRef(ref, record.fromRef) || sameRef(ref, record.toRef)).map(record => relationshipView(record, game, ref));
}

export function createRelationship({ id, fromRef, fromName, toRef = null, toName, word, forwardLabel, reverseLabel, description = '', wizardInputs = [] }) {
  const vocabulary = RELATIONSHIP_WORDS.find(row => row.id === word || row.label === forwardLabel);
  return { version: 1, id, fromRef: clone(fromRef), fromName, toRef: toRef ? clone(toRef) : null, toName,
    wordId: vocabulary?.id || 'custom', forwardLabel: forwardLabel || vocabulary?.label || 'Related to',
    reverseLabel: reverseLabel ?? vocabulary?.inverse ?? 'Related to', description, wizardInputs: clone(wizardInputs), generatedDescription: '' };
}

export function legacyRelationshipRecord(game, sourceRef, node, row, id) {
  const toRef = row.targetId ? { coll: row.targetType === 'node' ? sourceRef.coll || 'nodes' : row.targetType, parentPath: row.targetType === 'node' ? sourceRef.parentPath || [] : [], nodeId: row.targetId } : null;
  const aliases = { Enemies: 'Enemy of', Friends: 'Friend of', Siblings: 'Sibling of', Allies: 'Ally of', Rivals: 'Rival of' };
  const forwardLabel = aliases[row.type] || row.type;
  const vocabulary = RELATIONSHIP_WORDS.find(word => word.label === forwardLabel);
  return createRelationship({ id, fromRef: sourceRef, fromName: nameOf(node), toRef, toName: nameOf(relationshipEntity(game, toRef)) || row.name,
    forwardLabel, reverseLabel: vocabulary?.inverse || 'Related to', description: row.description || '', wizardInputs: row.wizardInputs || [] });
}

export function relationshipCanvasEdges(game, scope, nodes) {
  return spaceRelationshipEdges(Object.values(game.relationships || {}).filter(record => record.toRef && sameScope(record.fromRef, scope) && sameScope(record.toRef, scope) && nodes[record.fromRef.nodeId] && nodes[record.toRef.nodeId]).map(record => ({
    from: record.fromRef.nodeId, to: record.toRef.nodeId, label: record.forwardLabel, relationshipId: record.id, color: '#82c9b8', fromSide: 'right', toSide: 'left',
  })));
}

export function spaceRelationshipEdges(edges) {
  const groups = new Map();
  for (const edge of edges) {
    const key = JSON.stringify([edge.from, edge.to].sort());
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(edge);
  }
  return edges.map(edge => {
    const group = groups.get(JSON.stringify([edge.from, edge.to].sort()));
    return { ...edge, curveOffset: (group.indexOf(edge) - (group.length - 1) / 2) * 64 };
  });
}

// Canonical records own the connection. Brief rows on profiles are a derived
// projection for existing facts/export/template paths, never a second editor.
export function syncProjectRelationships(game, before = game) {
  if (!game.relationships) return game;
  let relationships = game.relationships;
  for (const [id, record] of Object.entries(relationships)) {
    const view = relationshipView(record, game);
    if (view.fromName !== record.fromName || view.toName !== record.toName) {
      if (relationships === game.relationships) relationships = { ...relationships };
      relationships[id] = { ...record, fromName: view.fromName, toName: view.toName };
    }
  }
  const current = relationships === game.relationships ? game : { ...game, relationships };
  const visit = (nodes, coll, parentPath = []) => {
    let result = nodes;
    for (const [id, node] of Object.entries(nodes || {})) {
      let next = node;
      if (node.sub?.nodes) {
        const children = visit(node.sub.nodes, coll, [...parentPath, id]);
        if (children !== node.sub.nodes) next = { ...next, sub: { ...next.sub, nodes: children } };
      }
      if (['character', 'group'].includes(node.kind)) {
        const ref = { coll, parentPath, nodeId: id };
        const old = next.characterFacts?.relationships || [];
        const retained = old.flatMap(row => {
          if (!row.relationshipId) return [row];
          if (current.relationships[row.relationshipId] || before.relationships?.[row.relationshipId]) return [];
          const { relationshipId, missing, ...detached } = row;
          return [{ ...detached, targetId: row.targetType === 'node' && nodes[row.targetId] ? row.targetId : null }];
        });
        const rows = [...retained, ...relationshipsFor(current, ref).map(record => ({
          id: record.id, relationshipId: record.id, type: record.label, name: record.targetName,
          description: record.description || '', wizardInputs: record.wizardInputs || [], missing: record.missing,
          ...(record.targetRef && sameScope(record.targetRef, ref) ? { targetId: record.targetRef.nodeId, targetType: 'node' } : {}),
        }))];
        if (JSON.stringify(rows) !== JSON.stringify(old)) next = { ...next, characterFacts: { ...next.characterFacts, relationships: rows } };
      }
      if (next !== node) { if (result === nodes) result = { ...nodes }; result[id] = next; }
    }
    return result;
  };
  let result = current;
  for (const coll of ['nodes', 'masterNodes', 'taskNodes', 'storyboardNodes']) {
    if (!current[coll]) continue;
    const nodes = visit(current[coll], coll);
    if (nodes !== current[coll]) result = { ...result, [coll]: nodes };
  }
  return result;
}

// Future relationship wizards target record.id, retaining their own editable
// questionnaire snapshots. Authored descriptions await review when input changes.
export function applyRelationshipWizardResult(record, input) {
  const key = input.sessionId || input.sourceId;
  if (!key) throw new Error('A relationship wizard result needs a sessionId or sourceId');
  const wizardInputs = [...(record.wizardInputs || [])];
  const index = wizardInputs.findIndex(row => (row.sessionId || row.sourceId) === key);
  if (index < 0) wizardInputs.push(clone(input));
  else wizardInputs[index] = clone(input);
  const generatedDescription = wizardInputs.map(row => row.summary || row.generatedText || '').filter(Boolean).join('\n\n');
  const edited = !!record.description?.trim() && record.description !== (record.generatedDescription || '');
  if (generatedDescription === record.generatedDescription) return { ...record, wizardInputs };
  return { ...record, wizardInputs, generatedDescription,
    ...(edited ? { pendingDescription: generatedDescription } : { description: generatedDescription, pendingDescription: undefined }) };
}

export function relationshipDescriptionText(node) {
  return (node.characterFacts?.relationships || []).filter(row => row.description?.trim()).map(row => `${row.type}: ${row.name}\n${row.description}`).join('\n\n');
}
