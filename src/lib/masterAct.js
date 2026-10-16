import { genId } from '../data/csvSchemas.js';

// Lane containers use the existing nested graph model, including its inspector,
// undo and file persistence. Existing act contents are never replaced.
export function prepareMasterAct(act) {
  const nodes = { ...act.sub?.nodes };
  const actLanes = { ...act.actLanes };
  for (const lane of ['story', 'mechanics']) {
    if (actLanes[lane] && nodes[actLanes[lane]]) continue;
    const id = genId(nodes, 'ACT-LANE-');
    nodes[id] = { id, kind: 'actLane', title: lane === 'story' ? 'Story' : 'Game Mechanics', x: 0, y: 0, sub: { nodes: {}, edges: [], frames: {} } };
    actLanes[lane] = id;
  }
  return { actLanes, sub: { ...act.sub, nodes, edges: act.sub?.edges || [] } };
}
