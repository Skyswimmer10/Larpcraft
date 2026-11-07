export const FATE_SIGNAL_GROUPS = {
  Visual: ['Bright light', 'Distinctive colours', 'Movement', 'Gestures or facial expressions', 'Written words', 'Noticeable objects', 'Something visually unfamiliar'],
  Audio: ['Loud or sudden sounds', 'Raised voices or shouting', 'Spoken words', 'Silence or a pause', 'A familiar voice'],
  Kinesthetic: ['Touch or physical contact', 'Vibration', 'Temperature', 'Pressure or discomfort', 'Body position or balance', 'Physical effort'],
};
export const FATE_ATTENTION = ['Usually ignored', 'Passing glance', 'Brief pause', 'Clear attention', 'Strong attention', 'Full concentration'];
export const FATE_FEELING_STRENGTH = ['Faint', 'Mild', 'Clear', 'Strong', 'Overwhelming'];
export const FATE_RESPONSES = ['Move toward it', 'Pull away', 'Both impulses conflict', 'It depends'];
const clean = value => String(value ?? '').trim();
const list = values => values.length < 2 ? values[0] || '' : `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`;
const lower = value => clean(value).replace(/[.!]+$/, '').replace(/^(They|Their|He|She|It|The|A|An|When)\b/, word => word.toLowerCase());
const sentence = value => { const text = clean(value); return text ? text[0].toUpperCase() + text.slice(1) + (/[.!?…][”"]?$/.test(text) ? '' : '.') : ''; };

export function fateCharacterEntities(game) {
  const result = [];
  const walk = (nodes, coll, parents = []) => {
    for (const node of Object.values(nodes || {})) {
      const path = [...parents, node.id];
      if (['character', 'group', 'team', 'faction'].includes(node.kind)) result.push({ key: JSON.stringify([coll, ...path]), name: node.title || node.name || node.id, type: node.kind === 'character' ? 'person' : 'group', ref: { coll, path } });
      if (node.sub) walk(node.sub.nodes, coll, path);
    }
  };
  for (const coll of ['nodes', 'masterNodes', 'taskNodes', 'storyboardNodes']) walk(game[coll], coll);
  for (const coll of ['teams', 'factions']) for (const node of Object.values(game[coll] || {})) result.push({ key: JSON.stringify([coll, node.id]), name: node.name || node.title || node.id, type: 'group', ref: { coll, path: [node.id] } });
  return result;
}
export function fateReferenceNode(game, ref) {
  let node = game[ref?.coll]?.[ref?.path?.[0]];
  for (const id of ref?.path?.slice(1) || []) node = node?.sub?.nodes?.[id];
  return node;
}
export function refreshFateCharacterLinks(draft, entities) {
  let changed = false;
  const sections = {};
  for (const section of ['authority', 'tribe']) {
    const people = (draft[section].people || []).map(row => {
      const live = row.entityKey && entities.find(entity => entity.key === row.entityKey);
      if (!live || live.name === row.name) return row;
      changed = true; return { ...row, name: live.name };
    });
    sections[section] = { ...draft[section], people };
  }
  return changed ? { ...draft, ...sections } : draft;
}
export function currentFateCharacterDraft(draft, entities, target) {
  const linked = refreshFateCharacterLinks(draft, entities);
  const name = target?.kind === 'character' && !draft.workspace?.pendingCharacterName ? target.title || target.name : null;
  return name && name !== linked.title ? { ...linked, title: name } : linked;
}
export function fateCharacterScope(game, scope = { coll: 'nodes' }) {
  const coll = scope.coll || 'nodes', path = scope.parentPath || (scope.parentId ? [scope.parentId] : []);
  if (coll === 'masterNodes') {
    const act = game.masterNodes?.[path[0]];
    if (act?.actLanes?.story) return { coll, parentPath: [path[0], act.actLanes.story, ...(path[1] === act.actLanes.story ? path.slice(2) : [])] };
    return { coll: 'nodes' };
  }
  if (coll !== 'nodes') return { coll: 'nodes' };
  let node;
  for (const id of path) { node = node ? node.sub?.nodes?.[id] : game.nodes?.[id]; if (!node || node.mechKind || ['mechanic', 'gameType', 'task', 'taskTemplate'].includes(node.kind)) return { coll: 'nodes' }; }
  return scope;
}
export function fateCharacterStep(draft, pillar) {
  const rows = [], add = value => { const text = sentence(value); if (text && !rows.includes(text)) rows.push(text); };
  const value = draft[{ F: 'focus', A: 'authority', T: 'tribe', E: 'emotion' }[pillar]];
  if (!value) return rows;
  if (pillar === 'F') {
    for (const signal of value.signals || []) {
      add(`They ${signal.kind === 'overlooked' ? 'tend to overlook' : 'notice'} ${signal.label}${Number.isInteger(signal.strength) ? ` (${FATE_ATTENTION[signal.strength].toLowerCase()})` : ''}`);
      if (signal.detail) add(signal.detail);
    }
    if (value.hooks?.length) add(`Their attention is drawn by ${list(value.hooks).toLowerCase()}`);
    if (value.channels?.length) add(`They notice ${list(value.channels).toLowerCase()}`);
  }
  if (pillar === 'A') {
    if (value.source?.length) add(`They place trust in ${list(value.source).toLowerCase()}`);
    for (const row of value.people || []) { add(`${row.name} ${row.type === 'group' ? 'is a group whose judgment carries weight for them' : 'is someone whose judgment carries weight for them'}`); add(row.detail); }
    if (value.basis?.length) add(`That authority rests on ${list(value.basis).toLowerCase()}`);
    if (value.markers?.length) add(`They recognise authority through ${list(value.markers).toLowerCase()}`);
    if (value.challengeable) add(value.crack ? `Their trust can be shaken: ${lower(value.crack)}` : 'Their trust can be questioned or shaken');
  }
  if (pillar === 'T') {
    const pull = Array.isArray(value.pull) ? value.pull : value.pull ? [value.pull] : [];
    if (pull.length) add(`Belonging matters through ${list(pull).toLowerCase()}`);
    if (value.statusStakes?.length) add(`Their relationships give or risk ${list(value.statusStakes).toLowerCase()}`);
    if (value.position) add(`Their usual place in a group is ${value.position.toLowerCase()}`);
    if (value.groups?.length) add(`Their important groups and relationships include ${list(value.groups)}`);
    for (const row of value.people || []) {
      add(`${row.name} matters to them${row.relationship ? ` (${row.relationship})` : ''}`); add(row.detail);
      if (row.symbol) add(`For ${row.name}, a sign of belonging is ${row.symbol}`);
      if (row.type === 'group') for (const [personId, status] of Object.entries(row.board || {})) {
        const person = value.people?.find(person => person.id === personId && person.type === 'person');
        if (person && ['inGroup', 'outGroup', 'undecided'].includes(status)) add(`${person.name}: ${status === 'inGroup' ? 'belongs to' : status === 'outGroup' ? 'is outside' : 'has undecided membership in'} ${row.name}`);
      }
    }
    add(value.loyalties);
    if (value.scriptElements?.length) add(`Their group behaviour includes ${list(value.scriptElements).toLowerCase()}`);
  }
  if (pillar === 'E') {
    if (value.recurring?.length) add(`Their recurring feelings include ${list(value.recurring).toLowerCase()}`);
    if (value.primary) add(`One especially common feeling is ${value.primary.toLowerCase()}`);
    for (const pattern of value.patterns || []) {
      const parts = [pattern.situation && `When ${lower(clean(pattern.situation).replace(/^(when|if)\s+/i, ''))}`, pattern.feelings?.length && `they feel ${list(pattern.feelings).toLowerCase()}${Number.isInteger(pattern.intensity) ? ` (${FATE_FEELING_STRENGTH[pattern.intensity].toLowerCase()})` : ''}`].filter(Boolean);
      if (parts.length) add(parts.join(', '));
      if (pattern.triggers?.length) add(`Triggers for this pattern include ${list(pattern.triggers).toLowerCase()}`);
      if (pattern.direction) add({ 'Move toward it': 'Their usual impulse in this pattern is to move toward it', 'Pull away': 'Their usual impulse in this pattern is to pull away', 'Both impulses conflict': 'In this pattern, moving closer and pulling away conflict', 'It depends': 'Their response in this pattern depends on the circumstances' }[pattern.direction]);
      if (pattern.response) { const response = lower(pattern.response); const action = response[0].toLowerCase() + response.slice(1); add(/^(he|she|they|it|their|his|her)\b/i.test(response) ? response : /^\w+ing\b/i.test(response) ? `Their usual response is ${action}` : `They tend to ${action}`); }
      add(pattern.behaviour);
      if (pattern.exception) add(`This can change when ${lower(clean(pattern.exception).replace(/^when\s+/i, ''))}`);
      if (pattern.originKind && pattern.originKind !== 'Unclear') add(`They describe this pattern as ${pattern.originKind.toLowerCase()}`);
    }
    // Explicit broad tendencies from earlier profiles remain broad, never copied
    // into all of the independent pattern cards.
    if (value.direction) add(`A recorded general emotional response is ${value.direction.toLowerCase()}`);
    if (value.resistance) add(`Their general response can change: ${lower(value.resistance)}`);
    add(value.response);
  }
  return rows;
}

export function fateCharacterQuestionRows(draft) {
  const rows = [];
  for (const [section, collection, fields] of [
    ['focus', 'signals', { label: 'Signal', kind: 'Draws attention or is overlooked', strength: 'Attention strength', detail: 'Example or exception' }],
    ['authority', 'people', { name: 'Person or group', detail: 'Why their judgment carries weight' }],
    ['tribe', 'people', { name: 'Person or group', relationship: 'Relationship', detail: 'Why this relationship matters', symbol: 'Signs of belonging' }],
    ['emotion', 'patterns', { situation: 'What brings this pattern out?', feelings: 'Which feelings mix here?', direction: 'What might they do?', response: 'Usual response', intensity: 'Feeling strength', exception: 'When might they respond differently?', behaviour: 'What behaviour shows their feelings?', originKind: 'Where does this reaction come from?', triggers: 'Triggers for this pattern' }],
  ]) for (const [index, row] of (draft[section][collection] || []).entries()) for (const [field, label] of Object.entries(fields)) {
    if (field === 'name' && row.entityKey) continue;
    const raw = row[field], type = ['strength', 'intensity'].includes(field) ? 'number' : ['feelings', 'triggers'].includes(field) ? 'array' : 'text';
    const value = type === 'array' ? (raw || []).join(' | ') : raw == null ? '' : String(raw);
    const optionLabel = type === 'number' && raw != null ? (field === 'strength' ? FATE_ATTENTION : FATE_FEELING_STRENGTH)[raw] : value;
    rows.push({ key: `fate:character:${section}:${row.id}:${field}`, path: `${section}.${collection}.${index}.${field}`, prompt: `${section === 'emotion' ? `Emotional pattern ${index + 1}` : row.label || row.name} — ${label}`, value: type === 'number' ? optionLabel || '' : value, type });
  }
  return rows;
}

export function remapFateCharacterReferences(node, idMap = {}) {
  const remapRecord = record => {
    if (!record?.fateDraft) return record;
    const remapDraft = draft => {
      const next = { ...draft };
      for (const section of ['authority', 'tribe']) if (draft[section]?.people) next[section] = { ...draft[section], people: draft[section].people.map(row => {
        if (!row.entityKey) return row;
        let path; try { path = JSON.parse(row.entityKey); } catch { path = []; }
        return { ...row, entityKey: path.length === 2 && path[0] === 'nodes' && idMap[path[1]] ? JSON.stringify(['nodes', idMap[path[1]]]) : '' };
      }) };
      if (draft.purposeBanks) next.purposeBanks = Object.fromEntries(Object.entries(draft.purposeBanks).map(([key, bank]) => [key, remapDraft(bank)]));
      return next;
    };
    return { ...record, fateDraft: remapDraft(record.fateDraft) };
  };
  return { ...node, ...(node.narrativeWizard ? { narrativeWizard: remapRecord(node.narrativeWizard) } : {}), ...(node.narrativeWizardHistory ? { narrativeWizardHistory: node.narrativeWizardHistory.map(remapRecord) } : {}) };
}
