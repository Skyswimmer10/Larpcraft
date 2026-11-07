import { FRAMEWORK_TYPES } from '../data/seed.js';
import { questionAnswer } from './narrativeMemory.js';
import { wizardFieldsBody } from './wizardFields.js';
const clone = value => JSON.parse(JSON.stringify(value));
const text = value => typeof value === 'string' ? value.trim() : '';

export const sourceGraph = source => source.sub || {
  nodes: source.nodes || {}, edges: source.edges || [], subnodes: source.subnodes || {},
  frameworks: source.frameworks || {}, frames: source.frames || {},
  numberMarkers: source.numberMarkers || {}, titleMarkers: source.titleMarkers || {},
};

// Simultaneous substitutions change visible prose, preserving graph identity.
export function substituteRoles(value, roles = []) {
  const replacements = roles.filter(r => text(r.original) && text(r.replacement))
    .sort((a, b) => b.original.length - a.original.length);
  if (!replacements.length || typeof value !== 'string') return value;
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])(${replacements.map(r => escape(text(r.original))).join('|')})(?![\\p{L}\\p{N}_])`, 'giu');
  return value.replace(pattern, match => replacements.find(r => text(r.original).toLowerCase() === match.toLowerCase()).replacement);
}

export function adaptConceptGraph(source, roles, questions, answers) {
  const graph = clone(sourceGraph(source));
  // Saved concept templates keep reference cards and support nodes in separate
  // maps. The nested game canvas renders them from its node map.
  graph.nodes = { ...(graph.subnodes || {}), ...(graph.nodes || {}) };
  for (const framework of Object.values(graph.frameworks || {})) {
    if (graph.nodes[framework.id]) continue;
    const type = FRAMEWORK_TYPES[framework.frameworkId];
    graph.nodes[framework.id] = { ...framework, kind: 'framework', title: framework.title || type?.title, body: type?.summary || '' };
  }
  delete graph.subnodes;
  delete graph.frameworks;
  const proseKeys = new Set(['title', 'name', 'body', 'description', 'label', 'prompt', 'answer', 'notes', 'text', 'onePromise']);
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    for (const key of Object.keys(value)) {
      if (proseKeys.has(key) && typeof value[key] === 'string') value[key] = substituteRoles(value[key], roles);
      else if (typeof value[key] === 'object' && key !== 'image') visit(value[key]);
    }
  };
  visit(graph);
  const atPath = path => { let node; let current = graph; for (const id of path || []) { node = current?.nodes?.[id]; current = node?.sub; } return node; };
  for (const role of roles || []) {
    if (!text(role.replacement) || !role.nodePath) continue;
    const node = atPath(role.nodePath);
    if (node) { node.wizardRole = role.label; node.title = text(role.replacement); if (node.name !== undefined) node.name = node.title; }
  }
  let extraIndex = 0;
  for (const row of questions) {
    const answer = questionAnswer(row, answers);
    const rolePath = !row.nodePath && row.answerKey && roles?.find(role => role.id === row.answerKey)?.nodePath;
    let node = atPath(row.nodePath || rolePath);
    if (row.nodeField) {
      if (!node) continue;
      const authoredBody = node.wizardFieldGeneratedBody !== undefined && node.body !== node.wizardFieldGeneratedBody;
      node.wizardFieldReferenceBody ??= node.body || '';
      node.wizardFields = { ...node.wizardFields, [row.key]: { prompt: substituteRoles(row.prompt, roles), field: row.nodeField, answer, generatedAnswer: answer } };
      node.wizardFieldGeneratedBody = wizardFieldsBody(node);
      if (!authoredBody) node.body = node.wizardFieldGeneratedBody;
      continue;
    }
    if (row.skipGraphIfUnbound && !node) continue;
    if (node?.wizardQuestionKey && node.wizardQuestionKey !== row.key) node = null;
    if (!node && answer) {
      let id = `wizard-answer-${encodeURIComponent(row.key)}`;
      while (graph.nodes[id]) id += '-copy';
      const right = Math.max(0, ...Object.values(graph.nodes).filter(n => !n.wizardQuestionKey).map(n => (n.x || 0) + (n.w || 280)));
      node = graph.nodes[id] = { id, kind: 'conceptQuestion', title: substituteRoles(row.prompt, roles), body: '', x: right + 80, y: 80 + extraIndex++ * 180, w: 310 };
    }
    if (node) {
      const reference = node.body || '';
      node.wizardQuestionKey = row.key; node.wizardReferenceBody = reference;
      node.body = answer ? [reference, `Your version: ${answer}`].filter(Boolean).join('\n\n') : reference;
      node.wizardAnswer = answer; node.wizardGeneratedBody = node.body; node.wizardGeneratedAnswer = answer;
    }
  }
  return graph;
}

export function frameworkNotesGraph(source, questions, answers) {
  const nodes = { reference: { id: 'reference', kind: 'framework', frameworkId: source.id, title: source.title || source.label, body: source.summary || '', color: source.color, x: 80, y: 80, w: 280, h: 240 } };
  questions.filter(q => questionAnswer(q, answers)).forEach((q, i) => {
    const id = `answer-${i + 1}`;
    nodes[id] = { id, kind: 'conceptQuestion', title: q.prompt, body: questionAnswer(q, answers), wizardQuestionKey: q.key, x: 440 + i % 2 * 340, y: 80 + Math.floor(i / 2) * 190, w: 300, h: 150 };
    nodes[id].wizardAnswer = nodes[id].body; nodes[id].wizardGeneratedAnswer = nodes[id].body; nodes[id].wizardGeneratedBody = nodes[id].body;
  });
  return { nodes, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} };
}

export function reviseWizardGraph(current, before, after) {
  if (!current) return clone(after);
  const nodes = { ...current.nodes };
  const resolveId = (graph, node) => node.wizardQuestionKey
    ? Object.values(graph.nodes || {}).find(other => other.wizardQuestionKey === node.wizardQuestionKey)?.id || (!graph.nodes?.[node.id]?.wizardQuestionKey ? node.id : undefined)
    : node.id;
  for (const generated of Object.values(after?.nodes || {})) {
    const currentId = resolveId(current, generated);
    const oldId = resolveId(before || {}, generated);
    const previous = before?.nodes?.[oldId];
    const existing = nodes[currentId];
    if (!existing) {
      let id = generated.id;
      let suffix = 1;
      while (nodes[id]) id = `${generated.id}-${suffix++}`;
      nodes[id] = { ...clone(generated), id };
      continue;
    }
    const next = { ...existing };
    if (generated.wizardFields) {
      next.wizardFields = clone(generated.wizardFields);
      next.wizardFieldReferenceBody = generated.wizardFieldReferenceBody;
      next.wizardFieldGeneratedBody = generated.wizardFieldGeneratedBody;
      if (!existing.body || existing.body === previous?.body || existing.body === existing.wizardFieldGeneratedBody) next.body = generated.body;
    }
    for (const field of ['title', 'name', 'body', 'wizardAnswer', 'wizardQuestionKey', 'wizardReferenceBody', 'wizardGeneratedBody', 'wizardGeneratedAnswer']) {
      if (field.startsWith('wizard') && existing[field] === undefined || generated[field] !== previous?.[field] && existing[field] === previous?.[field]) next[field] = generated[field];
    }
    if (generated.sub) next.sub = reviseWizardGraph(existing.sub, previous?.sub, generated.sub);
    nodes[currentId] = next;
  }
  for (const old of Object.values(before?.nodes || {})) {
    if (!old.wizardQuestionKey || Object.values(after?.nodes || {}).some(node => node.wizardQuestionKey === old.wizardQuestionKey)) continue;
    const currentId = resolveId(current, old);
    if (nodes[currentId]) nodes[currentId] = { ...nodes[currentId], body: '', wizardAnswer: '', wizardGeneratedAnswer: '', wizardGeneratedBody: '' };
  }
  return { ...current, nodes };
}
