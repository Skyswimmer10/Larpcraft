import { sourceGraph, substituteRoles, adaptConceptGraph, frameworkNotesGraph, reviseWizardGraph } from './narrativeGraph.js';
export { substituteRoles, adaptConceptGraph } from './narrativeGraph.js';
import { remapCharacterInputs, enableCharacterProfile, captureCharacterWriting, syncCharacterProfile, characterWizardRecords, wizardSessionKey, isProfileNode } from './characterProfile.js';
import { FRAMEWORK_TYPES, ADDITIONAL_NODE_TYPES, cloneCharacterCardTemplate } from '../data/seed.js';
import { NARRATIVE_FOCUSES, narrativeGuidance, defaultNarrativeFocus } from '../data/narrativeGuidance.js';
import { focusStarters } from './frameworkQuestions.js';
import { questionAnswer } from './narrativeMemory.js';
import { metaProgramProfile } from '../data/metaProgramWizard.js';
import { metaProgramNarrative } from './metaProgramNarrative.js';
import { fateOutput } from './fateWizard.js';
import { kolbOutput } from './kolbWizard.js';
import { valuesOutput } from './humanValuesWizard.js';
import { GROUP_FOUNDATIONS_ID } from './groupFoundations.js';
import { isDragonConcept, dragonSummary } from './dragonWorkshop.js';
import { storyArchetype } from '../data/storyArchetypes.js';
import { archetypeConceptQuestions, archetypeSummary } from './archetypeConcept.js';
import { KWML_ID } from '../data/kwml.js';
import { kwmlSaveAnswers, kwmlSummary } from './kwmlWizard.js';

const clone = value => JSON.parse(JSON.stringify(value));
const text = value => typeof value === 'string' ? value.trim() : '';
const question = (key, prompt, hint = '', extra = {}) => ({ key, prompt, hint, ...extra });

export { frameworkQuestions } from './frameworkQuestions.js';

export function narrativeSources(library) {
  return [
    ...Object.values(FRAMEWORK_TYPES).map(source => ({ key: `framework:${source.id}`, type: 'framework', source, label: source.label, guidance: narrativeGuidance(source, 'framework') })),
    ...Object.values(library?.concepts || {}).filter(source => source.id !== GROUP_FOUNDATIONS_ID).map(source => ({ key: `concept:${source.id}`, type: 'concept', source, label: source.name || source.title || 'Untitled concept', guidance: narrativeGuidance(source, 'concept') })),
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

export function conceptRoles(source) {
  if (storyArchetype(source)) return [];
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
  if (source.savedQuestions) return focus === 'character' && storyArchetype(source) ? archetypeConceptQuestions(source, source.savedQuestions) : clone(source.savedQuestions);
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
    } else if (['storyBeat', 'event', 'quest', 'storyLocation', 'item'].includes(node.kind)) {
      add(question(`node:${path.join('/')}`, `What happens around “${label}”, and why does it matter?`, node.body, { nodePath: path }));
    }
  }
  if (!result.length) result.push(question('application', `How does this concept help you develop this ${NARRATIVE_FOCUSES[focus]?.result.toLowerCase() || 'situation'}?`, source.description || source.body || 'Describe what happens and why it matters.'));
  const rows = [...focusStarters(focus), ...result];
  return focus === 'character' && storyArchetype(source) ? archetypeConceptQuestions(source, rows) : rows;
}

function questionnaireSummary({ source, type, title, context, roles = [], questions, answers, focus }) {
  const lines = [title, focus && `Working on: ${NARRATIVE_FOCUSES[focus]?.result || focus}`, context, `Based on: ${source.label || source.name || source.title}`].filter(Boolean);
  for (const role of roles) if (text(role.replacement)) lines.push(`${role.label || role.original}: ${text(role.replacement)}`);
  for (const row of questions) if (questionAnswer(row, answers)) lines.push(`${type === 'concept' ? substituteRoles(row.prompt, roles) : row.prompt}\n${questionAnswer(row, answers)}`);
  return lines.join('\n\n');
}

export function wizardSummary(options) {
  if (options.type === 'framework' && options.source?.id === KWML_ID && options.focus === 'character') return kwmlSummary(options);
  if (options.type === 'concept' && options.focus === 'character' && storyArchetype(options.source)) return archetypeSummary(options);
  if (options.type === 'concept' && isDragonConcept(options.source) && options.questions?.some(row => row.dragonField)) return dragonSummary(options.answers, options.questions);
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
  if (type === 'framework' && source.id === KWML_ID && isCharacter) answers = kwmlSaveAnswers(answers);
  const summary = wizardSummary({ source, type, title, context, roles, questions, answers, focus: actualFocus, narrativeText, fateDraft, kolbDraft, valuesDraft });
  const record = { version: 2, resultId: id, sessionId: `${id}:wizard`, summary, focus: actualFocus, sourceType: type, sourceId: source.id, sourceLabel: source.label || source.name || source.title, title, context, roles: clone(roles), answers: clone(answers), questions: clone(questions) };
  if (type === 'concept') record.sourceSnapshot = clone({ id: source.id, name: source.name || source.title, category: source.category || source.conceptKind, description: source.description || source.body || '', questions: source.questions || [], conceptQuestions: source.conceptQuestions || [], ...sourceGraph(source) });
  if (type === 'concept' && isDragonConcept(source) && questions.some(row => row.dragonField)) { record.summaryFormat = 'dragon-prose'; record.sourceSnapshot.dragonWorkshop = 1; }
  if (type === 'concept' && isCharacter && storyArchetype(source)) {
    record.summaryFormat = 'archetype-prose';
    if (typeof narrativeText === 'string') record.narrativeText = narrativeText;
  }
  if (type === 'framework' && source.id === 'fate' && fateDraft) { record.fateDraft = clone(fateDraft); record.summaryFormat = 'fate-prose'; }
  if (type === 'framework' && source.id === 'kolbLearningCycle' && kolbDraft) { record.kolbDraft = clone(kolbDraft); record.summaryFormat = 'kolb-prose'; }
  if (type === 'framework' && source.id === 'humanValues' && valuesDraft) { record.valuesDraft = clone(valuesDraft); record.summaryFormat = 'values-prose'; }
  if (type === 'framework' && source.id === 'nlpMetaPrograms') record.metaProgramProfile = metaProgramProfile(answers);
  if (type === 'framework' && source.id === 'nlpMetaPrograms' && isCharacter) {
    record.summaryFormat = 'character-prose';
    if (typeof narrativeText === 'string') record.narrativeText = narrativeText;
  }
  if (type === 'framework' && source.id === KWML_ID && isCharacter) {
    record.summaryFormat = 'kwml-prose';
    if (typeof narrativeText === 'string') record.narrativeText = narrativeText;
  }
  const common = { id, title: text(title), name: text(title), body: summary, x: position.x ?? 100, y: position.y ?? 100, w: 280, h: 150, history: [], narrativeFocus: actualFocus, narrativeWizard: record, teamId: null, sets: [], locationId: null, itemId: null, mechanicIds: [], sensorIds: [] };
  const sub = isCharacter ? null : type === 'concept' ? adaptConceptGraph(source, roles, questions, answers) : frameworkNotesGraph(source, questions, answers);
  const characterCard = isCharacter ? cloneCharacterCardTemplate(characterTemplate) : null;
  if (isCharacter) return syncCharacterProfile(enableCharacterProfile({
    ...common, ...characterCard, description: summary, kind: 'character', color: '#F08CB4', characterCanvas: { version: 1 },
    questions: [
      ...characterCard.questions,
      ...questions.filter(q => questionAnswer(q, answers)).map(q => {
        const questionId = `${id}-wizard-${encodeURIComponent(q.key)}`;
        (record.questionIds ||= {})[q.key] = questionId;
        return { id: questionId, prompt: type === 'concept' ? substituteRoles(q.prompt, roles) : q.prompt, answer: questionAnswer(q, answers) };
      }),
    ],
    collapsed: true,
  }));
  const conceptKind = NARRATIVE_FOCUSES[actualFocus]?.category || source.conceptKind || source.category || 'storyConcept';
  const conceptAnswers = Object.fromEntries(questions.filter(q => q.answerKey && text(answers[q.key])).map(q => [q.answerKey, text(answers[q.key])]));
  return { ...common, kind: 'concept', conceptId: type === 'framework' ? null : source.kind === 'concept' ? source.conceptId || null : source.id, conceptKind, description: summary, conceptType: source.conceptType || 'unset', status: 'draft', onePromise: source.onePromise || '', color: ADDITIONAL_NODE_TYPES[conceptKind]?.color, collapsed: true, sub, conceptAnswers, conceptQuestions: clone(source.conceptQuestions || []), ...(source.conceptModules ? { conceptModules: clone(source.conceptModules) } : {}), referenceFrameworkIds: type === 'framework' ? [source.id] : clone(source.referenceFrameworkIds || []) };
}

// Adding a lens must not convert or replace the selected character/scene/tree.
export function appendWizardResult(target, addition) {
  if (isProfileNode(target)) target = captureCharacterWriting(enableCharacterProfile(target));
  addition = clone(addition);
  const mergeInput = isProfileNode(target) && (target.kind === 'group' || addition.kind === 'character');
  if (mergeInput) delete addition.narrativeWizard.attachedChildId;
  const used = new Set(characterWizardRecords(target).map(wizardSessionKey));
  const original = addition.narrativeWizard.sessionId;
  let suffix = 2;
  while (used.has(wizardSessionKey(addition.narrativeWizard))) addition.narrativeWizard.sessionId = original + ':' + suffix++;
  const questionIds = new Set((target.questions || []).map(row => row.id));
  for (const row of addition.questions || []) if (questionIds.has(row.id)) {
    const previous = row.id;
    row.id = addition.narrativeWizard.sessionId + ':' + previous;
    for (const [key, id] of Object.entries(addition.narrativeWizard.questionIds || {})) if (id === previous) addition.narrativeWizard.questionIds[key] = row.id;
  }
  const next = { ...target,
    body: [target.body, addition.body].filter(Boolean).join('\n\n'),
    description: [target.description || target.body, addition.body].filter(Boolean).join('\n\n'),
    narrativeWizard: clone(addition.narrativeWizard),
    narrativeWizardHistory: [...characterWizardRecords(target), clone(addition.narrativeWizard)],
  };
  if (mergeInput) {
    const rows = (addition.questions || []).filter(q => Object.values(addition.narrativeWizard.questionIds || {}).includes(q.id));
    next.questions = [...(target.questions || []), ...clone(rows)];
  }
  if (mergeInput) next.characterCanvas = { ...target.characterCanvas, version: 1 };
  if (!mergeInput) {
    const sub = target.sub || {};
    let index = 1;
    while (sub.nodes?.[`WIZ-${index}`]) index++;
    const id = `WIZ-${index}`;
    const child = clone(addition);
    if (isProfileNode(target)) {
      child.kind = 'concept'; child.conceptKind = 'characterConcept';
      delete child.questions; delete child.typeGroups;
    }
    next.sub = { ...sub, nodes: { ...(sub.nodes || {}), [id]: { ...child, id, x: 100 + (index - 1) % 3 * 340, y: 100 + Math.floor((index - 1) / 3) * 210 } }, edges: sub.edges || [] };
    next.narrativeWizard = { ...next.narrativeWizard, attachedChildId: id };
  }
  return isProfileNode(target) ? syncCharacterProfile(next) : next;
}

const replaceSavedText = (value, before, after) => {
  if (!value) return after;
  return before && value.includes(before) ? value.replace(before, () => after) : `${value}\n\n${after}`;
};

// Update only wizard-owned content. Hand-edited fields, node positions, links,
// and extra nodes stay in place; continuing never appends a duplicate plan.
export function reviseWizardResult(target, addition, source) {
  if (isProfileNode(target)) target = captureCharacterWriting(enableCharacterProfile(target));
  const record = target.narrativeWizard;
  if (!record) return target;
  const oldSummary = record.summary ?? questionnaireSummary({ source, type: record.sourceType, ...record });
  const next = { ...target,
    body: replaceSavedText(target.body, oldSummary, addition.body),
    description: replaceSavedText(target.description || target.body, oldSummary, addition.body),
    narrativeWizard: { ...addition.narrativeWizard, sessionId: record.sessionId || addition.narrativeWizard.sessionId, attachedChildId: record.attachedChildId },
  };
  const attachedId = record.attachedChildId || Object.values(target.sub?.nodes || {}).find(node => {
    const saved = node.narrativeWizard;
    return saved?.sessionId && record.sessionId ? saved.sessionId === record.sessionId : saved?.sourceId === record.sourceId && saved?.title === record.title;
  })?.id;
  if (target.characterCanvas?.version === 1) {
    // The character canvas reconciles this session's existing child below.
  } else if (attachedId && target.sub?.nodes?.[attachedId]) {
    const child = target.sub.nodes[attachedId];
    const revised = reviseWizardResult(child, addition, source);
    next.sub = { ...target.sub, nodes: { ...target.sub.nodes, [attachedId]: revised } };
    next.narrativeWizard.attachedChildId = attachedId;
  } else if (target.sub) {
    const before = createWizardNode({ source, type: record.sourceType, title: record.title, context: record.context, roles: record.roles, questions: record.questions || [], answers: record.answers || {}, focus: record.focus, id: record.resultId || target.id });
    next.sub = reviseWizardGraph(target.sub, before.sub, addition.sub);
  } else if (addition.sub) next.sub = clone(addition.sub);
  if (isProfileNode(target) && (target.kind === 'group' || addition.kind === 'character')) {
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
  if (!isProfileNode(target) && target.title === record.title) next.title = addition.title;
  if (!isProfileNode(target) && target.name === record.title) next.name = addition.name;
  if (target.narrativeWizardHistory) next.narrativeWizardHistory = target.narrativeWizardHistory.map(entry =>
    (entry.sessionId && entry.sessionId === record.sessionId) || entry === record || (!record.sessionId && entry.sourceType === record.sourceType && entry.sourceId === record.sourceId && entry.title === record.title) ? next.narrativeWizard : entry);
  return isProfileNode(target) ? syncCharacterProfile(next) : next;
}

export function wizardLibraryRecord(node, id) {
  if (node.kind !== 'concept') {
    node = remapCharacterInputs(clone(node));
    return { coll: 'narrative', entity: { id, name: node.title, nodeClass: 'base', nodeKind: node.kind, category: node.kind, description: node.body, body: node.body, icon: node.kind === 'character' ? 'user' : node.kind === 'group' ? 'users' : 'book', color: node.color, narrativeFocus: node.narrativeFocus, template: clone(node) } };
  }
  const graph = clone(node.sub || {});
  return { coll: 'concepts', entity: { ...graph, id, name: node.title, description: node.body, category: node.conceptKind, narrativeFocus: node.narrativeFocus, premade: false, questions: [], conceptType: node.conceptType, status: node.status, onePromise: node.onePromise, conceptAnswers: clone(node.conceptAnswers || {}), conceptQuestions: clone(node.conceptQuestions || []), ...(node.conceptModules ? { conceptModules: clone(node.conceptModules) } : {}), referenceFrameworkIds: clone(node.referenceFrameworkIds || []), narrativeWizard: clone(node.narrativeWizard), ...(node.narrativeWizardHistory ? { narrativeWizardHistory: clone(node.narrativeWizardHistory) } : {}) } };
}
