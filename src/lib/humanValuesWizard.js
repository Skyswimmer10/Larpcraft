import { VALUES_LIBRARY, VALUES_STEPS, VALUES_PURPOSES, VALUES_PRESETS, VALUES_COPY as C } from '../data/humanValuesWizard.js';
import { copyDraft, getPath, setPath, naturalList, wizardScopeKey } from './storyWizardCore.js';

const text = value => typeof value === 'string' ? value.trim() : '';
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const present = value => Array.isArray(value) ? value.length > 0 : value !== '' && value !== null && value !== undefined && value !== false;
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const sentence = value => { const t = text(value).replace(/\s+/g, ' '); return t ? t[0].toUpperCase() + t.slice(1) + (/[.!?…][”"]?$/.test(t) ? '' : '.') : ''; };
const clause = value => text(value).replace(/[.!?]+$/, '').replace(/^(The|A|An|They|Their|She|Her|He|His|It|This)\b/, word => word.toLowerCase());
const stateText = value => text(value).replace(/^[A-Z]/, letter => letter.toLowerCase());
export const valuesInFocus = draft => draft.values.filter(value => value.column === 'inPlay');
export const valuesSteps = draft => VALUES_STEPS.filter(step => draft.meta.depth === 'advanced' || step.simple);
export function makeValue(definition) {
  return { ...copyDraft(definition), column: 'irrelevant', from: '', to: '', alternate: '', who: '', why: '', intent: null, triggered: '', interaction: null, importance: null, intensity: null, views: [], note: '' };
}
export function customValue(label, stateText, description = '') {
  const states = stateText.split(/\r?\n/).map(text).filter(Boolean);
  if (!text(label) || states.length < 2 || states.length > 5 || new Set(states.map(s => s.toLowerCase())).size !== states.length) throw new Error(C.customInvalid);
  return { id: `custom-${uid()}`, label: text(label), states, description: text(description), custom: true };
}
export function createValuesDraft({ record, answers = record?.answers || {}, purpose = 'values', preferences = {}, customLibrary = [], title = '', context = '', targetId = '', scope, id } = {}) {
  if (record?.valuesDraft?.schemaVersion > 1) throw new Error(C.unavailable);
  const draft = record?.valuesDraft ? copyDraft(record.valuesDraft) : {
    schemaVersion: 1, id: id || `VALUES-${uid()}`, createdAt: Date.now(), title: record?.title || title, context: record?.context || context,
    meta: { purpose: record?.focus || purpose, depth: preferences.lastDepth || 'simple', mode: 'build', source: '' },
    lastStep: 'setup', setup: { event: '', eventType: null, stakeholders: [], others: '', reality: null },
    values: [...VALUES_LIBRARY, ...customLibrary.filter(value => !VALUES_LIBRARY.some(builtin => builtin.id === value.id))].map(makeValue),
    chain: { anchor: '', decisive: '', smallEvent: '', rows: [] },
    reveal: { enabled: false, uncertainty: null, omens: '', information: '', irony: false, rows: [] },
    choices: { enabled: false, anchor: '', chooser: '', visibility: null, options: [] },
    arc: [], notes: {}, locks: {}, fieldMeta: {}, legacy: {}, feedback: '', organizer: '', dismissed: [],
    output: { format: preferences.lastFormat || 'Story paragraph' },
    workspace: { targetId, scope, scopeKey: wizardScopeKey(scope), sessionId: record?.sessionId || null, sourceTitle: record?.title },
  };
  if (record?.valuesDraft) draft.id = id || `VALUES-${uid()}`;
  if (!VALUES_PURPOSES[draft.meta.purpose]) draft.meta.purpose = 'values';
  // Older selections described a pole, not necessarily an ending. Preserve
  // them as source notes without assigning from/to states or conclusions.
  if (!record?.valuesDraft && Object.keys(answers).length) {
    draft.legacy = copyDraft(answers);
    let selected = 0;
    for (const value of draft.values) {
      const key = `phase:${value.legacy}`;
      if (!value.legacy || (!present(answers[key]) && !present(answers[`${key}:choice`]))) continue;
      value.column = selected++ < 3 ? 'inPlay' : 'watch';
      value.note = [answers[`${key}:choice`], answers[key]].filter(Boolean).join('\n\n');
    }
  }
  // Questionnaire answers remain editable in the normal node inspector.
  if (record?.valuesDraft) for (const value of draft.values) for (const part of ['who', 'why', 'from', 'to', 'alternate', 'triggered', 'note']) {
    const key = `values:${value.id}:${part}`;
    if (answers[key] !== undefined) value[part] = answers[key];
  }
  if (answers['values:event'] !== undefined) draft.setup.event = answers['values:event'];
  draft.workspace = { ...draft.workspace, ...(record ? { sessionId: record.sessionId || null, sourceTitle: record.title } : {}), ...(targetId ? { targetId } : {}), ...(scope ? { scope, scopeKey: wizardScopeKey(scope) } : {}) };
  return draft;
}
export function valuesStepFor(path) {
  if (path.startsWith('values.')) return path.endsWith('.column') || path.endsWith('.states') ? 'values' : 'shifts';
  if (path.startsWith('chain.')) return 'chain';
  if (path.startsWith('reveal.')) return 'reveal';
  if (path.startsWith('choices.')) return 'choices';
  if (path === 'arc' || path.startsWith('arc.') || path.startsWith('output.') || path === 'feedback') return 'review';
  if (path.startsWith('notes.')) return path.split('.')[1];
  return 'setup';
}
function dependencies(draft, path) {
  const basic = ['context', 'setup.event'];
  if (path.startsWith('values.')) return [...basic, 'setup.stakeholders', 'setup.others'];
  if (/^(chain|reveal|choices|arc)\./.test(path)) return [...basic, ...draft.values.flatMap((value, index) => ['column', 'from', 'to', 'alternate', 'who', 'why'].map(part => `values.${index}.${part}`))];
  return [];
}
const snapshot = (draft, paths) => Object.fromEntries(paths.map(path => [path, copyDraft(getPath(draft, path) ?? null)]));
function markStale(draft) {
  for (const [path, meta] of Object.entries(draft.fieldMeta)) if (present(getPath(draft, path)) && Object.entries(meta.basedOn || {}).some(([key, before]) => !same(getPath(draft, key), before))) meta.stale = true;
  return draft;
}
export function editValues(draft, path, value, options = {}) {
  const navigation = path === 'lastStep' || path.startsWith('meta.') || path.startsWith('locks.') || path === 'dismissed';
  if (!navigation && draft.locks[valuesStepFor(path)]) return draft;
  if (path === 'meta.purpose' && !VALUES_PURPOSES[value]) return draft;
  if (path.endsWith('.column') && value === 'inPlay' && getPath(draft, path) !== 'inPlay' && valuesInFocus(draft).length >= 3) return draft;
  const next = setPath(draft, path, value);
  next.fieldMeta[path] = { source: options.source || 'user', basedOn: snapshot(next, options.dependencies || dependencies(next, path)), ...(options.external ? { external: options.external } : {}) };
  next.updatedAt = Date.now();
  return markStale(next);
}
export function keepValuesAnswer(draft, path, externalValue) {
  const next = copyDraft(draft), meta = next.fieldMeta[path];
  if (!meta) return draft;
  meta.stale = false; meta.basedOn = snapshot(next, Object.keys(meta.basedOn || {}));
  if (meta.external && externalValue !== undefined) meta.external.value = externalValue;
  return next;
}
export function valuesSuggestions(draft) {
  if (draft.locks.values || valuesInFocus(draft).length >= 3) return [];
  return (VALUES_PRESETS[draft.meta.purpose] || []).flatMap(id => {
    const index = draft.values.findIndex(value => value.id === id);
    return index >= 0 && draft.values[index].column === 'irrelevant' ? [{ id, label: draft.values[index].label, path: `values.${index}.column`, proposed: 'inPlay' }] : [];
  });
}
export function addValuesRow(draft, type, valueIndex) {
  if (type === 'view') {
    const rows = draft.values[valueIndex].views;
    return editValues(draft, `values.${valueIndex}.views`, [...rows, { id: uid(), person: '', actual: '', perceived: '', meaning: '' }]);
  }
  const shapes = { chain: ['chain.rows', { text: '', valueId: '' }], reveal: ['reveal.rows', { timing: '', text: '', level: null, knownBy: [] }], choices: ['choices.options', { label: '', effects: {}, reversibility: null }], arc: ['arc', { label: '', act: '', states: {} }] };
  const [path, fields] = shapes[type], rows = getPath(draft, path);
  if (rows.length >= (type === 'choices' ? 4 : 12)) return draft;
  return editValues(draft, path, [...rows, { id: uid(), ...fields }]);
}
export function addCustomValue(draft, definition) {
  if (draft.locks.values || draft.values.some(value => value.id === definition.id)) return draft;
  const next = copyDraft(draft); next.values.push(makeValue(definition)); return next;
}
export function valuesImportText(model) {
  return text(model?.record.fateDraft?.focus?.anchor) || text(model?.record.kolbDraft?.turns?.[0]?.ce?.anchor) || text(model?.record.summary);
}
export function importValuesModel(draft, path, model) {
  const value = valuesImportText(model);
  return !value ? draft : editValues(draft, path, value, { source: 'imported', external: { key: model.key, value, label: model.record.title } });
}
export function refreshValuesImports(draft, models) {
  let next = draft;
  for (const [path, meta] of Object.entries(draft.fieldMeta)) if (meta.external) {
    const model = models.find(row => row.key === meta.external.key);
    if ((!model || valuesImportText(model) !== meta.external.value) && !meta.stale) { if (next === draft) next = copyDraft(draft); next.fieldMeta[path].stale = true; }
  }
  return next;
}
export function valuesFieldLabel(draft, path) {
  const parts = path.split('.');
  if (parts[0] === 'values') return `${draft.values[Number(parts[1])]?.label || C.inPlay} · ${C[parts[2]] || C.views}`;
  return VALUES_STEPS.find(step => step.key === valuesStepFor(path))?.name || C.context;
}
export function valuesSummary(draft, step) {
  const active = valuesInFocus(draft);
  if (step === 'setup') return [draft.context, draft.setup.event].filter(Boolean).join(' ');
  if (step === 'values') return naturalList(active.map(value => value.label));
  if (step === 'shifts') return active.map(value => `${value.label}: ${[value.from, value.to].filter(Boolean).join(' → ')}${value.why ? ` · ${value.why}` : ''}`).join('\n');
  if (step === 'chain') return [draft.chain.anchor, ...draft.chain.rows.map(row => row.text)].filter(Boolean).join(' → ');
  if (step === 'reveal') return [draft.reveal.information, ...draft.reveal.rows.map(row => [row.timing, row.text].filter(Boolean).join(': '))].filter(Boolean).join('\n');
  if (step === 'choices') return [draft.choices.anchor, ...draft.choices.options.map(row => row.label)].filter(Boolean).join(' · ');
  return draft.arc.map(row => row.label).filter(Boolean).join(' → ');
}
export function valuesChecks(draft) {
  const rows = [], active = valuesInFocus(draft);
  const add = (id, step, message) => { if (!draft.dismissed.includes(id)) rows.push({ id, step, message }); };
  if (!active.length) add('values', 'values', C.noValues);
  if (!text(draft.setup.event)) add('event', 'setup', C.noEvent);
  for (const value of active) {
    if (!text(value.who) || !text(value.why)) add(`meaning:${value.id}`, 'shifts', C.noMeaning.replace('{value}', value.label));
    if ((!text(value.from) || !text(value.to)) && !['Is protected', 'Is celebrated', 'Is restored'].includes(value.intent)) add(`state:${value.id}`, 'shifts', C.noState.replace('{value}', value.label));
  }
  return rows;
}
export function valuesOutput(draft) {
  if (typeof draft.output.text === 'string') return draft.output.text.trim();
  if (draft.meta.mode === 'diagnose') return [C.prose.review, ...valuesChecks(draft).map(row => row.message), ...valuesInFocus(draft).map(value => [value.label, value.who, value.why].filter(Boolean).join(' · '))].join('\n\n');
  const format = draft.meta.depth === 'simple' ? 'Story paragraph' : draft.output.format;
  const active = valuesInFocus(draft), lines = [sentence(draft.context), sentence(draft.setup.event)];
  for (const value of active) {
    if (text(value.why)) lines.push(value.who ? sentence(`${C.prose.cares} ${text(value.who).replace(/[.!?]+$/, '')}, ${clause(value.why)}`) : sentence(value.why));
    const transition = value.from && value.to ? sentence(value.from === value.to ? `${C.prose.remains} “${stateText(value.from)}”` : `${C.prose.changes} “${stateText(value.from)}” ${C.prose.to} “${stateText(value.to)}”`) : '';
    if (transition) lines.push(transition);
    const intent = { 'Is threatened': C.prose.threatened, 'Is protected': C.prose.protected, 'Is restored': C.prose.restored, 'Is celebrated': C.prose.celebrated }[value.intent];
    if (intent) lines.push(sentence(`${intent}${text(value.triggered) ? `: ${clause(value.triggered)}` : ''}`));
    else if (text(value.triggered)) lines.push(sentence(value.triggered));
    if (text(value.alternate)) lines.push(sentence(`${C.prose.another} ${clause(value.alternate)}`));
  }
  if (draft.chain.anchor) lines.push(sentence(draft.chain.anchor));
  if (draft.choices.enabled && draft.choices.anchor) lines.push(sentence(`${C.prose.choice} ${clause(draft.choices.anchor)}`));
  const paragraph = lines.filter(Boolean).join(' ');
  if (format === 'Story paragraph' || format === 'Character stakes') return paragraph;
  const detail = [paragraph];
  if (['Scene outline', 'Act map', 'Organizer notes'].includes(format)) detail.push(...draft.arc.map(beat => [beat.label, ...active.filter(value => beat.states[value.id]).map(value => `${value.label}: ${beat.states[value.id]}`)].filter(Boolean).join(' · ')));
  if (draft.choices.enabled) detail.push(...draft.choices.options.map(row => [row.label, ...active.filter(value => text(row.effects[value.id])).map(value => `${value.label}: ${row.effects[value.id]}`), row.reversibility].filter(Boolean).join(' · ')));
  if (['Relationship notes', 'Organizer notes'].includes(format)) detail.push(...active.flatMap(value => value.views.map(view => [view.person, view.actual, view.perceived && `${C.perceived} ${view.perceived}`, view.meaning].filter(Boolean).join(' · '))));
  if (format === 'Organizer notes') detail.push(...draft.chain.rows.map(row => row.text), ...draft.reveal.rows.map(row => [row.timing, row.text, naturalList(row.knownBy)].filter(Boolean).join(' · ')), draft.organizer, draft.feedback && `${C.feedback} ${draft.feedback}`);
  return detail.filter(Boolean).join('\n\n');
}
export function valuesQuestions(draft) {
  const rows = [{ key: 'values:event', prompt: C.event }];
  for (const value of draft.values) if (value.column !== 'irrelevant' || value.note) for (const part of ['who', 'why', 'from', 'to', 'alternate', 'triggered', 'note']) rows.push({ key: `values:${value.id}:${part}`, prompt: `${value.label} · ${C[part] || C.notes}` });
  for (const [key, answer] of Object.entries(draft.legacy)) if (text(answer)) rows.push({ key: `values:legacy:${key}`, prompt: `${C.legacy} · ${key}` });
  return rows;
}
export function valuesAnswers(draft) {
  const answers = { 'values:event': draft.setup.event };
  for (const value of draft.values) for (const part of ['who', 'why', 'from', 'to', 'alternate', 'triggered', 'note']) answers[`values:${value.id}:${part}`] = value[part];
  for (const [key, value] of Object.entries(draft.legacy)) answers[`values:legacy:${key}`] = value;
  return answers;
}
