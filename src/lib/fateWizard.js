import { FATE_STEPS, FATE_FIELDS, FATE_PURPOSE_LABELS, FATE_BANNERS, FATE_WARNINGS, FATE_GAP_SUGGESTIONS } from '../data/fateWizard.js';
import { NARRATIVE_FOCUSES } from '../data/narrativeGuidance.js';
import { fateFieldsFor, FATE_DETAIL_QUESTIONS, FATE_PURPOSE_COPY as P } from '../data/fatePurposes.js';

export const copyFate = value => JSON.parse(JSON.stringify(value));
export const getFate = (value, path) => path.split('.').reduce((part, key) => part?.[key], value);
export function setFate(value, path, next) {
  const result = copyFate(value), keys = path.split('.');
  let part = result;
  for (const key of keys.slice(0, -1)) part = part[key] ||= {};
  part[keys.at(-1)] = next;
  return result;
}
const nonempty = value => Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== '' && value !== false;
const tidy = value => String(value ?? '').trim().replace(/\s+/g, ' ');
export const naturalList = values => values.length < 2 ? values[0] || '' : `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sectionFor = path => path.split('.')[0];
export const fatePillarFor = path => /^communication\.lines\.[FATE]$/.test(path) ? path.at(-1) : path === 'communication.listenerReply' ? 'E' : FATE_STEPS.find(step => step.section === sectionFor(path))?.key;
export const fateScopeKey = scope => JSON.stringify({ coll: scope?.coll || 'nodes', path: scope?.parentPath || (scope?.parentId ? [scope.parentId] : []) });

export function normalizeFateDraft(value) {
  let draft = copyFate(value);
  draft.purposeBanks ||= {};
  draft.communication = { speaker: '', listener: '', speakerRef: '', listenerRef: '', relationship: '', goal: '', lines: {}, listenerReply: '', profile: null, ...draft.communication };
  for (const section of ['focus', 'authority', 'tribe', 'emotion']) { draft[section] ||= { anchor: '' }; draft[section].details ||= {}; }
  if (!Array.isArray(draft.authority.source)) draft.authority.source = draft.authority.source ? [draft.authority.source] : [];
  if (value.revision !== 2) draft.authority.source = [...new Set([...draft.authority.source, ...(draft.authority.secondary || [])])];
  draft.tribe.groups ||= []; draft.tribe.loyalties ||= ''; draft.emotion.recurring ||= []; draft.emotion.patterns ||= [];
  if (draft.meta.purpose === 'communication' && draft.output.format === 'Story paragraph') draft.output.format = 'Spoken dialogue';
  if (draft.meta.purpose !== 'communication' && draft.output.format === 'Spoken dialogue') draft.output.format = 'Story paragraph';
  draft.revision = 2;
  return draft;
}
const safeKey = value => `k-${encodeURIComponent(value).replace(/\./g, '%2E')}`;
export const fateDetailPath = (path, option) => `${path.split('.')[0]}.details.${safeKey(path)}.${safeKey(option)}`;
export const fateSelected = (draft, path) => { const value = getFate(draft, path); return Array.isArray(value) ? value : value ? [value] : []; };
export function fateDetailQuestion(draft, path, option) {
  if (draft.meta.purpose === 'character') {
    if (path === 'authority.source') return `Who or what carries this authority, and why do they trust it?`;
    if (path === 'tribe.groups') return 'What place do they have here, and why does this group matter?';
    if (path === 'emotion.recurring') return 'What tends to bring this feeling out?';
    if (path === 'focus.hooks') return 'What repeatedly catches their attention in this way?';
  }
  return FATE_DETAIL_QUESTIONS[path]?.[option] || P.genericDetail;
}
export function fateChoiceFields(draft, pillar) {
  return fateFieldsFor(draft.meta.purpose, pillar).filter(field => ['single', 'multi'].includes(field.control) && (!field.purposes || field.purposes.includes(draft.meta.purpose)) && (!field.when || getFate(draft, field.when[0]) === field.when[1]));
}
export function fateChoiceDetails(draft, pillar) {
  return fateChoiceFields(draft, pillar).flatMap(field => fateSelected(draft, field.path).map(option => ({ field, option, path: fateDetailPath(field.path, option), text: getFate(draft, fateDetailPath(field.path, option)) || '' })));
}
const PURPOSE_KEYS = ['title', 'context', 'focus', 'authority', 'tribe', 'emotion', 'notes', 'output', 'fieldMeta', 'dismissedWarnings', 'communication'];
export function switchFatePurpose(draft, purpose) {
  if (!NARRATIVE_FOCUSES[purpose] || purpose === draft.meta.purpose) return draft;
  const next = normalizeFateDraft(draft), snapshot = Object.fromEntries(PURPOSE_KEYS.map(key => [key, copyFate(next[key])]));
  snapshot.meta = copyFate(next.meta); next.purposeBanks[draft.meta.purpose] = snapshot;
  const restored = next.purposeBanks[purpose] || createFateDraft({ purpose });
  for (const key of PURPOSE_KEYS) next[key] = copyFate(restored[key]);
  next.meta = { ...copyFate(restored.meta), purpose, depth: draft.meta.depth };
  next.lastStep = 'setup'; next.updatedAt = Date.now();
  return next;
}

export function createFateDraft({ record, answers = record?.answers || {}, purpose = 'communication', title = '', context = '', preferences = {}, id, targetId = '', scope, sessionId } = {}) {
  if (record?.fateDraft?.schemaVersion > 1) throw new Error('This FATE draft was made by a newer version of Larpcraft. Update the app before editing it.');
  let draft = record?.fateDraft ? copyFate(record.fateDraft) : {
    schemaVersion: 1, id: id || `FATE-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
    createdAt: Date.now(), lastStep: 'setup', title: record?.title || title, context: record?.context || context,
    meta: { purpose: record?.focus || purpose, depth: preferences.lastDepth || 'simple', mode: 'build', influencers: [], targets: [], source: '', otherEntities: '', outcome: '', outcomeText: '', intensity: null, weighting: ['F', 'A', 'T', 'E'], locks: {} },
    focus: { anchor: '' }, authority: { anchor: '' }, tribe: { anchor: '' }, emotion: { anchor: '' }, notes: {},
    safety: { cap: 4, optIn: false, note: '', debrief: false, debriefNote: '' },
    output: { format: preferences.lastOutputFormat || (purpose === 'character' ? 'Story paragraph' : purpose === 'scene' ? 'Scene beat' : 'Story paragraph'), tone: 'Plain', length: 'Short paragraph' },
    fieldMeta: {}, dismissedWarnings: [], workspace: { targetId, scope, scopeKey: fateScopeKey(scope), sessionId: sessionId || record?.sessionId || null },
  };
  // A saved template may be inserted several times. Each editing session needs
  // its own unfinished draft slot; only existing project drafts retain IDs.
  if (record?.fateDraft) draft.id = id || `FATE-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  for (const fields of Object.values(FATE_FIELDS)) for (const field of fields) {
    if (getFate(draft, field.path) === undefined) draft = setFate(draft, field.path, ['multi', 'curve'].includes(field.control) ? [] : field.control === 'board' ? {} : null);
  }
  for (const step of FATE_STEPS.filter(step => step.section)) {
    const key = `phase:${step.key}`;
    if (answers[key] !== undefined) {
      draft[step.section].anchor = answers[key];
      if (!record?.fateDraft) {
        draft.notes[step.key] = answers[key];
        draft.fieldMeta[`${step.section}.anchor`] = { source: 'migrated' };
      }
    }
    if (answers[`fate:notes:${step.key}`] !== undefined) draft.notes[step.key] = answers[`fate:notes:${step.key}`];
  }
  for (const key of ['resistance', 'response']) if (answers[`fate:${key}`] !== undefined) draft.emotion[key] = answers[`fate:${key}`];
  draft = normalizeFateDraft(draft);
  for (const [key, answer] of Object.entries(answers)) if (key.startsWith('fate:detail:') && /^(focus|authority|tribe|emotion)\.details\.k-[^.]+\.k-[^.]+$/.test(key.slice(12))) draft = setFate(draft, key.slice(12), answer);
  for (const pillar of ['F', 'A', 'T', 'E']) if (answers[`fate:words:${pillar}`] !== undefined) draft.communication.lines[pillar] = answers[`fate:words:${pillar}`];
  if (answers['fate:reply'] !== undefined) draft.communication.listenerReply = answers['fate:reply'];
  draft.meta.purpose = NARRATIVE_FOCUSES[draft.meta.purpose] ? draft.meta.purpose : 'communication';
  draft.workspace = { ...draft.workspace, ...(record ? { sessionId: record.sessionId || null, sourceTitle: record.title } : {}), ...(scope ? { scope, scopeKey: fateScopeKey(scope) } : {}), ...(targetId ? { targetId } : {}) };
  return normalizeFateDraft(draft);
}

export function fateSessionRecord(target, workspace) {
  return [...(target?.narrativeWizardHistory || []), ...(target?.narrativeWizard ? [target.narrativeWizard] : [])].find(record => record.sourceId === 'fate' && (
    workspace.sessionId ? record.sessionId === workspace.sessionId : !record.sessionId && workspace.sourceTitle && record.title === workspace.sourceTitle
  ));
}

export const FATE_INHERITANCE_RULES = [
  { id: 'threat-reaction', path: 'emotion.direction', dependencies: ['focus.hooks'], from: 'Focus', reason: 'You included a possible threat.', when: d => d.focus.hooks.includes('A possible threat') && !d.focus.hooks.includes('Something worth gaining'), value: () => 'Pull away' },
  { id: 'reward-reaction', path: 'emotion.direction', dependencies: ['focus.hooks'], from: 'Focus', reason: 'You included something worth gaining.', when: d => d.focus.hooks.includes('Something worth gaining') && !d.focus.hooks.includes('A possible threat'), value: () => 'Move toward it' },
  { id: 'mixed-reaction', path: 'emotion.direction', dependencies: ['focus.hooks'], from: 'Focus', reason: 'You included both threat and reward.', when: d => d.focus.hooks.includes('Something worth gaining') && d.focus.hooks.includes('A possible threat'), value: () => 'Both impulses conflict' },
  { id: 'exclusion-belonging', path: 'tribe.pull', dependencies: ['focus.threatTypes'], from: 'Focus', reason: 'You included exclusion as a possible loss.', when: d => d.focus.threatTypes.includes('Exclusion'), value: () => 'Exclusion is threatened' },
  { id: 'exclusion-trigger', path: 'emotion.triggers', dependencies: ['focus.threatTypes'], from: 'Focus', reason: 'Exclusion is part of the situation.', when: d => d.focus.threatTypes.includes('Exclusion'), value: () => ['Being excluded'] },
  { id: 'danger-trigger', path: 'emotion.triggers', dependencies: ['focus.threatTypes'], from: 'Focus', reason: 'You included possible injury.', when: d => d.focus.threatTypes.includes('Injury'), value: () => ['Danger'] },
  { id: 'scarcity-trigger', path: 'emotion.triggers', dependencies: ['focus.threatTypes'], from: 'Focus', reason: 'Resources may run short.', when: d => d.focus.threatTypes.includes('Scarcity'), value: () => ['Scarcity'] },
  { id: 'punishment-trigger', path: 'emotion.triggers', dependencies: ['focus.threatTypes'], from: 'Focus', reason: 'You included punishment as a possible loss.', when: d => d.focus.threatTypes.includes('Punishment'), value: () => ['Defying authority'] },
  { id: 'break-reaction', path: 'emotion.action', dependencies: ['focus.patternBreak'], from: 'Focus', reason: 'You are interrupting an expected routine.', when: d => d.focus.patternBreak === true, value: () => 'It is interrupted' },
  { id: 'social-enforcement', path: 'tribe.scriptElements', dependencies: ['authority.cost'], from: 'Authority', reason: 'Defiance risks social standing.', when: d => d.authority.cost === 2, value: () => ['Pressuring people to conform'] },
  { id: 'attention-intensity', path: 'focus.capture', dependencies: ['meta.intensity'], from: 'Setup', reason: 'Match the intended scene intensity as a starting point.', when: d => d.meta.intensity !== null, value: d => d.meta.intensity - 1 },
  { id: 'feeling-intensity', path: 'emotion.intensity', dependencies: ['meta.intensity'], from: 'Setup', reason: 'Match the intended scene intensity as a starting point.', when: d => d.meta.intensity !== null, value: d => d.meta.intensity - 1 },
];
const CONTEXT_DEPENDENCIES = {
  'authority.anchor': ['focus.anchor', 'focus.hooks', 'focus.channels', 'focus.details', 'meta.influencers'],
  'tribe.anchor': ['focus.anchor', 'authority.anchor', 'authority.source', 'authority.details'],
  'emotion.anchor': ['focus.anchor', 'authority.anchor', 'tribe.anchor', 'tribe.groups', 'tribe.details'],
  'emotion.response': ['focus.anchor', 'authority.anchor', 'tribe.anchor', 'emotion.anchor', 'emotion.resistance'],
};
const dependenciesFor = path => [...new Set([...FATE_INHERITANCE_RULES.filter(rule => rule.path === path).flatMap(rule => rule.dependencies), ...(CONTEXT_DEPENDENCIES[path] || []), ...(path.startsWith('communication.lines.') ? ['communication.listener', 'communication.profile', 'focus.anchor', 'authority.anchor', 'tribe.anchor', 'emotion.anchor'] : [])])];
const snapshot = (draft, paths) => Object.fromEntries(paths.map(path => [path, copyFate(getFate(draft, path) ?? null)]));
export function fateSuggestions(draft, pillar) {
  return FATE_INHERITANCE_RULES.filter(rule => !(draft.meta.purpose === 'character' && ['emotion.direction', 'emotion.action'].includes(rule.path)) && (!pillar || fatePillarFor(rule.path) === pillar) && !draft.meta.locks[fatePillarFor(rule.path)] && rule.when(draft))
    .map(rule => {
      const value = rule.value(draft);
      return { ...rule, proposed: Array.isArray(value) ? [...new Set([...(getFate(draft, rule.path) || []), ...value])] : value };
    }).filter(rule => !same(getFate(draft, rule.path), rule.proposed));
}
export function editFate(draft, path, value, source = 'user', rule) {
  if (path === 'meta.purpose') return switchFatePurpose(draft, value);
  const pillar = fatePillarFor(path);
  if (pillar && draft.meta.locks[pillar] && !path.startsWith('meta.locks.')) return draft;
  let next = setFate(draft, path, path === 'authority.source' && !Array.isArray(value) ? value ? [value] : [] : value);
  // Output prose edits are intentional overrides; keep them across later changes.
  if (path !== 'output.text' && draft.output.text !== undefined) next.output.text = draft.output.text;
  next.fieldMeta[path] = { source, ...(rule ? { ruleId: rule.id } : {}), basedOn: snapshot(next, dependenciesFor(path)), updatedAt: Date.now() };
  for (const [field, meta] of Object.entries(next.fieldMeta)) {
    if (field === path || !nonempty(getFate(next, field))) continue;
    if (Object.entries(meta.basedOn || {}).some(([key, before]) => !same(getFate(next, key) ?? null, before))) meta.stale = true;
  }
  next.updatedAt = Date.now();
  return next;
}
export function acceptFateSuggestion(draft, suggestion) { return editFate(draft, suggestion.path, suggestion.proposed, 'suggested', suggestion); }
export function keepFateField(draft, path) {
  const next = copyFate(draft);
  next.fieldMeta[path] = { ...next.fieldMeta[path], stale: false, basedOn: snapshot(next, dependenciesFor(path)) };
  return next;
}

export function resolveFateTemplate(text, draft, entities = []) {
  return text.replace(/\{([^{}|]+)(?:\|([^{}]*))?\}/g, (_, path, fallback = '') => {
    let value = getFate(draft, path);
    if (path === 'meta.purposeLabel') value = NARRATIVE_FOCUSES[draft.meta.purpose]?.label;
    if (path === 'meta.targetsLabel') value = draft.meta.purpose === 'communication' && draft.communication?.listener ? draft.communication.listener : draft.meta.targets.map(id => entities.find(entity => entity.key === id)?.name).filter(Boolean);
    if (Array.isArray(value)) value = naturalList(value.map(String));
    if (typeof value === 'object') value = '';
    value = tidy(value) || fallback;
    return value.length > 75 ? `${value.slice(0, 72)}…` : value;
  });
}
const finish = value => { const text = tidy(value); return text ? text[0].toUpperCase() + text.slice(1) + (/[.!?…][”"]?$/.test(text) ? '' : '.') : ''; };
const lower = value => tidy(value).replace(/[.!]+$/, '').replace(/^(The|An?|They|Their|He|His|She|Her|It|This|That|To|Someone|People)\b/, word => word.toLowerCase());
export function summarizeFateStep(draft, pillar) {
  const step = FATE_STEPS.find(item => item.key === pillar);
  if (!step?.section) return draft.context || draft.meta.outcomeText || '';
  const value = draft[step.section];
  return [finish(value.anchor), ...fateStepChoiceText(draft, pillar)].filter(Boolean).join(' ');
}
export function fateStepChoiceText(draft, pillar) {
  const value = draft[FATE_STEPS.find(step => step.key === pillar).section], lines = [];
  const add = text => { if (text) lines.push(finish(text)); };
  if (pillar === 'F') {
    if (value.hooks.length) add(`Attention is drawn by ${naturalList(value.hooks).toLowerCase()}`);
    if (value.channels.length) add(`Attention arrives through ${naturalList(value.channels).toLowerCase()}`);
  }
  if (pillar === 'A' && fateSelected(draft, 'authority.source').length) add(`${draft.meta.purpose === 'character' ? 'They place trust in' : 'The message carries weight through'} ${naturalList(fateSelected(draft, 'authority.source')).toLowerCase()}`);
  if (pillar === 'T') {
    if (value.pull) add(value.pull === 'Both' ? 'Belonging brings both welcome and the risk of exclusion' : value.pull === 'Neither is central' ? 'Belonging is not central here' : value.pull);
    if (value.groups?.length) add(`Their important groups and relationships include ${naturalList(value.groups)}`);
    if (value.statusStakes.length) add(`Belonging involves ${naturalList(value.statusStakes).toLowerCase()}`);
    add(value.loyalties);
  }
  if (pillar === 'E') {
    if (value.recurring?.length) add(`Their recurring feelings include ${naturalList(value.recurring).toLowerCase()}`);
    if (value.primary) add(draft.meta.purpose === 'character' ? `One common feeling is ${value.primary.toLowerCase()}` : `${value.primary} is central to the moment`);
    for (const pattern of value.patterns || []) {
      const parts = [pattern.situation && `When ${lower(tidy(pattern.situation).replace(/^(when|if)\s+/i, ''))}`, pattern.feelings?.length && `they feel ${naturalList(pattern.feelings).toLowerCase()}`].filter(Boolean);
      if (parts.length) add(parts.join(', '));
      if (pattern.response) {
        const response = lower(pattern.response);
        if (/^(he|she|they|it|their|his|her)\b/i.test(response)) add(response);
        else add(/^\w+ing\b/i.test(response) ? `Their usual response is ${response[0].toLowerCase()}${response.slice(1)}` : `They tend to ${response[0].toLowerCase()}${response.slice(1)}`);
      }
      if (pattern.exception) add(`This can change when ${lower(tidy(pattern.exception).replace(/^when\s+/i, ''))}`);
    }
  }
  for (const item of fateChoiceDetails(draft, pillar)) if (tidy(item.text)) add(item.text);
  return [...new Set(lines)];
}
export function addFateEmotionPattern(draft) {
  return editFate(draft, 'emotion.patterns', [...(draft.emotion.patterns || []), { id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, situation: '', feelings: [], response: '', exception: '' }]);
}
export function fateDialogue(draft) {
  const conversation = draft.communication || {}, speaker = tidy(conversation.speaker) || P.blankSpeaker, listener = tidy(conversation.listener) || P.blankListener;
  const lines = [], used = new Set();
  for (const pillar of ['F', 'A', 'T', 'E']) {
    const directWords = tidy(conversation.lines?.[pillar]);
    const spokenDetail = pillar === 'F' && fateSelected(draft, 'focus.channels').includes('Spoken words') ? tidy(getFate(draft, fateDetailPath('focus.channels', 'Spoken words'))) : '';
    const words = directWords || spokenDetail;
    if (words && !used.has(words)) { lines.push(`${speaker}: “${words.replace(/^[“"]|[”"]$/g, '')}”`); used.add(words); }
  }
  if (tidy(conversation.listenerReply)) lines.push(`${listener}: “${tidy(conversation.listenerReply).replace(/^[“"]|[”"]$/g, '')}”`);
  return lines.join('\n\n');
}
export function fateDesignNotes(draft) {
  return [draft.context, draft.communication?.relationship, draft.communication?.goal, ...['F', 'A', 'T', 'E'].map(pillar => summarizeFateStep(draft, pillar))].filter(Boolean).join('\n\n');
}
export function linkFateListenerProfile(draft, model) {
  const source = createFateDraft({ record: model.record });
  let next = editFate(draft, 'communication.profile', { key: model.key, name: model.entity.name, signature: fateProfileSignature(model), summary: model.record.summary || '', summaries: Object.fromEntries(['F', 'A', 'T', 'E'].map(pillar => [pillar, summarizeFateStep(source, pillar)])) });
  next = editFate(next, 'communication.listener', model.entity.name);
  return editFate(next, 'communication.listenerRef', model.entity.key);
}
export function fateProfileSignature(model) {
  // Compare the authored profile, not saved purpose banks or linked-source
  // signatures, which could otherwise nest repeatedly as profiles are reused.
  return JSON.stringify({ name: model.entity.name, title: model.record.title, summary: model.record.summary, answers: model.record.answers, fields: model.record.fateDraft ? ['focus', 'authority', 'tribe', 'emotion'].map(section => model.record.fateDraft[section]) : null });
}
export function fateProfileContext(draft, pillar) {
  const profile = draft.communication?.profile;
  return profile ? { summary: profile.summaries[pillar] || profile.summary || '', question: P.profileQuestions[pillar] } : null;
}
export function fateCompletion(draft, pillar) {
  const step = FATE_STEPS.find(item => item.key === pillar);
  const keys = { F: draft.meta.purpose === 'character' ? ['focus.anchor', 'focus.hooks'] : ['focus.anchor', 'focus.hooks', 'focus.channels'], A: ['authority.anchor', 'authority.source'], T: ['tribe.anchor', 'tribe.pull'], E: draft.meta.purpose === 'character' ? ['emotion.anchor', 'emotion.recurring', 'emotion.patterns'] : ['emotion.anchor', 'emotion.primary', 'emotion.resistance'] }[pillar] || [];
  const filled = keys.filter(key => key === 'emotion.patterns' ? draft.emotion.patterns?.some(pattern => pattern.situation || pattern.response || pattern.feelings.length) : nonempty(getFate(draft, key))).length;
  return { filled, total: keys.length, ratio: keys.length ? filled / keys.length : 0, anchor: !!draft[step?.section]?.anchor?.trim() };
}
export function fateChecks(draft) {
  const rows = [];
  for (const pillar of ['F', 'A', 'T', 'E']) if ((draft.meta.mode === 'diagnose' || !['character', 'communication'].includes(draft.meta.purpose)) && !fateCompletion(draft, pillar).anchor) rows.push({ id: `missing:${pillar}`, pillar, message: FATE_WARNINGS.missing.replace('{pillar}', FATE_STEPS.find(step => step.key === pillar).name), suggestion: FATE_GAP_SUGGESTIONS[pillar] });
  const add = (id, pillar) => rows.push({ id, pillar, message: FATE_WARNINGS[id] });
  if (draft.focus.noise.length > 3) add('noise', 'F');
  if (draft.authority.cost >= 2 && !draft.tribe.scriptElements.length && !draft.meta.influencers.length) add('enforcer', 'T');
  if (draft.emotion.action === 'It is interrupted' && !draft.focus.patternBreak) add('interrupted', 'F');
  if (draft.authority.basis.includes('Belief that they have power') && !draft.authority.challengeable) add('perceived', 'A');
  if (draft.meta.weighting[0] !== 'F') add('emphasis', 'F');
  if (draft.authority.cost > draft.safety.cap || draft.tribe.enforcement?.[1] > draft.safety.cap) add('cap', 'A');
  if (Object.values(draft.fieldMeta).some(meta => meta.stale)) add('stale', 'E');
  return rows.filter(row => !draft.dismissedWarnings.includes(row.id));
}

export function fateEntities(game) {
  const result = [];
  const walk = (nodes, coll, parents = []) => {
    for (const node of Object.values(nodes || {})) {
      const path = [...parents, node.id], name = node.title || node.name;
      if (name) result.push({ key: JSON.stringify([coll, ...path]), name, type: node.kind || coll, description: node.description || node.body || node.notes || '', ref: { coll, path } });
      if (node.sub) walk(node.sub.nodes, coll, path);
    }
  };
  for (const coll of ['nodes', 'masterNodes', 'locations', 'items', 'teams', 'players']) walk(game[coll], coll);
  return result;
}
export function fateSavedModels(game) {
  const result = [];
  for (const entity of fateEntities(game)) {
    if (!['nodes', 'masterNodes'].includes(entity.ref.coll)) continue;
    let node = game[entity.ref.coll]?.[entity.ref.path[0]];
    for (const id of entity.ref.path.slice(1)) node = node?.sub?.nodes?.[id];
    const records = [...(node?.narrativeWizardHistory || []), ...(node?.narrativeWizard ? [node.narrativeWizard] : [])];
    for (const record of new Map(records.filter(record => record.sourceId === 'fate').map(record => [record.sessionId || record.resultId || record.title, record])).values()) result.push({ key: `${entity.key}:${record.sessionId || record.title}`, entity, record });
  }
  return result;
}
export function fateQuestions(draft) {
  const purpose = draft.meta.purpose;
  return [
    ...['F', 'A', 'T', 'E'].map((pillar, index) => ({ key: `phase:${pillar}`, prompt: FATE_PURPOSE_LABELS[purpose][index] })),
    { key: 'fate:resistance', prompt: 'What could make them resist or react differently?' },
    { key: 'fate:response', prompt: 'What action or line of dialogue could show their response?' },
    ...['F', 'A', 'T', 'E'].map(pillar => ({ key: `fate:notes:${pillar}`, prompt: `${FATE_STEPS.find(step => step.key === pillar).name}: designer notes` })),
    ...['F', 'A', 'T', 'E'].flatMap(pillar => fateChoiceDetails(draft, pillar).filter(item => tidy(item.text)).map(item => ({ key: `fate:detail:${item.path}`, prompt: `${item.option}: ${fateDetailQuestion(draft, item.field.path, item.option)}` }))),
    ...(purpose === 'communication' ? [...['F', 'A', 'T', 'E'].map(pillar => ({ key: `fate:words:${pillar}`, prompt: `${FATE_STEPS.find(step => step.key === pillar).name}: ${P.words}` })), { key: 'fate:reply', prompt: P.listenerReply }] : []),
  ];
}
export function fateAnswers(draft) {
  return Object.fromEntries([
    ...['F', 'A', 'T', 'E'].map(pillar => [`phase:${pillar}`, draft[FATE_STEPS.find(step => step.key === pillar).section].anchor]),
    ['fate:resistance', draft.emotion.resistance || ''], ['fate:response', draft.emotion.response || ''],
    ...['F', 'A', 'T', 'E'].map(pillar => [`fate:notes:${pillar}`, draft.notes[pillar] || '']),
    ...['F', 'A', 'T', 'E'].flatMap(pillar => fateChoiceDetails(draft, pillar).map(item => [`fate:detail:${item.path}`, item.text])),
    ...['F', 'A', 'T', 'E'].map(pillar => [`fate:words:${pillar}`, draft.communication?.lines?.[pillar] || '']),
    ['fate:reply', draft.communication?.listenerReply || ''],
  ]);
}

export function fateOutput(draft) {
  if (draft.output.text !== undefined) return draft.output.text;
  if (draft.meta.mode === 'diagnose') return ['Review of the recorded situation', ...['F', 'A', 'T', 'E'].map(pillar => {
    const step = FATE_STEPS.find(item => item.key === pillar), progress = fateCompletion(draft, pillar);
    return `${step.name}: ${progress.filled}/${progress.total} core details recorded. ${summarizeFateStep(draft, pillar) || FATE_GAP_SUGGESTIONS[pillar]}`;
  }), ...fateChecks(draft).map(row => `${row.message} ${row.suggestion || ''}`)].join('\n\n');
  if (draft.meta.purpose === 'communication' && !['Organizer notes', 'Player briefing', 'Group profile'].includes(draft.output.format)) return fateDialogue(draft);
  const lines = [], add = value => { const text = finish(value); if (text && !lines.includes(text)) lines.push(text); };
  add(draft.context);
  const character = draft.meta.purpose === 'character';
  const fragments = character
    ? ['Their attention keeps returning to', 'What carries weight for them is', 'Their sense of belonging centres on', 'Their feelings come into the open through']
    : ['Attention gathers around', 'What gives the moment weight is', 'Belonging matters through', 'The feeling becomes real through'];
  for (const [index, pillar] of ['F', 'A', 'T', 'E'].entries()) {
    const step = FATE_STEPS.find(item => item.key === pillar), anchor = tidy(draft[step.section].anchor);
    // Keep complete authored sentences; use a connective for short fragments.
    if (anchor) add(/^(they|he|she|it|the |a |an |[“"])/i.test(anchor) && /[.!?]$/.test(anchor) ? anchor : `${fragments[index]} ${lower(anchor)}`);
    for (const detail of fateStepChoiceText(draft, pillar)) add(detail);
  }
  if (draft.emotion.primary && draft.emotion.anchor) add(`${draft.emotion.primary} colours the moment`);
  if (draft.emotion.direction) add({ 'Move toward it': character ? 'The feeling draws them closer' : 'The moment offers a reason to move closer', 'Pull away': character ? 'Their first impulse is to pull away' : 'The moment offers a reason to pull away', 'Both impulses conflict': 'The urge to move closer clashes with the urge to pull away', 'It depends': 'Their response depends on how the situation unfolds' }[draft.emotion.direction]);
  if (draft.emotion.resistance) add(`Yet the response could change: ${lower(draft.emotion.resistance)}`);
  add(draft.emotion.response);
  if (draft.meta.outcomeText) add(`What is hoped for is ${lower(draft.meta.outcomeText)}`);
  else if (draft.meta.outcome) add(`The intended outcome is for those involved to ${draft.meta.outcome.toLowerCase()}`);
  const tone = { Heroic: 'The moment asks for courage', Grim: 'The consequences weigh heavily on the moment', Intimate: 'The moment is carried through personal connections', Uncanny: 'Familiar details take on an unsettling quality', Comic: 'The moment can be played with humour' }[draft.output.tone];
  if (tone) add(tone);
  if (draft.output.format === 'Organizer notes' || draft.output.length === 'Detailed outline') {
    if (draft.meta.purpose === 'communication' && fateDialogue(draft)) lines.unshift(fateDialogue(draft));
    for (const pillar of ['F', 'A', 'T', 'E']) {
      const step = FATE_STEPS.find(item => item.key === pillar);
      const details = FATE_FIELDS[pillar].filter(field => !['curve', 'board'].includes(field.control)).flatMap(field => {
        const value = getFate(draft, field.path);
        if (!nonempty(value)) return [];
        return [`${field.label}: ${Array.isArray(value) ? naturalList(value.map(String)) : typeof value === 'boolean' ? 'Yes' : field.control === 'scale' ? field.options[value] : value}`];
      });
      if (draft.notes[pillar]) details.push(draft.notes[pillar]);
      if (details.length) lines.push(`${step.name} — ${details.join('; ')}`);
    }
    if (draft.safety.optIn) lines.push(`Opt-in / safety mechanic: ${draft.safety.note || 'To be agreed with the group.'}`);
    if (draft.safety.debrief) lines.push(`Debrief: ${draft.safety.debriefNote || 'Discuss how the scene worked and how people experienced it.'}`);
  }
  if (draft.output.length === 'Bullets') return lines.map(line => `• ${line}`).join('\n');
  if (draft.output.format === 'Speech outline') return lines.map((line, i) => `${i + 1}. ${line}`).join('\n\n');
  if (draft.output.format === 'Player briefing') return [draft.title, finish(draft.context), finish(draft.focus.anchor), finish(draft.authority.anchor), finish(draft.meta.outcomeText)].filter(Boolean).join('\n\n');
  if (draft.output.format === 'Group profile') return `${draft.title ? `${draft.title}. ` : ''}${lines.join(' ')}`;
  return lines.join(draft.output.length === 'Detailed outline' || draft.output.format === 'Organizer notes' ? '\n\n' : ' ');
}
export function fateBanner(draft, pillar, entities) {
  if (draft.meta.purpose === 'character') return { F: 'Describe what this person keeps noticing across different situations.', A: `Their attention: ${summarizeFateStep(draft, 'F') || 'not described yet'} Who earns their trust?`, T: `What they trust: ${summarizeFateStep(draft, 'A') || 'not described yet'} Where do they feel at home?`, E: `Their belonging: ${summarizeFateStep(draft, 'T') || 'not described yet'} What feelings and reactions recur?` }[pillar];
  return resolveFateTemplate(FATE_BANNERS[pillar] || '', draft, entities);
}

export function orderFateOptions(field, preferences = {}) {
  const usage = preferences.chipUsage?.[field.path] || {};
  return [...new Set([...(field.options || []), ...(preferences.customVocabulary?.[field.path] || [])])].sort((a, b) => (usage[b] || 0) - (usage[a] || 0));
}
export function rememberFateOption(preferences, path, value, custom = false) {
  return { ...preferences, chipUsage: { ...preferences.chipUsage, [path]: { ...preferences.chipUsage?.[path], [value]: (preferences.chipUsage?.[path]?.[value] || 0) + 1 } }, customVocabulary: { ...preferences.customVocabulary, ...(custom ? { [path]: [...new Set([...(preferences.customVocabulary?.[path] || []), value])] } : {}) } };
}
