import { KOLB_MODES, KOLB_FIELDS, KOLB_LABELS, KOLB_BRANCHES, KOLB_COPY as C } from '../data/kolbWizard.js';
import { NARRATIVE_FOCUSES } from '../data/narrativeGuidance.js';
import { copyDraft, getPath, setPath, naturalList, wizardScopeKey } from './storyWizardCore.js';

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const text = value => typeof value === 'string' ? value.trim() : '';
const tidy = value => text(value).replace(/\s+/g, ' ');
const present = value => Array.isArray(value) ? value.length > 0 : value !== '' && value !== null && value !== undefined && value !== false;
const uuid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const sentence = value => { const t = tidy(value); return t ? t[0].toUpperCase() + t.slice(1) + (/[.!?…][”"]?$/.test(t) ? '' : '.') : ''; };
const clause = value => tidy(value).replace(/[.!]+$/, '').replace(/^(The|An?|They|Their|He|His|She|Her|It|This|That|To|Someone|People|Strangers|Everyone|Nobody|Some|All|Every|There|Accepting|Kindness)\b/, word => word.toLowerCase());
const recordedBranch = (turn, branch) => turn.ae.observed === branch && turn.ae.branches[branch]?.enabled && text(turn.ae.branches[branch].text);
export const kolbMode = key => KOLB_MODES.find(mode => mode.key === key);
export function kolbFieldLabel(path) {
  const info = kolbPathInfo(path);
  if (!info) return C.context;
  const local = path.replace(/^turns\.\d+\./, '');
  const field = KOLB_FIELDS[info.mode].find(field => field.path === local);
  if (field) return field.label;
  if (local.endsWith('.anchor')) return kolbMode(info.mode).name;
  if (local.startsWith('ro.observations')) return C.observations;
  if (local === 'ac.groundedIn') return C.ground;
  if (local.startsWith('ae.branches.')) return `${C.branches}: ${KOLB_BRANCHES.find(branch => local.includes(`.${branch.key}.`))?.name || C.resultText}`;
  return kolbMode(info.mode).name;
}
export const kolbOrder = (entry = 'CE') => { const index = Math.max(0, KOLB_MODES.findIndex(mode => mode.key === entry)); return [...KOLB_MODES.slice(index), ...KOLB_MODES.slice(0, index)]; };

export function makeKolbTurn() {
  let turn = { ce: { anchor: '' }, ro: { anchor: '', observations: [] }, ac: { anchor: '', groundedIn: [] }, ae: { anchor: '', branches: Object.fromEntries(KOLB_BRANCHES.map(branch => [branch.key, { enabled: false, text: '', consequence: '' }])), observed: null, seed: null }, change: { before: '', after: '', behaviour: '' }, durations: {}, act: '', extras: {} };
  for (const fields of Object.values(KOLB_FIELDS)) for (const field of fields) turn = setPath(turn, field.path, field.control === 'multi' ? [] : null);
  return turn;
}

export function createKolbDraft({ record, answers = record?.answers || {}, preferences = {}, purpose = 'learning', title = '', context = '', targetId = '', scope, id } = {}) {
  if (record?.kolbDraft?.schemaVersion > 1) throw new Error('This Kolb draft was made by a newer version of Larpcraft. Update the app before editing it.');
  let draft = record?.kolbDraft ? copyDraft(record.kolbDraft) : {
    schemaVersion: 1, id: id || `KOLB-${uuid()}`, createdAt: Date.now(), title: record?.title || title, context: record?.context || context,
    meta: { purpose: record?.focus || purpose, depth: preferences.lastDepth || 'simple', mode: 'build', entry: preferences.lastEntry || 'CE', learners: [], source: '', otherLearners: '', target: '', targetText: '', scope: null, habit: null, identity: null, intent: null, audience: [], presentation: [] },
    lastStep: { turn: 0, step: 'setup' }, turns: [makeKolbTurn()], notes: {}, locks: {}, fieldMeta: {}, dismissed: [],
    safety: { cap: 4, failureFraming: false, debrief: false, note: '' },
    output: { format: preferences.lastOutputFormat || (purpose === 'character' ? 'Character growth arc' : 'Story paragraph'), tone: 'Plain', length: 'Short paragraph' },
    workspace: { targetId, scope, scopeKey: wizardScopeKey(scope), sessionId: record?.sessionId || null, sourceTitle: record?.title },
  };
  if (record?.kolbDraft) draft.id = id || `KOLB-${uuid()}`;
  draft.meta.purpose = NARRATIVE_FOCUSES[draft.meta.purpose] ? draft.meta.purpose : 'learning';
  for (const [index, turn] of draft.turns.entries()) {
    for (const [modeIndex, mode] of KOLB_MODES.entries()) {
      for (const field of KOLB_FIELDS[mode.key]) if (getPath(turn, field.path) === undefined) draft = setPath(draft, `turns.${index}.${field.path}`, field.control === 'multi' ? [] : null);
      const key = index === 0 ? `phase:${mode.key}` : `kolb:${index}:${mode.key}`;
      const value = answers[key] ?? (index === 0 ? answers[`phase:${modeIndex + 1}`] : undefined);
      if (value !== undefined) {
        draft.turns[index][mode.section].anchor = value;
        if (!record?.kolbDraft) { draft.notes[`${index}:${mode.key}`] = value; draft.fieldMeta[`turns.${index}.${mode.section}.anchor`] = { source: 'migrated' }; }
      }
      if (answers[`kolb:notes:${index}:${mode.key}`] !== undefined) draft.notes[`${index}:${mode.key}`] = answers[`kolb:notes:${index}:${mode.key}`];
    }
    for (const part of ['before', 'after', 'behaviour']) if (answers[`kolb:change:${index}:${part}`] !== undefined) draft.turns[index].change[part] = answers[`kolb:change:${index}:${part}`];
    if (answers[`kolb:prediction:${index}`] !== undefined) draft.turns[index].ac.prediction = answers[`kolb:prediction:${index}`];
  }
  draft.workspace = { ...draft.workspace, ...(record ? { sessionId: record.sessionId || null, sourceTitle: record.title } : {}), ...(targetId ? { targetId } : {}), ...(scope ? { scope, scopeKey: wizardScopeKey(scope) } : {}) };
  return draft;
}
export function kolbPathInfo(path) {
  const match = /^turns\.(\d+)\.(ce|ro|ac|ae)\./.exec(path);
  if (match) return { turn: Number(match[1]), mode: KOLB_MODES.find(mode => mode.section === match[2]).key };
  const note = /^notes\.(\d+):(CE|RO|AC|AE)$/.exec(path);
  return note ? { turn: Number(note[1]), mode: note[2] } : null;
}
const dependencyPaths = path => {
  const info = kolbPathInfo(path);
  if (!info) return [];
  const p = `turns.${info.turn}`;
  if (info.mode === 'RO') return [`${p}.ce.anchor`, `${p}.ce.outcome`, `${p}.ce.expected`, `${p}.ce.emotionIntensity`];
  if (info.mode === 'AC') return [`${p}.ro.anchor`, `${p}.ro.observations`, `${p}.ro.notice`];
  if (info.mode === 'AE') return [`${p}.ac.anchor`, `${p}.ac.prediction`, `${p}.ac.confidence`];
  return [];
};
const snapshot = (draft, paths) => Object.fromEntries(paths.map(path => [path, copyDraft(getPath(draft, path) ?? null)]));
function markKolbStale(draft) {
  for (const [path, meta] of Object.entries(draft.fieldMeta)) {
    if (!present(getPath(draft, path))) continue;
    if (Object.entries(meta.basedOn || {}).some(([dependency, before]) => !same(getPath(draft, dependency), before))) meta.stale = true;
  }
  return draft;
}
export function editKolb(draft, path, value, options = {}) {
  if (path === 'meta.purpose' && !NARRATIVE_FOCUSES[value]) return draft;
  const info = kolbPathInfo(path);
  if (info && draft.locks[`${info.turn}:${info.mode}`]) return draft;
  let next = setPath(draft, path, value);
  next.fieldMeta[path] = { source: options.source || 'user', basedOn: snapshot(next, options.dependencies || dependencyPaths(path)), ...(options.link ? { link: options.link } : {}), ...(options.external ? { external: options.external } : {}), updatedAt: Date.now() };
  next.updatedAt = Date.now();
  return markKolbStale(next);
}
export function keepKolb(draft, path, externalValue) {
  const next = copyDraft(draft), meta = next.fieldMeta[path];
  meta.stale = false; meta.basedOn = snapshot(next, Object.keys(meta.basedOn || {}));
  if (meta.external && externalValue !== undefined) meta.external.value = externalValue;
  return next;
}

export function kolbEvidence(draft, index) {
  const turn = draft.turns[index];
  return [
    ...(text(turn.ro.anchor) ? [{ id: 'ro:anchor', text: turn.ro.anchor }] : []),
    ...(turn.ro.observations || []).filter(row => text(row.text)).map(row => ({ id: row.id, text: row.text })),
    ...turn.ro.notice.map(value => ({ id: `notice:${value}`, text: value })),
  ];
}
export function addKolbObservation(draft, index) {
  const rows = draft.turns[index].ro.observations;
  return rows.length >= 5 ? draft : editKolb(draft, `turns.${index}.ro.observations`, [...rows, { id: `obs-${uuid()}`, text: '' }]);
}
export function kolbSuggestions(draft, index, mode, models = []) {
  const turn = draft.turns[index], p = `turns.${index}`, rows = [];
  const add = (id, path, value, reason, dependencies) => {
    const info = kolbPathInfo(path);
    if (draft.locks[`${info.turn}:${info.mode}`]) return;
    const current = getPath(draft, path);
    const proposed = Array.isArray(value) ? [...new Set([...(current || []), ...value])] : value;
    if (!same(current, proposed)) rows.push({ id, path, proposed, reason, dependencies });
  };
  if (mode === 'RO') {
    if (['Failure', 'Mixed'].includes(turn.ce.outcome)) add('notice-failure', `${p}.ro.notice`, ['Mistakes', 'What did not happen'], 'The earlier attempt did not fully work.', [`${p}.ce.outcome`]);
    if (turn.ce.outcome === 'Success') add('notice-success', `${p}.ro.notice`, ['Patterns'], 'The earlier attempt worked; they could look for what helped.', [`${p}.ce.outcome`]);
    if (turn.ce.expected) add('notice-surprise', `${p}.ro.notice`, ['Surprises'], 'You described an expectation that could be challenged.', [`${p}.ce.expected`]);
    if (turn.ce.emotionIntensity >= 3) {
      add('notice-feeling', `${p}.ro.notice`, ['Feelings'], 'You described a strong feeling.', [`${p}.ce.emotionIntensity`]);
      add('pause-feeling', `${p}.ro.pause`, 'A short break', 'A pause could help them look back on that strong feeling.', [`${p}.ce.emotionIntensity`]);
    }
  }
  if (mode === 'AE') {
    if (turn.ac.prediction) add('prediction-result', `${p}.ae.branches.confirm.text`, turn.ac.prediction, 'Use the prediction as a possible supporting result, not a recorded fact.', [`${p}.ac.prediction`]);
    if (turn.ac.confidence >= 3) add('challenge-certainty', `${p}.ae.branches.refute.enabled`, true, 'You described strong certainty. A possible contradiction can make the test meaningful.', [`${p}.ac.confidence`]);
    const feedback = { 'Complete a task': 'Did it work?', 'Improve an approach': 'Change the approach or goal', 'Reconsider a larger purpose': 'Reconsider what matters' }[draft.meta.scope];
    if (feedback) add('feedback-scope', `${p}.ae.feedback`, feedback, 'This feedback question matches the change you want to explore.', ['meta.scope']);
  }
  for (const [path, meta] of Object.entries(draft.fieldMeta)) {
    const info = kolbPathInfo(path);
    if (!meta.stale || info?.turn !== index || info.mode !== mode || draft.locks[`${index}:${mode}`]) continue;
    if (meta.link) {
      const sourcePath = `turns.${meta.link.turn}.ae.branches.${meta.link.branch}.text`;
      if (draft.turns[meta.link.turn].ae.branches[meta.link.branch]?.enabled && text(getPath(draft, sourcePath))) add(`link:${path}`, path, getPath(draft, sourcePath), C.previousCycle, Object.keys(meta.basedOn || {}));
    }
    if (meta.external) {
      const model = models.find(model => model.key === meta.external.key), value = model && fateImportValue(model, meta.external.field);
      if (text(value)) rows.push({ id: `import:${path}`, path, proposed: value, reason: C.fate, external: { ...meta.external, value } });
    }
  }
  return rows;
}
export function acceptKolbSuggestion(draft, suggestion) {
  const original = draft.fieldMeta[suggestion.path];
  return editKolb(draft, suggestion.path, suggestion.proposed, { source: suggestion.external ? 'imported' : original?.link ? 'linked' : 'suggested', dependencies: suggestion.dependencies, link: original?.link, external: suggestion.external });
}

export function addKolbTurn(draft, branch) {
  if (draft.turns.length >= 4) return draft;
  const next = copyDraft(draft), previousIndex = draft.lastStep.turn, previous = draft.turns[previousIndex], index = next.turns.length;
  next.turns.push(makeKolbTurn());
  next.lastStep = { turn: index, step: 'CE' };
  if (branch && previous.ae.branches[branch]?.enabled && text(previous.ae.branches[branch].text)) {
    const path = `turns.${index}.ce.anchor`, source = `turns.${previousIndex}.ae.branches.${branch}.text`;
    next.turns[index].ce.anchor = previous.ae.branches[branch].text;
    next.fieldMeta[path] = { source: 'linked', link: { turn: previousIndex, branch }, basedOn: snapshot(next, [source, `turns.${previousIndex}.ae.observed`, `turns.${previousIndex}.ae.branches.${branch}.enabled`]) };
  }
  return next;
}
export function kolbChange(draft, index) {
  const turn = draft.turns[index];
  return { before: turn.change.before || (index ? draft.turns[index - 1].ac.anchor : ''), after: turn.change.after || turn.ac.anchor, behaviour: turn.change.behaviour || turn.ae.anchor };
}
export function kolbProgress(draft, index, mode) {
  const turn = draft.turns[index];
  const keys = { CE: ['ce.anchor', 'ce.types', 'ce.outcome'], RO: ['ro.anchor', 'ro.observations', 'ro.notice'], AC: ['ac.anchor', 'ac.groundedIn', 'ac.prediction'], AE: ['ae.anchor', 'ae.situation'] }[mode];
  return { filled: keys.filter(path => path === 'ro.observations' ? turn.ro.observations.some(row => text(row.text)) : present(getPath(turn, path))).length, total: keys.length, anchor: !!text(turn[kolbMode(mode).section].anchor) };
}
export function kolbChecks(draft) {
  const rows = [];
  for (const [index, turn] of draft.turns.entries()) {
    const add = (id, mode, message) => rows.push({ id: `${index}:${id}`, turn: index, mode, message });
    for (const mode of KOLB_MODES) if (!text(turn[mode.section].anchor)) add(`missing:${mode.key}`, mode.key, C.missing.replace('{mode}', mode.name).replace('{cycle}', String(index + 1)));
    if (text(turn.ac.anchor) && !turn.ac.groundedIn.length) add('grounded', 'AC', C.groundedCheck);
    if (turn.ac.groundedIn.some(id => !kolbEvidence(draft, index).some(row => row.id === id))) add('removed-evidence', 'AC', C.missingEvidence);
    if (text(turn.ae.anchor) && Object.values(turn.ae.branches).filter(branch => branch.enabled && text(branch.text)).length < 2) add('branches', 'AE', C.branchCheck);
    if (turn.ac.correctness === 'Mistaken' && !(turn.ae.branches.refute.enabled && text(turn.ae.branches.refute.text))) add('misconception', 'AE', C.misconceptionCheck);
    if (turn.ce.challenge >= 3 && turn.ce.support !== null && turn.ce.support <= 1) add('support', 'CE', C.supportCheck);
    if (turn.ce.relevance === 'Personally distant') add('relevance', 'CE', C.relevanceCheck);
    if (turn.ae.stakes > draft.safety.cap) add('cap', 'AE', C.capCheck);
    if (index > 0 && turn.ae.transfer === 0) add('transfer', 'AE', C.transferCheck);
    const durations = Object.values(turn.durations).filter(value => Number.isFinite(value) && value > 0);
    if (durations.length > 1 && Math.max(...durations) > Math.min(...durations) * 3) add('pacing', 'RO', C.pacingCheck);
  }
  return rows.filter(row => !draft.dismissed.includes(row.id));
}
export function resolveKolbTemplate(value, draft, entities = []) {
  const index = draft.lastStep.turn;
  const scope = { ...draft, ...draft.turns[index], prevTurn: draft.turns[index - 1], meta: { ...draft.meta, learnersLabel: naturalList(draft.meta.learners.map(key => entities.find(entity => entity.key === key)?.name).filter(Boolean)), purposeLabel: NARRATIVE_FOCUSES[draft.meta.purpose]?.label } };
  return value.replace(/\{([^{}|]+)(?:\|([^{}]*))?\}/g, (_, path, fallback = '') => {
    let result = getPath(scope, path.replace(/\[current\]/g, `.${index}`));
    if (Array.isArray(result)) result = naturalList(result.map(String));
    if (typeof result === 'object') result = '';
    const output = String(result ?? '').trim() || fallback;
    return output.length > 75 ? `${output.slice(0, 72)}…` : output;
  });
}
export function kolbBanner(draft, index, mode, entities) {
  const turn = draft.turns[index];
  const linked = draft.fieldMeta[`turns.${index}.ce.anchor`]?.link;
  if (mode === 'CE' && linked) return `${recordedBranch(draft.turns[linked.turn], linked.branch) ? C.observed : C.planned}: ${turn.ce.anchor}`;
  return resolveKolbTemplate({ CE: 'You are developing {meta.purposeLabel|a situation} with {meta.learnersLabel|the people involved}. What do they experience directly?', RO: 'The experience: “{ce.anchor|not described yet}”. Outcome: {ce.outcome|not recorded}. What might they notice afterward?', AC: 'Their reflection: “{ro.anchor|not described yet}”. Which observations support the idea they form?', AE: 'Their idea: “{ac.anchor|not described yet}”. Prediction: “{ac.prediction|not described yet}”. What could test it—and what might challenge it?' }[mode], { ...draft, lastStep: { ...draft.lastStep, turn: index } }, entities);
}
export function summarizeKolb(draft, index, mode) { return sentence(draft.turns[index][kolbMode(mode).section].anchor); }

export function fateImportValue(model, field) {
  if (field === 'experience') return model.record.fateDraft?.focus.anchor || model.record.answers?.['phase:F'] || '';
  return model.record.fateDraft?.emotion.primary || '';
}
export function importKolbFate(draft, index, model, field) {
  const value = fateImportValue(model, field);
  return value ? editKolb(draft, `turns.${index}.ce.${field === 'experience' ? 'anchor' : 'emotion'}`, value, { source: 'imported', external: { key: model.key, field, value } }) : draft;
}
export function refreshKolbImports(draft, models) {
  let next = draft;
  for (const [path, meta] of Object.entries(draft.fieldMeta)) {
    if (!meta.external) continue;
    const model = models.find(row => row.key === meta.external.key), value = model ? fateImportValue(model, meta.external.field) : null;
    if (!same(value, meta.external.value) && !meta.stale) { if (next === draft) next = copyDraft(draft); next.fieldMeta[path].stale = true; }
  }
  return next;
}
export function kolbQuestions(draft) {
  return draft.turns.flatMap((turn, index) => [
    ...KOLB_MODES.map((mode, i) => ({ key: index === 0 ? `phase:${mode.key}` : `kolb:${index}:${mode.key}`, prompt: `${index ? `${C.cycle} ${index + 1}: ` : ''}${KOLB_LABELS[draft.meta.purpose][i]}` })),
    ...KOLB_MODES.map(mode => ({ key: `kolb:notes:${index}:${mode.key}`, prompt: `${C.cycle} ${index + 1} · ${mode.name}: ${C.notes}` })),
    ...['before', 'after', 'behaviour'].map(part => ({ key: `kolb:change:${index}:${part}`, prompt: `${C.cycle} ${index + 1} · ${C[part]}` })),
    { key: `kolb:prediction:${index}`, prompt: `${C.cycle} ${index + 1}: ${KOLB_FIELDS.AC.find(field => field.path === 'ac.prediction').label}` },
  ]);
}
export function kolbAnswers(draft) {
  return Object.fromEntries(draft.turns.flatMap((turn, index) => [
    ...KOLB_MODES.map(mode => [index === 0 ? `phase:${mode.key}` : `kolb:${index}:${mode.key}`, turn[mode.section].anchor]),
    ...KOLB_MODES.map(mode => [`kolb:notes:${index}:${mode.key}`, draft.notes[`${index}:${mode.key}`] || '']),
    ...['before', 'after', 'behaviour'].map(part => [`kolb:change:${index}:${part}`, turn.change[part] || '']),
    [`kolb:prediction:${index}`, turn.ac.prediction || ''],
  ]));
}
export function kolbOutput(draft) {
  if (draft.output.text !== undefined) return draft.output.text;
  if (draft.meta.mode === 'diagnose') return [C.gaps, ...draft.turns.flatMap((turn, index) => KOLB_MODES.map(mode => { const progress = kolbProgress(draft, index, mode.key); return `${C.cycle} ${index + 1} · ${mode.name}: ${progress.filled}/${progress.total} ${C.progress.toLowerCase()}. ${summarizeKolb(draft, index, mode.key)}`; })), ...kolbChecks(draft).map(row => row.message)].join('\n\n');
  const paragraphs = [], intro = sentence(draft.context);
  if (intro) paragraphs.push(intro);
  for (const [index, turn] of draft.turns.entries()) {
    const lines = [], add = value => { const next = sentence(value); if (next && !lines.includes(next)) lines.push(next); };
    const change = kolbChange(draft, index), linked = draft.fieldMeta[`turns.${index}.ce.anchor`]?.link;
    const planned = linked && !recordedBranch(draft.turns[linked.turn], linked.branch);
    if (change.before) add(`They begin with an earlier belief or approach: ${clause(change.before)}`);
    if (turn.ce.anchor) add(planned ? `If ${clause(turn.ce.anchor)}, the next experience would begin there` : sentence(turn.ce.anchor));
    const reflectionIntro = { Heroic: 'Taking stock', Grim: 'On reflection', Intimate: 'Looking inward', Uncanny: 'Looking more closely', Comic: 'On a second look' }[draft.output.tone] || 'Looking back';
    if (turn.ro.anchor) add(`${reflectionIntro}, they notice ${clause(turn.ro.anchor)}`);
    if (turn.ac.anchor) add(`From this, they come to believe that ${clause(turn.ac.anchor)}`);
    if (turn.ae.anchor) add(`They put that idea to the test: ${clause(turn.ae.anchor)}`);
    const observed = turn.ae.branches[turn.ae.observed];
    if (observed?.enabled && text(observed.text)) add(`The recorded result is ${clause(observed.text)}`);
    if (turn.change.after && turn.change.after !== turn.ac.anchor) add(turn.change.after);
    if (turn.change.behaviour && turn.change.behaviour !== turn.ae.anchor) add(turn.change.behaviour);
    if (draft.output.length !== 'Short paragraph' || ['Organizer notes', 'Encounter beats', 'Debrief outline', 'Learning objectives', 'Mentor profile'].includes(draft.output.format)) {
      if (turn.ac.prediction) lines.push(`Prediction: ${sentence(turn.ac.prediction)}`);
      for (const branch of KOLB_BRANCHES) if (turn.ae.branches[branch.key].enabled && text(turn.ae.branches[branch.key].text)) lines.push(`${branch.name} (possible result): ${sentence(turn.ae.branches[branch.key].text)} ${sentence(turn.ae.branches[branch.key].consequence)}`);
      if (draft.output.format === 'Organizer notes') {
        for (const mode of KOLB_MODES) {
          if (draft.notes[`${index}:${mode.key}`]) lines.push(`${mode.name}: ${draft.notes[`${index}:${mode.key}`]}`);
          for (const field of KOLB_FIELDS[mode.key]) {
            const value = getPath(turn, field.path);
            if (present(value)) lines.push(`${field.label}: ${Array.isArray(value) ? naturalList(value) : field.control === 'scale' ? field.options[value] : value}`);
          }
        }
        if (draft.safety.debrief) lines.push(`Debrief: ${draft.safety.note || 'Discuss what happened, what people noticed and what they might try next.'}`);
      }
    }
    if (draft.output.format === 'Debrief outline') lines.push('Discuss what happened, compare observations, consider another explanation, and choose a way to test it.');
    if (draft.output.format === 'Learning objectives' && draft.meta.targetText) lines.push(`Intended learning: ${draft.meta.targetText}`);
    if (draft.output.format === 'Mentor profile') {
      const roles = KOLB_MODES.map(mode => turn[mode.section].role).filter(Boolean);
      if (roles.length) lines.push(`Support roles: ${naturalList([...new Set(roles)])}`);
    }
    if (lines.length) paragraphs.push(draft.output.length === 'Bullets' ? lines.map(line => `• ${line}`).join('\n') : draft.output.length === 'Detailed outline' || draft.output.format === 'Organizer notes' ? `${C.cycle} ${index + 1}\n${lines.join('\n\n')}` : lines.join(' '));
  }
  return paragraphs.join(draft.output.length === 'Short paragraph' && ['Story paragraph', 'Character growth arc'].includes(draft.output.format) ? ' ' : '\n\n');
}
