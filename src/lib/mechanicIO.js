import { updateMechanicWording } from './mechanicWording.js';
export const isMechanicIO = node => ['sensorNode', 'actuatorNode'].includes(node?.mechKind);
const join = values => [...new Set(values.filter(Boolean).map(String))].join('\n');

export function normalizeIO(node) {
  if (node.mechKind === 'sensorNode') return { ...node, firingCondition: node.firingCondition ?? join([node.inputRequired, node.triggerCondition]) };
  if (node.mechKind === 'actuatorNode') return { ...node, outputBehaviour: node.outputBehaviour ?? join([node.outputIntensity, node.outputRhythm, node.outputSequence]) };
  return node;
}

export function addMechanicChild(node, kind) {
  const sub = node.sub || { nodes: {}, edges: [] };
  const nodes = { ...sub.nodes };
  let i = 1; while (nodes[`IO-${i}`]) i++;
  const id = `IO-${i}`;
  const sensor = kind === 'sensorNode';
  const ioIds = Object.values(nodes).filter(isMechanicIO).map(n => n.id);
  nodes[id] = kind === 'fallback'
    ? { id, kind: 'mechanicSubnode', subnodeKind: 'facilitatorNote', title: 'If the equipment fails', fields: { facilitatorGuidance: '' }, ioNodeIds: ioIds, x: 80, y: 260 }
    : { id, kind: 'mechanic', mechKind: kind, title: sensor ? 'Input' : 'Output', icon: sensor ? 'zap' : 'flag', sensorType: sensor ? 'Button' : undefined, actuatorType: sensor ? undefined : 'Sound', firingCondition: '', outputBehaviour: '', x: 80 + ioIds.length * 220, y: 100, w: 180, h: 48 };
  const edges = [...(sub.edges || [])];
  if (kind === 'fallback') ioIds.forEach(target => edges.push({ from: id, to: target, label: 'fallback' }));
  // Keep an existing pair note attached when its second endpoint is added.
  else Object.values(nodes).filter(n => n.ioNodeIds).forEach(note => {
    nodes[note.id] = { ...note, ioNodeIds: [...note.ioNodeIds, id] };
    edges.push({ from: note.id, to: id, label: 'fallback' });
  });
  return { sub: { ...sub, nodes, edges } };
}

// Additive migration: legacy values stay in the file; their visible replacements
// and attached operational notes are created once, including nested templates.
export function migrateMechanicIO(value) {
  if (Array.isArray(value)) return value.map(migrateMechanicIO);
  if (!value || typeof value !== 'object') return value;
  let next = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, migrateMechanicIO(v)]));
  next = updateMechanicWording(normalizeIO(next));
  if (next.mechKind === 'action') {
    if (['Action', 'BG action', 'BG Action'].includes(next.title)) next.title = 'BG Mechanics';
    if (['Action', 'BG action', 'BG Action'].includes(next.name)) next.name = 'BG Mechanics';
  }
  for (const [nk, ek] of [['nodes', 'edges'], ['taskNodes', 'taskEdges'], ['masterNodes', 'masterEdges']]) {
    if (!next[nk]) continue;
    const nodes = { ...next[nk] }, edges = [...(next[ek] || [])];
    for (const node of Object.values(nodes)) {
      if (!isMechanicIO(node) || node.ioNotesMigrated) continue;
      const text = join([node.manualOverrideFallback && `Fallback: ${node.manualOverrideFallback}`, node.resetBehavior && `Reset: ${node.resetBehavior}`]);
      if (text) {
        let id = `${node.id}-IO-NOTE`; while (nodes[id]) id += '-1';
        const peers = edges.filter(e => e.from === node.id || e.to === node.id).flatMap(e => [e.from, e.to]).filter(id => isMechanicIO(nodes[id]));
        const targets = [...new Set([node.id, ...peers])];
        nodes[id] = { id, kind: 'mechanicSubnode', subnodeKind: 'facilitatorNote', title: 'Equipment fallback and reset', fields: { facilitatorGuidance: text }, ioNodeIds: targets, x: (node.x || 0), y: (node.y || 0) + 100 };
        targets.forEach(target => edges.push({ from: id, to: target, label: 'operational note' }));
      }
      nodes[node.id] = { ...node, ioNotesMigrated: true };
    }
    next[nk] = nodes; next[ek] = edges;
  }
  return next;
}
