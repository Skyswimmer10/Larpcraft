import { STORY_CONNECTION_PATTERNS, STORY_CONNECTION_REASONS } from '../data/storyConnections.js';
import { beatWorkshopText } from './storyBeatWorkshop.js';
const kinds = ['character','group','item','storyLocation','storyBeat'];
export function storyConnectionKind(node) {
  if (node?.mechKind || node?._sub) return null;
  const kind = ['event','quest','concept'].includes(node?.kind) ? 'storyBeat' : node?.kind;
  return kinds.includes(kind) ? kind : null;
}
export function storyConnectionPair(nodes, from, to, reverse = false) {
  let a = nodes[from], b = nodes[to], ak = storyConnectionKind(a), bk = storyConnectionKind(b);
  if (!ak || !bk || from === to) return null;
  if (kinds.indexOf(ak) > kinds.indexOf(bk) || ak === bk && reverse) [a,b,ak,bk] = [b,a,bk,ak];
  return { a, b, ak, bk, key: ak + ':' + bk, patterns: STORY_CONNECTION_PATTERNS[ak + ':' + bk] };
}
export const storyConnectionFill = (text, pair) => (text || '').replace(/\{([ab])\}/g, (_, key) => pair[key].title || pair[key].name || pair[key].id);
const punctuate = text => text ? text.trim() + (/[.!?]$/.test(text.trim()) ? '' : '.') : '';
export function storyConnectionText(nodes, edge) {
  const saved = edge.storyLink;
  const pair = storyConnectionPair(nodes, edge.from, edge.to, saved?.reverse);
  if (!saved || !pair) return '';
  const pattern = pair.patterns.find(row => row.id === saved.patternId);
  const roles = {};
  for (const node of [pair.a,pair.b]) {
    const kind = storyConnectionKind(node), role = kind === 'item' ? 'item' : kind === 'storyLocation' ? 'place' : ['character','group'].includes(kind) ? roles.actor ? 'other' : 'actor' : null;
    if (role) roles[role] = { name: node.title || node.name || node.id };
  }
  const workshop = beatWorkshopText({storyBeat:{workshop:{...saved.workshop, roles}}});
  const reason = STORY_CONNECTION_REASONS.find(row => row.id === saved.reason)?.text;
  return [pattern ? punctuate(storyConnectionFill(pattern.text,pair)) : '', reason ? punctuate(reason) : '', punctuate(saved.detail || ''), workshop].filter(Boolean).join('\n\n');
}
// A component is read from the current graph, never copied into another node.
// Its authored links and beats stay individually editable as the story grows.
export function connectedStory(graph, from, to, draft, game = {nodes:graph.nodes}) {
  const nodes = graph.nodes || {};
  const existing = (graph.edges || []).filter(edge => nodes[edge.from] && nodes[edge.to]);
  const pending = { from, to, storyLink: draft };
  const hasCurrent = existing.some(edge => edge.from === from && edge.to === to);
  const edges = !draft ? existing : hasCurrent ? existing.map(edge => edge.from === from && edge.to === to ? {...edge, storyLink:draft} : edge) : [...existing,pending];
  const found = new Set([from,to]), queue = [from,to];
  while (queue.length) {
    const id = queue.shift();
    for (const edge of edges) {
      const other = edge.from === id ? edge.to : edge.to === id ? edge.from : null;
      if (other && !found.has(other) && storyConnectionKind(nodes[other])) { found.add(other); queue.push(other); }
    }
  }
  const participants = [...found].map(id => nodes[id]).filter(Boolean);
  const paragraphs = [];
  for (const node of participants) {
    if (!['storyBeat','event','quest','concept'].includes(node.kind)) continue;
    const text = [node.body, beatWorkshopText(node,game)].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join('\n\n');
    if (text) paragraphs.push({ key:'node:'+node.id, nodeId:node.id, text });
  }
  for (const edge of edges) {
    if (!found.has(edge.from) || !found.has(edge.to)) continue;
    const text = storyConnectionText(nodes,edge);
    if (text) paragraphs.push({ key:JSON.stringify([edge.from,edge.to]), from:edge.from, to:edge.to, text, current:edge.from===from&&edge.to===to });
  }
  return {participants, paragraphs, text:paragraphs.map(row=>row.text).join('\n\n')};
}
export function storyConnectionActions(graph, scope, from, to, edgePatch, draft) {
  if (!storyConnectionPair(graph.nodes,from,to)) return [];
  const existing = (graph.edges||[]).find(edge=>edge.from===from&&edge.to===to);
  const pair = storyConnectionPair(graph.nodes,from,to,draft.reverse);
  const pattern = pair.patterns.find(row=>row.id===draft.patternId);
  const label = pattern ? (pair.a.id === from ? pattern.label : (pair.a.title || pair.a.name || pair.a.id) + ': ' + pattern.label.toLowerCase()) : existing?.label || 'Story link';
  return [
    ...(existing ? [] : [{type:'GRAPH_ADD_EDGE',scope,from,to,...edgePatch}]),
    {type:'GRAPH_UPDATE_EDGE',scope,from,to,patch:{...edgePatch, storyLink:{...draft,version:1}, label}},
  ];
}
