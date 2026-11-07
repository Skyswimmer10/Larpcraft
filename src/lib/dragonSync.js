import { dragonSummary, graphNodeAt } from './dragonWorkshop.js';

const keyOf = record => record.sessionId || `${record.sourceType}:${record.sourceId}:${record.title}`;
function refresh(node) {
  const records = [...(node.narrativeWizardHistory || []), ...(node.narrativeWizard ? [node.narrativeWizard] : [])];
  const replacements = new Map();
  let next = node;
  for (const record of records) {
    if (record.summaryFormat !== 'dragon-prose' || replacements.has(keyOf(record))) continue;
    const child = record.attachedChildId && node.sub?.nodes?.[record.attachedChildId];
    // A wizard save is newer than its still-to-be-refreshed character canvas.
    if (child?.characterInput?.generated && JSON.stringify(record.answers) !== JSON.stringify(child.characterInput.generated.answers)) continue;
    const graph = child ? child.sub : node.sub || (node.nodes ? node : null);
    if (!graph) continue;
    let answers = record.answers || {};
    for (const row of record.questions || []) {
      if (!row.nodeField) continue;
      const field = graphNodeAt(graph, row.nodePath)?.wizardFields?.[row.key];
      if (field && typeof field.answer === 'string' && field.answer !== answers[row.key]) answers = { ...answers, [row.key]: field.answer };
    }
    if (answers === record.answers) continue;
    const summary = dragonSummary(answers, record.questions);
    replacements.set(keyOf(record), { ...record, answers, summary });
    if (!['character', 'group'].includes(node.kind)) {
      const update = value => value === record.summary || !value ? summary : record.summary && value.includes(record.summary) ? value.replace(record.summary, () => summary) : value;
      next = { ...next, body: update(next.body), description: update(next.description) };
    }
  }
  if (!replacements.size) return next;
  const replace = record => replacements.get(keyOf(record)) || record;
  let sub = next.sub, questions = next.questions;
  for (const record of replacements.values()) {
    const child = sub?.nodes?.[record.attachedChildId];
    if (child?.characterInput?.generated) sub = { ...sub, nodes: { ...sub.nodes, [child.id]: { ...child, characterInput: { ...child.characterInput, generated: { ...child.characterInput.generated, answers: record.answers } } } } };
    if (questions && record.questionIds) questions = questions.map(row => {
      const key = Object.keys(record.questionIds).find(key => record.questionIds[key] === row.id);
      return key ? { ...row, answer: record.answers[key] || '' } : row;
    });
  }
  return { ...next, ...(sub ? { sub } : {}), ...(questions ? { questions } : {}), ...(node.narrativeWizard ? { narrativeWizard: replace(node.narrativeWizard) } : {}), ...(node.narrativeWizardHistory ? { narrativeWizardHistory: node.narrativeWizardHistory.map(replace) } : {}) };
}

// Direct field edits and wizard edits share the same native fields. Reconcile
// their saved answer records before the character/profile description pass.
export function syncDragonProject(state) {
  const visit = nodes => {
    let result = nodes;
    for (const [id, node] of Object.entries(nodes || {})) {
      let next = node;
      if (node.sub?.nodes) { const children = visit(node.sub.nodes); if (children !== node.sub.nodes) next = { ...next, sub: { ...node.sub, nodes: children } }; }
      if (node.nodes) { const children = visit(node.nodes); if (children !== node.nodes) next = { ...next, nodes: children }; }
      next = refresh(next);
      if (next !== node) { if (result === nodes) result = { ...nodes }; result[id] = next; }
    }
    return result;
  };
  let next = state;
  for (const coll of ['nodes', 'masterNodes', 'taskNodes', 'storyboardNodes', 'concepts', 'stories']) {
    if (!state[coll]) continue;
    const nodes = visit(state[coll]);
    if (nodes !== state[coll]) next = { ...next, [coll]: nodes };
  }
  return next;
}
