const text = value => typeof value === 'string' ? value.trim() : '';
export const DRAGON_CONCEPT_ID = 'LIB-CPT-DRAGON';
export const isDragonConcept = source => !!source && (source.id === DRAGON_CONCEPT_ID || source.conceptId === DRAGON_CONCEPT_ID || source.dragonWorkshop === 1 || source.narrativeWizard?.summaryFormat === 'dragon-prose' || /dragon\s*(?:&|and)\s*(?:the\s*)?(city|castle)/i.test(source.name || source.title || ''));
export const DRAGON_STEPS = [
  { id: 'city', label: 'City', icon: 'pin' }, { id: 'dragon', label: 'Dragon', icon: 'alert' },
  { id: 'responses', label: 'Responses', icon: 'branches' }, { id: 'stakes', label: 'People & stakes', icon: 'flag' }, { id: 'review', label: 'Review', icon: 'book' },
];
export const DRAGON_ROUTES = ['escape', 'defend', 'attack'];
// Bind once by stable path. Several answers may fill different fields of one
// existing node; no extra question nodes are needed to hold these answers.
export const DRAGON_FIELDS = [
  { id: 'city', section: 'city', label: 'What is the city in your version?', hint: 'A place, community, institution, relationship or belief.', node: 'S008', legacy: 'question:city', role: 'city' },
  { id: 'valuable', section: 'city', label: 'What is good and valuable here?', node: 'S009' },
  { id: 'flaw', section: 'city', label: 'What is unfair, broken or wasteful?', node: 'S010' },
  { id: 'authority', section: 'city', label: 'Who decides, and who needs persuading?', node: 'S019', advanced: true },
  { id: 'dragon', section: 'dragon', label: 'What is the dragon in your version?', hint: 'It can be a person, group, famine, system or other source of pressure.', node: 'S007', legacy: 'question:dragon', role: 'dragon' },
  { id: 'origin', section: 'dragon', label: 'Where does the threat come from?', node: 'S011' },
  { id: 'wants', section: 'dragon', label: 'What drives the threat, and why does it matter now?', node: 'S007', legacy: 'question:wants' },
  { id: 'weakness', section: 'dragon', label: 'What limits it, or what price might it accept?', node: 'S007', legacy: 'question:weakness' },
  { id: 'allowed', section: 'dragon', label: 'How was it allowed to get this bad?', node: 'S012', advanced: true },
  { id: 'opportunity', section: 'dragon', label: 'Could this threat reveal an opportunity?', node: 'S015', advanced: true },
  { id: 'escapePlan', section: 'responses', route: 'escape', label: 'Where could they go?', node: 'S014' },
  { id: 'escapeCost', section: 'responses', route: 'escape', label: 'What is the cost of abandoning the city?', node: 'S013' },
  { id: 'escapeTake', section: 'responses', route: 'escape', label: 'What should they take with them?', node: 'S018', advanced: true },
  { id: 'escapeNotes', section: 'responses', route: 'escape', label: 'Other details about escaping', node: 'S002', advanced: true },
  { id: 'defendPlan', section: 'responses', route: 'defend', label: 'How could they strengthen their defences?', node: 'S022' },
  { id: 'defendCost', section: 'responses', route: 'defend', label: 'What does staying put protect and restrict?', node: 'S017' },
  { id: 'defendKeep', section: 'responses', route: 'defend', label: 'What is worth defending?', node: 'S020', advanced: true },
  { id: 'defendNotes', section: 'responses', route: 'defend', label: 'Other details about defending', node: 'S003', advanced: true },
  { id: 'attackPlan', section: 'responses', route: 'attack', label: 'What is the best line of attack?', node: 'S021' },
  { id: 'attackCost', section: 'responses', route: 'attack', label: 'What is the reward, and is it worth the risk?', node: 'S016' },
  { id: 'attackChance', section: 'responses', route: 'attack', label: 'What makes success plausible or doubtful?', node: 'S023', advanced: true },
  { id: 'attackNotes', section: 'responses', route: 'attack', label: 'Other details about attacking', node: 'S005', advanced: true },
  { id: 'defenders', section: 'stakes', label: 'Who stands for the city, and what might they give up?', node: 'S008', legacy: 'question:defenders' },
  { id: 'stakes', section: 'stakes', label: 'What is lost if the threat wins?', node: 'S008', legacy: 'question:stakes' },
  { id: 'choice', section: 'stakes', label: 'Who chooses the response, and what could change their mind?', node: 'S006', advanced: true },
];
export const dragonKey = id => `dragon:${id}`;
export function graphNodeAt(graph, path) {
  let node;
  for (const id of path || []) { node = graph?.nodes?.[id]; graph = node?.sub; }
  return node;
}
const sourceGraph = source => source?.sub || source || {};
function paths(graph, prefix = [], result = []) {
  for (const node of Object.values(graph?.nodes || {})) { const path = [...prefix, node.id]; result.push({ node, path }); paths(node.sub, path, result); }
  return result;
}
export function dragonQuestions(source, previous = source?.narrativeWizard?.questions || []) {
  const graph = sourceGraph(source), rows = paths(graph);
  const questions = DRAGON_FIELDS.map(field => {
    const prior = previous.find(row => row.dragonField === field.id);
    // A prior binding remains valid when its label/position/type changes.
    const roleCandidates = ['S007', 'S008'].includes(field.node) ? rows.filter(row => new RegExp(`\\b(?:${field.node === 'S007' ? 'dragon|threat' : 'city|castle'})\\b`, 'i').test(row.node.wizardRole || row.node.title || '')) : [];
    const candidate = prior?.nodePath && graphNodeAt(graph, prior.nodePath) ? { path: prior.nodePath } : rows.find(row => row.node.id === field.node) || (roleCandidates.length === 1 ? roleCandidates[0] : null);
    return { key: dragonKey(field.id), dragonField: field.id, prompt: field.label, hint: field.hint || '', nodeField: field.id, ...(candidate ? { nodePath: candidate.path } : {}), skipGraphIfUnbound: true };
  });
  const consumed = new Set(DRAGON_FIELDS.flatMap(field => [dragonKey(field.id), field.legacy, ...(!field.legacy ? [`node:${field.node}`] : [])]).filter(Boolean));
  for (const row of previous) if (!consumed.has(row.key)) questions.push({ ...row, nodeField: row.nodeField || `earlier:${row.key}`, skipGraphIfUnbound: true });
  const covered = new Set(questions.map(row => JSON.stringify(row.nodePath)));
  for (const { node, path } of rows) if (node.kind === 'conceptQuestion' && !covered.has(JSON.stringify(path))) {
    const key = `node:${path.join('/')}`;
    if (!questions.some(row => row.key === key)) questions.push({ key, prompt: node.title || 'Additional question', nodePath: path, nodeField: `extra:${key}`, skipGraphIfUnbound: true });
  }
  for (const [index, row] of (source.questions || []).entries()) {
    const key = `question:${row.key || row.id || index}`;
    if (!consumed.has(key) && !questions.some(question => question.key === key)) questions.push({ key, prompt: row.label || row.prompt, nodeField: `extra:${key}`, skipGraphIfUnbound: true });
  }
  for (const [index, row] of (source.conceptQuestions || []).entries()) {
    const key = `custom:${row.id || index}`;
    if (!questions.some(question => question.key === key)) questions.push({ key, prompt: row.prompt, nodeField: `extra:${key}`, skipGraphIfUnbound: true });
  }
  return questions;
}
export function dragonAnswers(source, answers = {}, roles = [], previous = source?.narrativeWizard?.questions || []) {
  answers = { ...source?.narrativeWizard?.answers, ...answers };
  const result = { ...answers }, graph = sourceGraph(source);
  const currentQuestions = dragonQuestions(source, previous);
  for (const field of DRAGON_FIELDS) {
    const key = dragonKey(field.id);
    if (typeof answers[key] === 'string') continue;
    const prior = previous.find(row => row.dragonField === field.id);
    const legacyNode = previous.find(row => row.nodePath?.at(-1) === field.node && !row.nodeField);
    const candidates = [prior?.key, field.legacy, ...(!field.legacy ? [legacyNode?.key, `node:${field.node}`] : [])].filter(Boolean);
    const known = candidates.find(candidate => typeof answers[candidate] === 'string');
    const role = field.role && roles.find(role => role.id === field.role);
    const node = graphNodeAt(graph, prior?.nodePath || currentQuestions.find(row => row.dragonField === field.id)?.nodePath || [field.node]);
    result[key] = known ? answers[known] : text(role?.replacement) || (node?.wizardFields?.[key]?.answer ?? '');
  }
  return result;
}
export function dragonPassages(answers = {}, questions = []) {
  const part = id => ({ key: dragonKey(id), text: text(answers[dragonKey(id)]) });
  const passage = (id, label, ids) => ({ id, label, parts: ids.map(key => ({ ...part(key), label: DRAGON_FIELDS.find(field => field.id === key)?.label || key })).filter(part => part.text) });
  const entries = [passage('city', 'The city', ['city', 'valuable', 'flaw', 'authority']), passage('dragon', 'The threat', ['dragon', 'origin', 'wants', 'weakness', 'allowed', 'opportunity']), ...DRAGON_ROUTES.map(route => passage(route, route[0].toUpperCase() + route.slice(1), DRAGON_FIELDS.filter(field => field.route === route).map(field => field.id))), passage('stakes', 'People and stakes', ['defenders', 'stakes', 'choice'])];
  const extras = questions.filter(q => !q.dragonField && text(answers[q.key]));
  if (extras.length) entries.push({ id: 'earlier', label: 'Additional writing', parts: extras.map(q => ({ key: q.key, label: q.prompt, text: text(answers[q.key]) })) });
  return entries.filter(entry => entry.parts.length);
}
// Preserve the writer's exact statements. Route plans remain possibilities,
// not events that happened or a decision the players have already made.
export function dragonSummary(answers, questions = []) {
  return dragonPassages(answers, questions).map(entry => {
    const prefixes = { city: 'What matters', dragon: 'The threat', escape: 'Possible escape', defend: 'Possible defence', attack: 'Possible attack', stakes: 'People and stakes', earlier: 'Additional writing' };
    return `${prefixes[entry.id]}: ${entry.parts.map(part => `${part.text.replace(/[\s.!?]+$/u, '')}.`).join(' ')}`;
  }).join('\n\n');
}
