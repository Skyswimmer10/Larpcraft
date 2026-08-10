const clone = (value) => JSON.parse(JSON.stringify(value));

export function createCanvasClipboard(nodes, edges, selectedIds) {
  const ids = Array.from(selectedIds || []).filter((id) => nodes?.[id]);
  if (!ids.length) return null;
  const selected = new Set(ids);
  return {
    nodes: ids.map((id) => clone(nodes[id])),
    edges: clone((edges || []).filter((edge) => selected.has(edge.from) && selected.has(edge.to))),
    pasteCount: 0,
  };
}

export function offsetCanvasClipboard(clipboard, amount = 28) {
  if (!clipboard) return null;
  const pasteCount = (clipboard.pasteCount || 0) + 1;
  return {
    ...clipboard,
    pasteCount,
    nodes: clipboard.nodes.map((node) => ({ ...clone(node), x: node.x + amount, y: node.y + amount })),
  };
}

export function remapCanvasClipboard(clipboard, existingNodes, prefix = 'COPY-') {
  const occupied = { ...(existingNodes || {}) };
  const idMap = {};
  let index = 1;
  clipboard.nodes.forEach((node) => {
    let id = `${prefix}${index++}`;
    while (occupied[id]) id = `${prefix}${index++}`;
    idMap[node.id] = id;
    occupied[id] = true;
  });
  const nodes = Object.fromEntries(clipboard.nodes.map((node) => {
    const id = idMap[node.id];
    return [id, { ...clone(node), id }];
  }));
  const edges = (clipboard.edges || []).map((edge) => ({
    ...clone(edge),
    from: idMap[edge.from],
    to: idMap[edge.to],
  })).filter((edge) => edge.from && edge.to);
  return { nodes, edges, ids: Object.keys(nodes), idMap };
}
