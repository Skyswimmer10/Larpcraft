import { FRAMEWORK_TYPES, ADDITIONAL_NODE_TYPES, cloneCharacterCardTemplate } from '../data/seed.js';

const clone = value => JSON.parse(JSON.stringify(value));
const text = value => typeof value === 'string' ? value.trim() : '';
const question = (key, prompt, hint = '', extra = {}) => ({ key, prompt, hint, ...extra });

const FRAMEWORK_PROMPTS = {
  fate: ['What captures this character’s attention?', 'Why do others trust or listen to this character?', 'Where do they belong, and whose approval matters?', 'What feeling drives their next decision?'],
  kolbLearningCycle: ['What experience changes this character’s outlook?', 'What do they notice when they look back?', 'What lesson or belief do they take from it?', 'How do they test that belief in their next action?'],
  descentAndRecovery: ['What is their normal life, and what is missing?', 'What knocks their life off course?', 'At their lowest point, what do they discover?', 'What do they do with what they learned?', 'How are they different after recovering?'],
  homeVoyageReturn: ['What makes home familiar, and what is missing?', 'What do they want enough to leave home?', 'What unfamiliar situation do they enter?', 'What must they learn or change to cope?', 'What do they finally obtain?', 'What does getting it cost them?', 'What happens when they return?', 'What has changed in them, and how does it affect home?'],
  storyBuildingSystem: ['What is the central idea behind this character?', 'What uncertainty or discovery draws them forward?', 'What part do they play in other people’s stories?', 'What should their presence make players think, feel, or do?', 'Which events reveal their story?', 'What voice, manner, or imagery makes them recognisable?', 'How and when do players learn about them?', 'How do these choices work together in one playable encounter?'],
};

export function frameworkQuestions(framework, answers = {}) {
  if (!framework) return [];
  const phases = framework.phases || [];
  if (framework.layout === 'archetypes') {
    const phase = phases.find(p => p.key === answers.archetype);
    return [
      question('archetype', 'Which archetype would you like to explore?', 'Use it as a writing lens. Any character can draw on any of these roles.', { choices: phases.map(p => p.key) }),
      question('strength', 'How does this character show the healthy side of this archetype?', phase?.short),
      question('root', 'What younger or less experienced side still shows through?', phase ? `Immature root: ${phase.name}. ${phase.descriptions?.child || ''}` : 'Choose an archetype to see its immature root.'),
      question('activeShadow', 'Under pressure, how might they misuse their strength?', phase ? `Active shadow: ${phase.adultActiveShadow}. ${phase.descriptions?.adultActiveShadow || ''} Immature active shadow: ${phase.childActiveShadow}. ${phase.descriptions?.childActiveShadow || ''}` : ''),
      question('passiveShadow', 'When they withdraw or give up, what does that look like?', phase ? `Passive shadow: ${phase.adultPassiveShadow}. ${phase.descriptions?.adultPassiveShadow || ''} Immature passive shadow: ${phase.childPassiveShadow}. ${phase.descriptions?.childPassiveShadow || ''}` : ''),
      question('shadowScene', 'What situation brings out a shadow, and what could help them recover?', 'Describe an observable choice, not just a personality label.'),
    ];
  }
  return phases.map((phase, index) => {
    let prompt = FRAMEWORK_PROMPTS[framework.id]?.[index];
    if (framework.layout === 'values') prompt = `What does “${phase.key} / ${phase.name}” mean to this character, and what choice puts it at risk?`;
    if (framework.layout === 'preferenceSpectra') prompt = phase.question;
    if (framework.layout === 'languageSpectrum') prompt = `How might this character use ${phase.name.toLowerCase()} in dialogue, and what would a clearer version reveal?`;
    if (framework.layout === 'profileDomains') prompt = `${phase.short} Show this through a scene or behaviour.`;
    const hint = framework.layout === 'languageSpectrum'
      ? `Reference example: “${phase.example}” → “${phase.question}” → “${phase.clarified}”`
      : [phase.short, phase.children?.join(' · ')].filter(Boolean).join(' ');
    return question(`phase:${phase.key}`, prompt || `How does ${phase.name || phase.key} appear in this character’s story?`, hint);
  });
}

export function narrativeSources(library) {
  return [
    ...Object.values(FRAMEWORK_TYPES).map(source => ({ key: `framework:${source.id}`, type: 'framework', source, label: source.label })),
    ...Object.values(library?.concepts || {}).map(source => ({ key: `concept:${source.id}`, type: 'concept', source, label: source.name || source.title || 'Untitled concept' })),
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

export function conceptQuestions(source) {
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
      add(question(`node:${path.join('/')}`, `How does “${label}” appear when your character is under pressure?`, node.body, { nodePath: path }));
    } else if (node.kind === 'characterArchetypeFacet') {
      const prompts = {
        when: 'When does your character show this side of themselves?',
        say: 'What could your character say that reveals this side?',
        gift: 'What does your character offer other people?',
      };
      const facet = path[path.length - 1].split('-').pop();
      add(question(`node:${path.join('/')}`, prompts[facet] || `How does “${label}” show up in your character?`, node.body, { nodePath: path }));
    } else if (node.kind === 'characterArchetypeCombinations') {
      add(question(`node:${path.join('/')}`, 'What other side of this character supports or clashes with their main archetype?', node.body, { nodePath: path }));
    } else if (['event', 'quest', 'storyLocation', 'item'].includes(node.kind)) {
      add(question(`node:${path.join('/')}`, `What happens around “${label}”, and why does it matter?`, node.body, { nodePath: path }));
    }
  }
  if (!result.length) result.push(question('application', 'How does this concept work in your character or scene?', source.description || source.body || 'Describe what happens and why it matters.'));
  return result;
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

export function wizardSummary({ source, type, title, context, roles = [], questions, answers }) {
  const lines = [title, context, `Based on: ${source.label || source.name || source.title}`].filter(Boolean);
  for (const role of roles) if (text(role.replacement)) lines.push(`${role.label || role.original}: ${text(role.replacement)}`);
  for (const row of questions) if (text(answers[row.key])) lines.push(`${type === 'concept' ? substituteRoles(row.prompt, roles) : row.prompt}\n${text(answers[row.key])}`);
  return lines.join('\n\n');
}

export function createWizardNode({ source, type, title, context = '', roles = [], questions, answers, output = 'character', id, position = {}, characterTemplate }) {
  const summary = wizardSummary({ source, type, title, context, roles, questions, answers });
  const record = { version: 1, sourceType: type, sourceId: source.id, sourceLabel: source.label || source.name || source.title, title, context, roles: clone(roles), answers: clone(answers), questions: clone(questions) };
  const common = { id, title: text(title), name: text(title), body: summary, x: position.x ?? 100, y: position.y ?? 100, w: 280, h: 150, history: [], narrativeWizard: record, teamId: null, sets: [], locationId: null, itemId: null, mechanicIds: [], sensorIds: [] };
  const sub = type === 'concept' ? adaptConceptGraph(source, roles, questions, answers) : null;
  const characterCard = output === 'character' ? cloneCharacterCardTemplate(characterTemplate) : null;
  if (output === 'character') return {
    ...common, ...characterCard, description: summary, kind: 'character', color: '#F08CB4',
    questions: [
      ...characterCard.questions,
      ...questions.filter(q => text(answers[q.key])).map((q, i) => ({ id: `${id}-wizard-${i}`, prompt: type === 'concept' ? substituteRoles(q.prompt, roles) : q.prompt, answer: text(answers[q.key]) })),
    ],
    ...(sub ? { sub, collapsed: true } : {}),
  };
  const conceptKind = source.conceptKind || source.category || 'storyConcept';
  const conceptAnswers = Object.fromEntries(questions.filter(q => q.answerKey && text(answers[q.key])).map(q => [q.answerKey, text(answers[q.key])]));
  return { ...common, kind: 'concept', conceptId: source.kind === 'concept' ? source.conceptId || null : source.id, conceptKind, description: summary, conceptType: source.conceptType || 'unset', status: 'draft', onePromise: source.onePromise || '', color: ADDITIONAL_NODE_TYPES[conceptKind]?.color, collapsed: true, sub, conceptAnswers, conceptQuestions: clone(source.conceptQuestions || []), ...(source.conceptModules ? { conceptModules: clone(source.conceptModules) } : {}), referenceFrameworkIds: clone(source.referenceFrameworkIds || []) };
}

export function wizardLibraryRecord(node, id) {
  if (node.kind === 'character') return { coll: 'narrative', entity: { id, name: node.title, nodeClass: 'base', nodeKind: 'character', category: 'character', description: node.body, body: node.body, icon: 'user', color: node.color, template: clone(node) } };
  const graph = clone(node.sub || {});
  return { coll: 'concepts', entity: { ...graph, id, name: node.title, description: node.body, category: node.conceptKind, premade: false, questions: [], conceptType: node.conceptType, status: node.status, onePromise: node.onePromise, conceptAnswers: clone(node.conceptAnswers || {}), conceptQuestions: clone(node.conceptQuestions || []), ...(node.conceptModules ? { conceptModules: clone(node.conceptModules) } : {}), referenceFrameworkIds: clone(node.referenceFrameworkIds || []), narrativeWizard: clone(node.narrativeWizard) } };
}
