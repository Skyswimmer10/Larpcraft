import { FRAMEWORK_TYPES, ADDITIONAL_NODE_TYPES, cloneCharacterCardTemplate } from '../data/seed.js';
import { NARRATIVE_FOCUSES, narrativeGuidance, defaultNarrativeFocus } from '../data/narrativeGuidance.js';
import { focusStarters } from './frameworkQuestions.js';
import { questionAnswer } from './narrativeMemory.js';
import { metaProgramProfile } from '../data/metaProgramWizard.js';
import { metaProgramNarrative } from './metaProgramNarrative.js';
import { fateOutput } from './fateWizard.js';
import { kolbOutput } from './kolbWizard.js';
import { valuesOutput } from './humanValuesWizard.js';

const clone = value => JSON.parse(JSON.stringify(value));
const text = value => typeof value === 'string' ? value.trim() : '';
const question = (key, prompt, hint = '', extra = {}) => ({ key, prompt, hint, ...extra });

export { frameworkQuestions } from './frameworkQuestions.js';

export function narrativeSources(library) {
  return [
    ...Object.values(FRAMEWORK_TYPES).map(source => ({ key: `framework:${source.id}`, type: 'framework', source, label: source.label, guidance: narrativeGuidance(source, 'framework') })),
    ...Object.values(library?.concepts || {}).map(source => ({ key: `concept:${source.id}`, type: 'concept', source, label: source.name || source.title || 'Untitled concept', guidance: narrativeGuidance(source, 'concept') })),
  ];
}

// Paths identify nodes inside nested graphs; IDs alone are only unique within a graph.
function graphRows(graph, path = [], output = []) {
  for (const node of Object.values(graph?.nodes || {})) {
    const nodePath = [...path, node.id];
    output.push({ node, path: nodePath });
    if (node.sub) graphRows(node.sub, nodePath, output);
  }
  return output;
}

const sourceGraph = source => source.sub || {
  nodes: source.nodes || {}, edges: source.edges || [], subnodes: source.subnodes || {},
  frameworks: source.frameworks || {}, frames: source.frames || {},
  numberMarkers: source.numberMarkers || {}, titleMarkers: source.titleMarkers || {},
};

export function conceptRoles(source) {
  const rows = graphRows(sourceGraph(source));
  const dragon = /dragon/i.test(`${source.name || source.title || ''}`);
  const roles = dragon ? [
    { id: 'dragon', original: 'dragon', label: 'The threat', replacement: '', hint: 'A creature, person, debt, deadline, or other source of danger.' },
    { id: 'city', original: 'city', label: 'What is worth protecting', replacement: '', hint: 'A castle, home, friendship, community, or something else of value.' },
  ] : [];
  for (const { node, path } of rows) {
    if (!['character', 'storyLocation', 'item', 'quest'].includes(node.kind)) continue;
    const title = text(node.title || node.name);
    if (!title) continue;
    const known = roles.find(role => new RegExp(`\\b${role.original}\\b`, 'i').test(title));
    if (known) { known.nodePath = path; continue; }
    roles.push({ id: `role:${path.join('/')}`, original: title, label: title, replacement: '', nodePath: path, hint: 'Who or what fills this role in your version? It can be a person, place, object, or idea.' });
  }
  return roles;
}

export function conceptQuestions(source, focus = defaultNarrativeFocus(source, 'concept')) {
  if (source.savedQuestions) return clone(source.savedQuestions);
  const result = [];
  const seen = new Set();
  const add = row => { if (text(row.prompt) && !seen.has(row.prompt.toLowerCase())) { seen.add(row.prompt.toLowerCase()); result.push(row); } };
  const rolePrompts = /dragon/i.test(source.name || source.title || '') ? {
    dragon: 'What threatens something valuable in your version?',
    city: 'What is worth protecting?',
    wants: 'What drives the threat, and why does it matter now?',
    weakness: 'What could reduce or stop the threat, and what would it cost?',
    defenders: 'Who protects what matters, and what must they give up?',
    stakes: 'What is lost if the threat wins?',
  } : {};
  for (const [index, row] of (source.questions || []).entries()) {
    add(question(`question:${row.key || row.id || index}`, rolePrompts[row.key] || row.label || row.prompt, '', { answerKey: row.key || row.id || `${index}` }));
  }
  for (const [index, row] of (source.conceptQuestions || []).entries()) {
    add(question(`custom:${row.id || index}`, row.prompt, '', { choices: (row.choices || []).map(c => c.label).filter(Boolean) }));
  }
  for (const { node, path } of graphRows(sourceGraph(source))) {
    if (node.kind === 'framework') continue;
    const label = text(node.title || node.name);
    if (!label) continue;
    if (node.kind === 'conceptQuestion') {
      add(question(`node:${path.join('/')}`, label, node.body, { nodePath: path }));
    } else if (node.kind === 'conceptTitle' || node.kind === 'conceptChoice') {
      add(question(`node:${path.join('/')}`, `How does “${label}” fit your version?`, node.body, { nodePath: path }));
    } else if (node.kind === 'characterShadow') {
      add(question(`node:${path.join('/')}`, focus === 'character' ? `How does “${label}” appear when your character is under pressure?` : `How does “${label}” affect the people involved and the choices they make here?`, node.body, { nodePath: path }));
    } else if (node.kind === 'characterArchetypeFacet') {
      const prompts = {
        when: 'When does your character show this side of themselves?',
        say: 'What could your character say that reveals this side?',
        gift: 'What does your character offer other people?',
      };
      const facet = path[path.length - 1].split('-').pop();
      const scopedPrompts = { when: 'When does this behaviour affect the situation or relationship?', say: 'What could someone say that reveals this behaviour to the other people involved?', gift: 'What does one person offer another, and how is it received?' };
      add(question(`node:${path.join('/')}`, (focus === 'character' ? prompts[facet] : scopedPrompts[facet]) || `How does “${label}” affect this situation?`, node.body, { nodePath: path }));
    } else if (node.kind === 'characterArchetypeCombinations') {
      add(question(`node:${path.join('/')}`, focus === 'character' ? 'What other side of this character supports or clashes with their main archetype?' : 'Which roles support or clash with one another in this situation?', node.body, { nodePath: path }));
    } else if (['event', 'quest', 'storyLocation', 'item'].includes(node.kind)) {
      add(question(`node:${path.join('/')}`, `What happens around “${label}”, and why does it matter?`, node.body, { nodePath: path }));
    }
  }
  if (!result.length) result.push(question('application', `How does this concept help you develop this ${NARRATIVE_FOCUSES[focus]?.result.toLowerCase() || 'situation'}?`, source.description || source.body || 'Describe what happens and why it matters.'));
  return [...focusStarters(focus), ...result];
}

// One replacement pass avoids turning A → B → C into A → C. Only visible prose
// is changed; IDs, edges, kind names, references, images and geometry stay intact.
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
  for (const row of questions) {
    if (!row.nodePath || !text(answers[row.key])) continue;
    const node = atPath(row.nodePath);
    if (node) { node.body = [node.body, `Your version: ${text(answers[row.key])}`].filter(Boolean).join('\n\n'); node.wizardAnswer = text(answers[row.key]); }
  }
  return graph;
}

function questionnaireSummary({ source, type, title, context, roles = [], questions, answers, focus }) {
  const lines = [title, focus && `Working on: ${NARRATIVE_FOCUSES[focus]?.result || focus}`, context, `Based on: ${source.label || source.name || source.title}`].filter(Boolean);
  for (const role of roles) if (text(role.replacement)) lines.push(`${role.label || role.original}: ${text(role.replacement)}`);
  for (const row of questions) if (questionAnswer(row, answers)) lines.push(`${type === 'concept' ? substituteRoles(row.prompt, roles) : row.prompt}\n${questionAnswer(row, answers)}`);
  return lines.join('\n\n');
}

export function wizardSummary(options) {
  if (options.type === 'framework' && options.source.id === 'humanValues' && options.valuesDraft) return valuesOutput(options.valuesDraft);
  if (options.type === 'framework' && options.source.id === 'kolbLearningCycle' && options.kolbDraft) return kolbOutput(options.kolbDraft);
  if (options.type === 'framework' && options.source.id === 'fate' && options.fateDraft) return fateOutput(options.fateDraft);
  if (options.type === 'framework' && options.source.id === 'nlpMetaPrograms' && options.focus === 'character') {
    return typeof options.narrativeText === 'string' ? options.narrativeText.trim() : metaProgramNarrative(options);
  }
  return questionnaireSummary(options);
}

export function createWizardNode({ source, type, title, context = '', roles = [], questions, answers, output, focus, id, position = {}, characterTemplate, narrativeText, fateDraft, kolbDraft, valuesDraft }) {
  const actualFocus = focus || (output === 'character' ? 'character' : defaultNarrativeFocus(source, type));
  const isCharacter = actualFocus === 'character';
  const summary = wizardSummary({ source, type, title, context, roles, questions, answers, focus: actualFocus, narrativeText, fateDraft, kolbDraft, valuesDraft });
  const record = { version: 2, resultId: id, sessionId: `${id}:wizard`, summary, focus: actualFocus, sourceType: type, sourceId: source.id, sourceLabel: source.label || source.name || source.title, title, context, roles: clone(roles), answers: clone(answers), questions: clone(questions) };
  if (type === 'framework' && source.id === 'fate' && fateDraft) { record.fateDraft = clone(fateDraft); record.summaryFormat = 'fate-prose'; }
  if (type === 'framework' && source.id === 'kolbLearningCycle' && kolbDraft) { record.kolbDraft = clone(kolbDraft); record.summaryFormat = 'kolb-prose'; }
  if (type === 'framework' && source.id === 'humanValues' && valuesDraft) { record.valuesDraft = clone(valuesDraft); record.summaryFormat = 'values-prose'; }
  if (type === 'framework' && source.id === 'nlpMetaPrograms') record.metaProgramProfile = metaProgramProfile(answers);
  if (type === 'framework' && source.id === 'nlpMetaPrograms' && isCharacter) {
    record.summaryFormat = 'character-prose';
    if (typeof narrativeText === 'string') record.narrativeText = narrativeText;
  }
  const common = { id, title: text(title), name: text(title), body: summary, x: position.x ?? 100, y: position.y ?? 100, w: 280, h: 150, history: [], narrativeFocus: actualFocus, narrativeWizard: record, teamId: null, sets: [], locationId: null, itemId: null, mechanicIds: [], sensorIds: [] };
  const sub = type === 'concept' ? adaptConceptGraph(source, roles, questions, answers) : isCharacter ? null : frameworkNotesGraph(source, questions, answers);
  const characterCard = isCharacter ? cloneCharacterCardTemplate(characterTemplate) : null;
  if (isCharacter) return {
    ...common, ...characterCard, description: summary, kind: 'character', color: '#F08CB4',
    questions: [
      ...characterCard.questions,
      ...questions.filter(q => questionAnswer(q, answers)).map(q => {
        const questionId = `${id}-wizard-${encodeURIComponent(q.key)}`;
        (record.questionIds ||= {})[q.key] = questionId;
        return { id: questionId, prompt: type === 'concept' ? substituteRoles(q.prompt, roles) : q.prompt, answer: questionAnswer(q, answers) };
      }),
    ],
    ...(sub ? { sub, collapsed: true } : {}),
  };
  const conceptKind = NARRATIVE_FOCUSES[actualFocus]?.category || source.conceptKind || source.category || 'storyConcept';
  const conceptAnswers = Object.fromEntries(questions.filter(q => q.answerKey && text(answers[q.key])).map(q => [q.answerKey, text(answers[q.key])]));
  return { ...common, kind: 'concept', conceptId: type === 'framework' ? null : source.kind === 'concept' ? source.conceptId || null : source.id, conceptKind, description: summary, conceptType: source.conceptType || 'unset', status: 'draft', onePromise: source.onePromise || '', color: ADDITIONAL_NODE_TYPES[conceptKind]?.color, collapsed: true, sub, conceptAnswers, conceptQuestions: clone(source.conceptQuestions || []), ...(source.conceptModules ? { conceptModules: clone(source.conceptModules) } : {}), referenceFrameworkIds: type === 'framework' ? [source.id] : clone(source.referenceFrameworkIds || []) };
}

function frameworkNotesGraph(source, questions, answers) {
  const nodes = { reference: { id: 'reference', kind: 'framework', frameworkId: source.id, title: source.title || source.label, body: source.summary || '', color: source.color, x: 80, y: 80, w: 280, h: 240 } };
  questions.filter(q => questionAnswer(q, answers)).forEach((q, i) => {
    const id = `answer-${i + 1}`;
    nodes[id] = { id, kind: 'conceptQuestion', title: q.prompt, body: questionAnswer(q, answers), wizardQuestionKey: q.key, x: 440 + i % 2 * 340, y: 80 + Math.floor(i / 2) * 190, w: 300, h: 150 };
  });
  return { nodes, edges: [], frames: {}, numberMarkers: {}, titleMarkers: {} };
}

// Adding a lens must not convert or replace the selected character/scene/tree.
export function appendWizardResult(target, addition) {
  const next = { ...target,
    body: [target.body, addition.body].filter(Boolean).join('\n\n'),
    description: [target.description || target.body, addition.body].filter(Boolean).join('\n\n'),
    narrativeWizard: clone(addition.narrativeWizard),
    narrativeWizardHistory: [...(target.narrativeWizardHistory || (target.narrativeWizard ? [target.narrativeWizard] : [])), clone(addition.narrativeWizard)],
  };
  if (target.kind === 'character' && addition.kind === 'character') {
    const rows = addition.questions.filter(q => q.id.startsWith(`${addition.id}-wizard-`));
    next.questions = [...(target.questions || []), ...clone(rows)];
  }
  if (addition.sub || target.kind !== 'character' || addition.kind !== 'character') {
    const sub = target.sub || {};
    let index = 1;
    while (sub.nodes?.[`WIZ-${index}`]) index++;
    const id = `WIZ-${index}`;
    const child = clone(addition);
    if (target.kind === 'character' && addition.kind === 'character') {
      child.kind = 'concept'; child.conceptKind = 'characterConcept';
      delete child.questions; delete child.typeGroups;
    }
    next.sub = { ...sub, nodes: { ...(sub.nodes || {}), [id]: { ...child, id, x: 100 + (index - 1) % 3 * 340, y: 100 + Math.floor((index - 1) / 3) * 210 } }, edges: sub.edges || [] };
    next.narrativeWizard = { ...next.narrativeWizard, attachedChildId: id };
  }
  return next;
}

const replaceSavedText = (value, before, after) => {
  if (!value) return after;
  return before && value.includes(before) ? value.replace(before, () => after) : `${value}\n\n${after}`;
};

// Update only wizard-owned content. Hand-edited fields, node positions, links,
// and extra nodes stay in place; continuing never appends a duplicate plan.
function reviseWizardGraph(current, before, after) {
  if (!current) return clone(after);
  const nodes = { ...current.nodes };
  const resolveId = (graph, node) => node.wizardQuestionKey
    ? Object.values(graph.nodes || {}).find(other => other.wizardQuestionKey === node.wizardQuestionKey)?.id
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
    for (const field of ['title', 'name', 'body', 'wizardAnswer']) {
      if (generated[field] !== previous?.[field] && existing[field] === previous?.[field]) next[field] = generated[field];
    }
    if (generated.sub) next.sub = reviseWizardGraph(existing.sub, previous?.sub, generated.sub);
    nodes[currentId] = next;
  }
  for (const old of Object.values(before?.nodes || {})) {
    if (!old.wizardQuestionKey || Object.values(after?.nodes || {}).some(node => node.wizardQuestionKey === old.wizardQuestionKey)) continue;
    const currentId = resolveId(current, old);
    if (nodes[currentId]?.body === old.body) nodes[currentId] = { ...nodes[currentId], body: '' };
  }
  return { ...current, nodes };
}

export function reviseWizardResult(target, addition, source) {
  const record = target.narrativeWizard;
  if (!record) return target;
  const oldSummary = record.summary ?? questionnaireSummary({ source, type: record.sourceType, ...record });
  const next = { ...target,
    body: replaceSavedText(target.body, oldSummary, addition.body),
    description: replaceSavedText(target.description || target.body, oldSummary, addition.body),
    narrativeWizard: { ...addition.narrativeWizard, ...(record.attachedChildId ? { attachedChildId: record.attachedChildId } : {}) },
  };
  const attachedId = record.attachedChildId || Object.values(target.sub?.nodes || {}).find(node => node.narrativeWizard?.sourceId === record.sourceId && node.narrativeWizard?.title === record.title)?.id;
  if (attachedId && target.sub.nodes[attachedId]) {
    const child = target.sub.nodes[attachedId];
    const revised = reviseWizardResult(child, addition, source);
    next.sub = { ...target.sub, nodes: { ...target.sub.nodes, [attachedId]: revised } };
    next.narrativeWizard.attachedChildId = attachedId;
  } else if (target.sub) {
    const before = createWizardNode({ source, type: record.sourceType, title: record.title, context: record.context, roles: record.roles, questions: record.questions || [], answers: record.answers || {}, focus: record.focus, id: record.resultId || target.id });
    next.sub = reviseWizardGraph(target.sub, before.sub, addition.sub);
  } else if (addition.sub) next.sub = clone(addition.sub);
  if (target.kind === 'character' && addition.kind === 'character') {
    const previousIds = new Map((record.questions || []).map(row => [row.key, record.questionIds?.[row.key] || target.questions?.find(q => q.prompt === row.prompt && q.answer === questionAnswer(row, record.answers))?.id]));
    const byId = new Map([...previousIds].filter(([, id]) => id).map(([key, id]) => [id, key]));
    const generated = new Map(Object.entries(addition.narrativeWizard.questionIds || {}).map(([key, id]) => [key, addition.questions.find(q => q.id === id)]));
    const questionIds = {};
    next.questions = (target.questions || []).flatMap(existing => {
      const key = byId.get(existing.id);
      if (!key) return [existing];
      const updated = generated.get(key);
      generated.delete(key);
      if (!updated) return [];
      questionIds[key] = existing.id;
      const previousQuestion = record.questions?.find(row => row.key === key);
      const previousPrompt = record.sourceType === 'concept' ? substituteRoles(previousQuestion?.prompt, record.roles) : previousQuestion?.prompt;
      return [{ ...existing, prompt: existing.prompt === previousPrompt ? updated.prompt : existing.prompt, answer: updated.answer }];
    });
    for (const [key, row] of generated) { next.questions.push(row); questionIds[key] = row.id; }
    next.narrativeWizard.questionIds = questionIds;
  }
  // Preserve the node's identity/type, including attached plans and user renames.
  if (target.title === record.title) next.title = addition.title;
  if (target.name === record.title) next.name = addition.name;
  if (target.narrativeWizardHistory) next.narrativeWizardHistory = target.narrativeWizardHistory.map(entry =>
    (entry.sessionId && entry.sessionId === record.sessionId) || entry === record || (!record.sessionId && entry.sourceType === record.sourceType && entry.sourceId === record.sourceId && entry.title === record.title) ? next.narrativeWizard : entry);
  return next;
}

export function wizardLibraryRecord(node, id) {
  if (node.kind !== 'concept') return { coll: 'narrative', entity: { id, name: node.title, nodeClass: 'base', nodeKind: node.kind, category: node.kind, description: node.body, body: node.body, icon: node.kind === 'character' ? 'user' : 'book', color: node.color, narrativeFocus: node.narrativeFocus, template: clone(node) } };
  const graph = clone(node.sub || {});
  return { coll: 'concepts', entity: { ...graph, id, name: node.title, description: node.body, category: node.conceptKind, narrativeFocus: node.narrativeFocus, premade: false, questions: [], conceptType: node.conceptType, status: node.status, onePromise: node.onePromise, conceptAnswers: clone(node.conceptAnswers || {}), conceptQuestions: clone(node.conceptQuestions || []), ...(node.conceptModules ? { conceptModules: clone(node.conceptModules) } : {}), referenceFrameworkIds: clone(node.referenceFrameworkIds || []), narrativeWizard: clone(node.narrativeWizard), ...(node.narrativeWizardHistory ? { narrativeWizardHistory: clone(node.narrativeWizardHistory) } : {}) } };
}
