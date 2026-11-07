// Larpcraft authoring prompts informed by Group Dynamics Atlas, pp. 2–10.
// This synthesis is not labelled as Tuckman, Gersick or another original model.
export const GROUP_FOUNDATIONS_ID = 'larpcraftGroupFoundations';
export const GROUP_KINDS = ['Family', 'Friends', 'Adventuring party', 'Band', 'Guild', 'Faction', 'Community', 'Institution', 'Order', 'Court', 'Council', 'Company'];
export const GROUP_STEPS = [
  { key: 'start', label: 'Start', color: '#b8a4f4' },
  { key: 'identity', label: 'Identity & bonds', color: '#e8d25c' },
  { key: 'members', label: 'Members & roles', color: '#73ccb2' },
  { key: 'power', label: 'Power & rules', color: '#68b5f0' },
  { key: 'pressure', label: 'Tensions & change', color: '#ef91b7' },
  { key: 'institution', label: 'Institution', color: '#d8af79' },
  { key: 'review', label: 'Description', color: '#b7c7d8' },
];
const field = (key, step, prompt, choices, lead) => ({ key, step, prompt, choices, lead, nodePath: [key],
  ...(choices ? { control: 'multi', choiceAnswerKey: `${key}:choice`, textAnswerKey: key } : {}) });
export const GROUP_QUESTIONS = [
  field('origin', 'identity', 'What brought them together?', ['A shared task', 'Kinship', 'A shared belief', 'Mutual protection', 'A shared place', 'Assignment', 'A common interest', 'A shared ordeal'], 'They came together through'),
  field('bonds', 'identity', 'What keeps them together?', ['Trust', 'Shared history', 'Mutual need', 'Oaths', 'Shared resources', 'Reputation', 'Affection'], 'Their bonds rest on'),
  field('decisions', 'power', 'How is authority held and how are decisions made?', ['Elected leadership', 'Inherited office', 'Appointment', 'Expertise', 'Control of resources', 'Informal influence', 'Shared decisions', 'Coercion'], 'Their arrangements for authority include'),
  field('rules', 'power', 'What rules or expectations guide them?', ['Written rules', 'Unwritten customs', 'Personal agreements', 'Religious duties', 'Flexible arrangements', 'Strict enforcement'], 'Their conduct is shaped by'),
  field('dissent', 'power', 'How do they handle disagreement?', ['Open debate', 'Deference to leaders', 'Compromise', 'Intermediaries', 'Private dissent', 'Punishment', 'Splitting into sides'], 'They handle disagreement through'),
  field('tensions', 'pressure', 'What tensions exist within the group?', ['Unequal influence', 'Competing goals', 'Old grievances', 'Newcomers and veterans', 'Unequal resources', 'Divided loyalties'], 'Their current tensions include'),
  field('pressures', 'pressure', 'What could put their unity under pressure?', ['Resource shortages', 'A leadership change', 'A newcomer', 'An outside threat', 'A failed task', 'A disputed rule', 'A member leaving'], 'Possible pressures include'),
  field('possibilities', 'pressure', 'Possible future developments · optional', null, null),
  field('mandate', 'institution', 'What is their mandate or claimed purpose?', null, 'Their mandate'),
  field('succession', 'institution', 'How are leaders appointed or replaced?', null, 'Leadership and succession'),
  field('assets', 'institution', 'What resources, territory or privileges do they control?', null, 'Resources and privileges'),
  field('obligations', 'institution', 'What obligations remain when members change?', null, 'Continuing obligations'),
];
export const GROUP_FOUNDATIONS = {
  id: GROUP_FOUNDATIONS_ID, name: 'Group Foundations', label: 'Group Foundations', title: 'Group Foundations', color: '#73CCB2', icon: 'users', layout: 'groupFoundations', narrativeFocus: 'relationship',
  blurb: 'Create a group, faction, band or institution through identity, membership, authority and shared bonds.',
  summary: 'A Larpcraft framework for creating groups and institutions. Explore identity and bonds, members and roles, power and rules, tensions and possible change, with optional institutional arrangements. These are optional writing lenses, not fixed stages or predicted outcomes.',
  phases: [
    { key: 'identity', name: 'Identity & bonds', short: 'What brings the group together?', detail: 'Explore origins, shared purpose, bonds and ways of belonging. A group can be small or large, informal or formal.' },
    { key: 'members', name: 'Members & roles', short: 'Who belongs, and what place do they have?', detail: 'Link existing character and group profiles, or record names without profiles. Roles and loyalties belong to this membership.' },
    { key: 'power', name: 'Power & rules', short: 'How do authority, decisions and expectations work?', detail: 'Describe authority, decisions, rules and disagreement. Do not assume every group has a formal leader or written rules.' },
    { key: 'pressure', name: 'Tensions & change', short: 'What supports or strains their unity?', detail: 'Explore current tensions and possible pressures or developments. Possibilities remain separate from established events.' },
    { key: 'institution', name: 'Institution · optional', short: 'What outlasts individual members?', detail: 'Use when useful: mandate, succession, resources, territory, privileges and continuing obligations. Informal groups can skip these lenses.' },
  ],
  description: 'Larpcraft group authoring guide: identity, membership, authority, bonds, tensions and institutions. Inspired by Group Dynamics Atlas; no fixed stages or predicted outcomes.',
  savedQuestions: GROUP_QUESTIONS,
  nodes: Object.fromEntries(GROUP_QUESTIONS.map((q, i) => [q.key, { id: q.key, kind: 'conceptQuestion', title: q.prompt, body: '', x: 80 + i % 3 * 340, y: 80 + Math.floor(i / 3) * 200, w: 300, h: 160 }])),
  edges: GROUP_QUESTIONS.slice(1).map((q, i) => ({ from: GROUP_QUESTIONS[i].key, to: q.key })),
};
const clean = value => String(value ?? '').trim();
const list = values => values.length < 2 ? values[0] || '' : `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`;
const sentence = value => { const text = clean(value); return text ? text + (/[.!?]$/.test(text) ? '' : '.') : ''; };
export function groupFoundationsText(answers = {}, { institution = true } = {}) {
  return GROUP_STEPS.filter(s => !['start', 'members', 'review'].includes(s.key) && (institution || s.key !== 'institution')).map(step => GROUP_QUESTIONS.filter(q => q.step === step.key).flatMap(q => {
    const selected = clean(answers[q.choiceAnswerKey]).split(' | ').filter(Boolean);
    const detail = clean(answers[q.key]);
    const result = [];
    if (selected.length) result.push(sentence(`${q.lead} ${list(selected).toLowerCase()}`));
    if (detail) result.push(sentence(q.key === 'possibilities' ? `Possible developments: ${detail}` : q.choices ? detail : `${q.lead}: ${detail}`));
    return result;
  }).join(' ')).filter(Boolean).join('\n\n');
}

export function groupFacts(node) { return { kind: '', size: '', purpose: '', members: [], relationships: [], institution: false, ...(node.groupFacts || {}) }; }
export function groupProfileFactsText(node) {
  const facts = groupFacts(node);
  const rows = [['Kind of group', facts.kind], ['Approximate size', facts.size], ['Shared purpose', facts.purpose]].filter(([, value]) => clean(value)).map(([label, value]) => `${label}: ${value}`);
  if (facts.members.length) rows.push('Members: ' + facts.members.map(row => [row.name, row.role, row.loyalty].filter(Boolean).join(' · ')).join(', '));
  for (const row of facts.relationships) if (row.name) rows.push(`${row.type || 'Related to'}: ${row.name}`);
  return rows.join('\n');
}
export function groupEntities(game) {
  const rows = [];
  const walk = (nodes, coll, parents = []) => {
    for (const node of Object.values(nodes || {})) {
      if (node.characterInput || node.wizardQuestionKey) continue;
      const path = [...parents, node.id];
      if (['character', 'group'].includes(node.kind)) rows.push({ key: JSON.stringify([coll, ...path]), name: node.title || node.name || node.id, type: node.kind, ref: { coll, path } });
      walk(node.sub?.nodes, coll, path);
    }
  };
  for (const coll of ['nodes', 'masterNodes', 'taskNodes', 'storyboardNodes']) walk(game[coll], coll);
  return rows;
}
export function resolveGroupRef(game, ref) {
  let node = game[ref?.coll]?.[ref?.path?.[0]];
  for (const id of ref?.path?.slice(1) || []) node = node?.sub?.nodes?.[id];
  return node && ['character', 'group'].includes(node.kind) ? node : null;
}
export function refreshGroupFacts(node, game) {
  if (!node.groupFacts) return node;
  let changed = false;
  const refresh = rows => (rows || []).map(row => {
    const live = resolveGroupRef(game, row.ref), name = live?.title || live?.name;
    if (!name || name === row.name) return row;
    changed = true; return { ...row, name };
  });
  const facts = { ...node.groupFacts, members: refresh(node.groupFacts.members), relationships: refresh(node.groupFacts.relationships) };
  return changed ? { ...node, groupFacts: facts } : node;
}
export function groupFactsText(node) {
  const facts = groupFacts(node), parts = [];
  if (facts.kind) parts.push(sentence(`${node.title || node.name || 'This group'} is ${/^[aeiou]/i.test(facts.kind) ? 'an' : 'a'} ${facts.kind.toLowerCase()}`));
  if (facts.size) parts.push(sentence(`Its approximate size is ${facts.size}`));
  if (facts.purpose) parts.push(sentence(`Its shared purpose is ${facts.purpose}`));
  if (facts.members.length) parts.push(sentence(`Named members and subgroups include ${list(facts.members.map(row => `${row.name}${row.role ? ` (${row.role})` : ''}${row.loyalty ? ` — ${row.loyalty}` : ''}`))}`));
  for (const row of facts.relationships) parts.push(sentence(`${row.type || 'Related to'}: ${row.name}`));
  return parts.join(' ');
}
export function remapGroupReferences(node, idMap = {}, scope = { coll: 'nodes' }) {
  const prefix = scope.parentPath || (scope.parentId ? [scope.parentId] : []);
  const remap = row => {
    const ref = row.ref;
    if (!ref) return row;
    const owned = ref.coll === scope.coll && JSON.stringify(ref.path.slice(0, prefix.length)) === JSON.stringify(prefix);
    const mapped = owned && idMap[ref.path[prefix.length]];
    return { ...row, ref: mapped ? { ...ref, path: [...prefix, mapped, ...ref.path.slice(prefix.length + 1)] } : null };
  };
  return { ...node,
    ...(node.groupFacts ? { groupFacts: { ...node.groupFacts, members: (node.groupFacts.members || []).map(remap), relationships: (node.groupFacts.relationships || []).map(remap) } } : {}),
    ...(node.sub ? { sub: { ...node.sub, nodes: Object.fromEntries(Object.entries(node.sub.nodes || {}).map(([id, child]) => [id, remapGroupReferences(child, idMap, scope)])) } } : {}),
  };
}
export function syncGroupRoster(node) {
  if (node.kind !== 'group' || !node.characterCanvas) return node;
  const nodes = { ...node.sub?.nodes };
  let id = Object.values(nodes).find(n => n.groupRoster)?.id || 'GROUP-MEMBERS';
  while (nodes[id] && !nodes[id].groupRoster) id += '-copy';
  const defaultY = Math.max(100, ...Object.values(nodes).filter(n => n.characterInput).map(n => (n.y || 0) + (n.h || 240))) + 70;
  if (!(node.characterCanvas.hidden || []).includes('group:members')) nodes[id] = {
    ...nodes[id], id, kind: 'groupMembers', groupRoster: true, title: 'Members & relationships',
    x: nodes[id]?.x ?? 100, y: !nodes[id] || nodes[id].y === nodes[id].groupRosterDefaultY ? defaultY : nodes[id].y,
    groupRosterDefaultY: defaultY, w: nodes[id]?.w ?? 320, h: nodes[id]?.h ?? 240,
    color: nodes[id]?.color || '#73CCB2', body: groupFactsText(node),
  };
  return { ...node, sub: { ...(node.sub || {}), nodes, edges: node.sub?.edges || [] } };
}
