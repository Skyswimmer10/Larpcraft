import {
  BEAT_OCCASIONS, BEAT_COLLISIONS, BEAT_OPENERS, BEAT_COMPLICATIONS, BEAT_COMPLICATION_EFFECTS,
  BEAT_ENTRIES, BEAT_INTERACTIONS, BEAT_INFLUENCE, BEAT_CONDITIONS, BEAT_CONSEQUENCE_EFFECTS,
  BEAT_TIMING, BEAT_VISIBILITY, BEAT_CHANGE_DOMAINS,
} from '../data/storyBeatWorkshop.js';
import { VALUES_LIBRARY } from '../data/humanValuesWizard.js';
import { beatOpenerGuide, BEAT_SLOT_DEFAULTS } from '../data/storyBeatOpenerGuidance.js';
import { beatContextPrompts } from '../data/storyBeatContextGuidance.js';
import { beatApproach, characterOpener, characterSectionClauses, characterCondition } from '../data/storyBeatApproaches.js';

const text = value => typeof value === 'string' ? value.trim() : '';
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const list = value => Array.isArray(value) ? value : [];
const choice = (options, id) => options.find(row => row.id === id);
const natural = values => values.length < 2 ? values[0] || '' : `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`;
const sentence = value => { const s = text(value).replace(/\ba ([aeiou])/gi, (_, vowel) => 'an ' + vowel); return s ? s.charAt(0).toUpperCase() + s.slice(1) + (/[.!?]$/.test(s) ? '' : '.') : ''; };
export const beatRefKey = ref => ref ? JSON.stringify([ref.coll || 'nodes', ref.parentPath || [], ref.nodeId]) : '';
const GRAPH_COLLECTIONS = ['nodes', 'masterNodes', 'taskNodes', 'storyboardNodes'];

export function beatWorkshopDetails(node = {}) {
  const saved = record(node.storyBeat?.workshop);
  return {
    ...saved, version: saved.version || 1, approach: beatApproach(saved),
    roles: record(saved.roles),
    bindings: record(saved.bindings),
    participants: list(saved.participants),
    occasion: { ...record(saved.occasion), selections: record(saved.occasion?.selections) },
    opener: { ...record(saved.opener), selections: record(saved.opener?.selections) },
    complication: { ...record(saved.complication), selections: record(saved.complication?.selections) },
    complications: list(saved.complications).filter(row => row && typeof row.id === 'string'),
    involvement: { ...record(saved.involvement), interactions: list(saved.involvement?.interactions) },
    consequences: list(saved.consequences).filter(row => row && typeof row.id === 'string'),
    stakes: { ...record(saved.stakes), values: list(saved.stakes?.values), morals: list(saved.stakes?.morals) },
    notes: record(saved.notes),
  };
}
export function beatWorkshopPatch(node, section, patch) {
  const workshop = beatWorkshopDetails(node);
  const next = ['consequences', 'participants', 'complications'].includes(section) ? { ...workshop, [section]: patch }
    : { ...workshop, [section]: { ...record(workshop[section]), ...patch } };
  return { storyBeat: { ...node.storyBeat, workshop: next } };
}
export function beatWorkshopApproachPatch(node, approach) {
  const workshop=beatWorkshopDetails(node);
  return {storyBeat:{...node.storyBeat,workshop:{...workshop,approach:beatApproach({approach})}}};
}
export function beatSelectedOption(part, groups) {
  return choice(groups.find(group => group.id === part.family)?.options || [], part.selections?.[part.family]);
}
export function beatEntity(game, ref) {
  if (!ref || !GRAPH_COLLECTIONS.includes(ref.coll)) return null;
  let nodes = game?.[ref.coll];
  for (const id of ref.parentPath || []) nodes = nodes?.[id]?.sub?.nodes;
  return nodes?.[ref.nodeId] || null;
}
export function beatEntities(game = {}, scope) {
  const result = [];
  const walk = (nodes, coll, parentPath = [], labels = []) => {
    for (const node of Object.values(nodes || {})) {
      // Generated input trees describe their owning entity; they are not cast.
      if (node.characterInput || node.groupInput || node.groupRoster || node.kind === 'framework') continue;
      const name = node.title || node.name || node.id;
      if (['character', 'group', 'item', 'storyLocation'].includes(node.kind)) {
        const ref = { coll, parentPath, nodeId: node.id };
        result.push({ ref, key: beatRefKey(ref), name, kind: node.kind, node, label: [coll === 'nodes' ? 'Narrative' : coll === 'masterNodes' ? 'Master Story' : coll === 'taskNodes' ? 'Mechanics' : 'Storyboard', ...labels, name].join(' / ') });
      }
      if (node.sub?.nodes) walk(node.sub.nodes, coll, [...parentPath, node.id], [...labels, name]);
    }
  };
  (scope?.coll ? [scope.coll] : GRAPH_COLLECTIONS).forEach(coll => walk(game[coll], coll));
  return result;
}
export function beatConnectedParticipants(node, game, scope = { coll: 'nodes' }) {
  const all = beatEntities(game);
  const path = scope.parentPath || (scope.parentId ? [scope.parentId] : []);
  let graph = { nodes: game?.[scope.coll] || {}, edges: scope.coll === 'nodes' ? game?.edges : game?.[scope.coll.replace(/Nodes$/, 'Edges')] };
  for (const id of path) graph = graph.nodes?.[id]?.sub || { nodes: {}, edges: [] };
  const neighbours = new Set(list(graph.edges).filter(edge => edge.from === node.id || edge.to === node.id).map(edge => edge.from === node.id ? edge.to : edge.from));
  const workshop = beatWorkshopDetails(node);
  const chosen = new Set([...Object.values(workshop.roles), ...workshop.participants, ...Object.values(workshop.bindings).flatMap(Object.values)].map(row => beatRefKey(row?.ref)));
  return all.filter(row => chosen.has(row.key) || row.ref.coll === scope.coll && JSON.stringify(row.ref.parentPath) === JSON.stringify(path) && neighbours.has(row.ref.nodeId));
}
export function beatRoleNames(workshop, game) {
  const fallbacks = { actor: 'someone', other: 'another person', item: 'something important', place: 'the place' };
  return Object.fromEntries(Object.entries(fallbacks).map(([role, fallback]) => {
    const value = workshop.roles?.[role] || {};
    const live = beatEntity(game, value.ref);
    return [role, live?.title || live?.name || text(value.name) || fallback];
  }));
}
const fill = (template, names) => (template || '').replace(/\{(\w+)\}/g, (_, key) => names[key] || key);
export function beatOpenerDefinition(workshop) {
  if(beatApproach(workshop)==='characterInteraction')return characterOpener(workshop);
  const option=beatSelectedOption(workshop.opener,BEAT_OPENERS);
  return option?{...option,key:workshop.opener.family+'/'+option.id,...beatOpenerGuide(workshop.opener.family,option.id)}:null;
}
export function beatOpenerSegments(workshop,game) {
  const clause=beatSectionClauses(workshop,'opener')[0];
  return clause?beatClauseSegments(workshop,game,clause):[];
}
export const beatSlotAllows = (slot,entity) => !!slot?.kinds?.includes(entity?.kind);

const SUBJECT = { label: 'Subject', kinds: ['character', 'group', 'item', 'storyLocation'], icon: 'book' };
const EXTRA_ROLES = {
  subject: SUBJECT,
  affected: { label: 'Who is affected', kinds: ['character', 'group'], icon: 'users' },
  result: { label: 'Result / thing affected', kinds: ['item'], icon: 'box' },
};

// The editor and prose use these same templates. Bindings belong to a specific
// pattern/possibility, so editing one sentence never silently recasts another.
function beatBaseSectionClauses(w, section, branchId) {
  if(beatApproach(w)==='characterInteraction'&&section!=='occasion')return characterSectionClauses(w,section,branchId);
  const clause = (key, template, roles = {}, fallbacks = {}) => ({ key, template, roles: { ...BEAT_SLOT_DEFAULTS, ...EXTRA_ROLES, ...roles }, fallbacks });
  if (section === 'occasion') {
    const occasion = beatSelectedOption(w.occasion, BEAT_OCCASIONS), rows = [];
    if (occasion) rows.push({ ...clause('occasion/' + occasion.id, 'The occasion is a ' + occasion.text + ' at {place}'), optional: { place: ' at {place}' } });
    const second = BEAT_OCCASIONS.flatMap(group => group.options).find(row => row.id === w.occasion.second);
    if (w.occasion.collisionEnabled && second) {
      const collision = choice(BEAT_COLLISIONS, w.occasion.collision)?.text || 'A {second} also takes place';
      rows.push(clause('occasion/collision/' + w.occasion.collision, collision.replace(/\{second\}/g,second.text).replace(/\{occasion\}/g,occasion?.text || 'occasion')));
    }
    return rows;
  }
  if (section === 'stakes') {
    const domain = choice(BEAT_CHANGE_DOMAINS, w.stakes.domain);
    return domain ? [{ ...clause('stakes/' + domain.id, 'The beat may affect ' + domain.label.toLowerCase() + ' for {affected}'), optional: { affected: ' for {affected}' } }] : [];
  }
  if (section === 'opener') {
    const opener = beatOpenerDefinition(w);
    return opener ? [clause('opener/' + opener.key, opener.text, opener.roles)] : [];
  }
  if (section === 'complication') {
    const part = branchId ? w.complications.find(row => row.id === branchId) : w.complication;
    if (!part) return [];
    const option = beatSelectedOption(part, BEAT_COMPLICATIONS);
    return option ? [clause((branchId ? 'complications/' + branchId : 'complication') + '/' + part.family + '/' + option.id, option.text)] : [];
  }
  if (section === 'involvement') {
    const rows = [], entry = choice(BEAT_ENTRIES, w.involvement.entry), influence = choice(BEAT_INFLUENCE, w.involvement.influence);
    if (entry) rows.push(clause('involvement/entry/' + entry.id, entry.text));
    const targets = { investigate: 'investigate {subject}', negotiate: 'talk or negotiate with {other}', judge: 'make a choice or judge the claims concerning {subject}', cooperate: 'cooperate or coordinate with {other}', overcome: 'overcome a difficulty concerning {subject} or endure it', witness: 'witness or interpret what happens to {subject}' };
    for (const interaction of BEAT_INTERACTIONS.filter(row => w.involvement.interactions.includes(row.id))) rows.push(clause('involvement/interaction/' + interaction.id, 'Players can ' + targets[interaction.id], {}, { subject: 'the situation' }));
    if (influence) rows.push(clause('involvement/influence/' + influence.id, 'Their participation can affect ' + influence.text));
    return rows;
  }
  if (section === 'consequences') return w.consequences.filter(row => !branchId || row.id === branchId).flatMap(row => {
    const effect = choice(BEAT_CONSEQUENCE_EFFECTS, row.effect);
    if (!effect) return [];
    const condition = text(row.conditionText) || choice(BEAT_CONDITIONS, row.condition)?.text;
    const resultRole = ['grant', 'restrict'].includes(row.effect) ? { label: 'Place / access', kinds: ['storyLocation'], icon: 'pin' }
      : ['reveal', 'conceal', 'followup'].includes(row.effect) ? SUBJECT : EXTRA_ROLES.result;
    return [clause('consequences/' + row.id + '/' + effect.id,
      (condition ? 'If ' + condition + ', ' : 'One possibility is that ') + effect.text,
      { result: resultRole }, { affected: row.affected, affectedName: text(row.affectedName), result: text(row.result) })];
  });
  return [];
}

export function beatContextPart(w, section, branchId) {
  if (section === 'complication' && branchId) return w.complications.find(row => row.id === branchId) || {};
  if (section === 'consequences') return w.consequences.find(row => row.id === branchId) || {};
  return w[section] || {};
}
export function beatContextAnswers(w, section, branchId) {
  const opener = beatOpenerDefinition(w);
  return opener ? record(beatContextPart(w, section, branchId).context?.[opener.key]) : {};
}
export function beatContextChoices(w, section) {
  if(beatApproach(w)==='characterInteraction')return [];
  const prompts=beatContextPrompts(beatOpenerDefinition(w), section, w);
  if(section!=='consequences')return prompts;
  const responses=beatSectionClauses(w,'involvement').filter(clause=>clause.key.startsWith('involvement/interaction/')||clause.key.includes('/actions/'));
  const options=responses.map(clause=>({id:'response:'+clause.key,label:clause.label||choice(BEAT_INTERACTIONS,clause.key.split('/').at(-1))?.label||'Chosen player action',text:clause.template.replace(/^Players can /,'players '),source:clause,icon:'users',tone:'teal'}));
  return prompts.map(prompt=>prompt.id==='condition'?{...prompt,options:[...options,...prompt.options]}:prompt);
}
function beatConditionChoice(w,row){
  const answers=beatContextAnswers(w,'consequences',row.id);
  return beatContextChoices(w,'consequences').find(prompt=>prompt.id==='condition')?.options.find(option=>option.id===answers.condition)
    || (typeof answers.conditionSource?.template==='string'&&answers.condition?.startsWith('response:')?{text:answers.conditionSource.template.replace(/^Players can /,'players '),source:answers.conditionSource}:null);
}
export function beatConsequenceCondition(w, row) {
  if(beatApproach(w)==='characterInteraction')return characterCondition(w,row)?.text;
  return beatConditionChoice(w,row)?.text || text(row.conditionText) || choice(BEAT_CONDITIONS, row.condition)?.text;
}
export function beatContextClauses(w, section, branchId) {
  const opener = beatOpenerDefinition(w);
  if (!opener) return [];
  const answers = beatContextAnswers(w, section, branchId);
  const roles = { ...BEAT_SLOT_DEFAULTS, ...EXTRA_ROLES, ...opener.roles,
    messenger: { ...BEAT_SLOT_DEFAULTS.actor, label: 'Messenger' },
    beneficiary: { ...BEAT_SLOT_DEFAULTS.actor, label: 'Person who benefits or pays' },
    custodian: { ...BEAT_SLOT_DEFAULTS.actor, label: 'Custodian' },
    community: { label: 'Group', kinds: ['group'], icon: 'users' },
  };
  return beatContextChoices(w, section).filter(prompt => prompt.id !== 'condition').flatMap(prompt => {
    const selected = prompt.multiple ? list(answers[prompt.id]) : [answers[prompt.id]];
    return prompt.options.filter(option => selected.includes(option.id)).map(option => ({
      key: ['context', section, branchId || 'primary', opener.key, prompt.id, option.id].join('/'),
      template: option.text, label: option.label, roles, fallbacks: {
        messenger: 'the messenger', beneficiary: 'someone', custodian: 'the custodian', community: 'the group',
      }, contextual: true,
    }));
  });
}
export function beatSectionClauses(w, section, branchId) {
  if(beatApproach(w)==='characterInteraction')return section==='occasion'
    ? [...beatBaseSectionClauses(w,section,branchId),...characterSectionClauses(w,section,branchId)]
    : beatBaseSectionClauses(w,section,branchId);
  const base = beatBaseSectionClauses(w, section, branchId), contextual = beatContextClauses(w, section, branchId);
  if (section === 'complication' && contextual.length) return contextual;
  if (section === 'consequences') {
    if (!branchId) return w.consequences.flatMap(row => beatSectionClauses(w, section, row.id));
    const row = w.consequences.find(row => row.id === branchId);
    if (!row) return [];
    const condition = beatConsequenceCondition(w, row);
    const response=beatConditionChoice(w,row)?.source;
    const connect=clause=>{
      if(!response)return clause;
      const conditionText=condition.replace(/\{(\w+)\}/g,'{response_$1}');
      return{...clause,template:clause.template.replace('If '+condition+', ','If '+conditionText+', '),conditionSource:response,
        roles:{...clause.roles,...Object.fromEntries(Object.entries(response.roles).map(([role,definition])=>['response_'+role,{...definition,label:'Response · '+definition.label}]))}};
    };
    if (contextual.length) return contextual.map(clause => connect({ ...clause,
      template: (condition
        ? 'If ' + condition + ', '
        : '') + clause.template.charAt(0).toLowerCase() + clause.template.slice(1),
    }));
    if (condition && base.length) {
      const effect = choice(BEAT_CONSEQUENCE_EFFECTS, row.effect);
      return [connect({ ...base[0], template: 'If ' + condition + ', ' + effect.text })];
    }
  }
  return [...base, ...contextual];
}

export function beatClauseNames(workshop, game, clause) {
  const names = { ...beatRoleNames(workshop, game), subject: 'the situation', affected: 'those involved', result: 'the outcome' };
  if (clause.contextual||clause.inheritsOpener) {
    const opener = beatBaseSectionClauses(workshop, 'opener')[0];
    if (opener&&opener.key!==clause.key) Object.assign(names, beatClauseNames(workshop, game, opener));
  }
  if(clause.affectedFrom)names.affected=names[clause.affectedFrom]||'someone';
  if(clause.conditionSource)for(const [role,name]of Object.entries(beatClauseNames(workshop,game,clause.conditionSource)))names['response_'+role]=name;
  if (clause.fallbacks.affected) names.affected = names[clause.fallbacks.affected] || 'those involved';
  else if (clause.fallbacks.affectedName) names.affected = clause.fallbacks.affectedName;
  // An outcome's subject is independent of the opener's item/subject role.
  names.result = clause.fallbacks.result || (/\/(reveal|conceal)$/.test(clause.key) ? 'the truth' : 'the outcome');
  for (const [key, value] of Object.entries(clause.fallbacks)) if (!['affected', 'affectedName', 'result'].includes(key)) names[key] = value;
  for (const [role, value] of Object.entries(workshop.bindings?.[clause.key] || {})) {
    const live = beatEntity(game, value?.ref);
    const cleared = !value?.ref && !text(value?.name);
    names[role] = live?.title || live?.name || text(value?.name) || (cleared && BEAT_SLOT_DEFAULTS[role] ? beatRoleNames({roles:{}},game)[role] : names[role]);
  }
  return names;
}
export function beatClauseText(workshop, game, clause) {
  let template = clause.template;
  for (const [role, phrase] of Object.entries(clause.optional || {})) {
    const value = workshop.bindings?.[clause.key]?.[role] || workshop.roles?.[role];
    if (!value?.ref && !text(value?.name)) template = template.replace(phrase, '');
  }
  const names = beatClauseNames(workshop, game, clause);
  if (clause.key === 'opener/information/rumour') {
    const a = workshop.bindings?.[clause.key]?.actor || workshop.roles.actor;
    const b = workshop.bindings?.[clause.key]?.other || workshop.roles.other;
    const same = a?.ref && b?.ref ? beatRefKey(a.ref) === beatRefKey(b.ref)
      : !a?.ref && !b?.ref && text(a?.name) && text(a.name) === text(b?.name);
    if (same) return names.other + ' hears a rumour about themselves';
  }
  return fill(template, names);
}
export function beatClauseSegments(workshop, game, clause) {
  const names = beatClauseNames(workshop, game, clause);
  return clause.template.split(/(\{\w+\})/).filter(Boolean).map((part, index) => {
    const match = /^\{(\w+)\}$/.exec(part), role = match?.[1];
    if (!clause.roles[role]) return { key: index, text: part };
    const source=role.startsWith('response_')&&clause.conditionSource?clause.conditionSource:clause;
    const baseRole=source!==clause?role.slice('response_'.length):role;
    const inheritedRole=baseRole==='affected'&&source.affectedFrom?source.affectedFrom:baseRole;
    const openerKey=(source.contextual||source.inheritsOpener)?beatBaseSectionClauses(workshop,'opener')[0]?.key:null;
    const saved = workshop.bindings?.[clause.key]?.[role] || workshop.bindings?.[source.key]?.[baseRole] || workshop.bindings?.[openerKey]?.[inheritedRole] || workshop.roles?.[inheritedRole];
    return { key: index, clauseKey: clause.key, role, ...clause.roles[role], value: saved, name: names[role], assigned: !!(saved?.ref || text(saved?.name)), missing: !!saved?.ref && !beatEntity(game, saved.ref) };
  });
}
export function beatComplicationText(workshop, game, complicationId) {
  const part = complicationId ? workshop.complications.find(row => row.id === complicationId) : workshop.complication;
  if (!part) return '';
  const clause = beatSectionClauses(workshop, 'complication', complicationId)[0];
  const effect = beatApproach(workshop)==='general'?choice(BEAT_COMPLICATION_EFFECTS, part.effect):null;
  return [clause ? sentence(beatClauseText(workshop, game, clause) + (effect ? ', ' + effect.text : '')) : effect ? sentence('The complication is ' + effect.text) : '', complicationId ? sentence(part.notes) : ''].filter(Boolean).join(' ');
}
export function beatValueSources(game) {
  const sources = [];
  const walk = (nodes, coll, parentPath = []) => {
    for (const node of Object.values(nodes || {})) {
      const records = [...list(node.narrativeWizardHistory), ...(node.narrativeWizard ? [node.narrativeWizard] : [])];
      for (const saved of new Map(records.filter(row => row.sourceId === 'humanValues' && row.valuesDraft).map(row => [row.sessionId || row.title, row])).values()) {
        const ref = { coll, parentPath, nodeId: node.id };
        sources.push({ key: JSON.stringify([beatRefKey(ref), saved.sessionId || saved.title]), ref, sessionId: saved.sessionId, title: saved.title || node.title, node, record: saved });
      }
      if (node.sub?.nodes) walk(node.sub.nodes, coll, [...parentPath, node.id]);
    }
  };
  GRAPH_COLLECTIONS.forEach(coll => walk(game?.[coll], coll));
  return sources;
}
export function beatStakesValues(workshop, game) {
  const source = workshop.stakes?.source;
  if (source) {
    const live = beatValueSources(game).find(row => beatRefKey(row.ref) === beatRefKey(source.ref) && (source.sessionId ? row.sessionId === source.sessionId : row.title === source.title));
    return { rows: live ? list(live.record.valuesDraft.values).filter(row => row.column === 'inPlay') : list(source.snapshot), source: live, missing: !live };
  }
  const definitions = [...VALUES_LIBRARY, ...list(game?.humanValuesLibrary)];
  return { rows: list(workshop.stakes?.values).map(row => ({ ...definitions.find(value => value.id === row.valueId), ...row })).filter(row => row.valueId), source: null, missing: false };
}
export function beatWorkshopSentences(node, game) {
  const w = beatWorkshopDetails(node), names = beatRoleNames(w, game);
  const lines = Object.fromEntries(['occasion', 'opener', 'complication', 'involvement', 'consequences', 'stakes'].map(key => [key, []]));
  for (const clause of beatSectionClauses(w, 'occasion')) lines.occasion.push(sentence(beatClauseText(w, game, clause)));
  for (const clause of beatBaseSectionClauses(w, 'opener')) lines.opener.push(sentence(beatClauseText(w, game, clause)));
  const guide=beatOpenerDefinition(w);
  if(guide){
    const answers=w.opener.guidance?.[guide.key]||{};
    for(const prompt of guide.prompts){
      const selected=prompt.options.find(option=>option.id===answers[prompt.id]);
      if(selected)lines.opener.push(sentence(fill(selected.text,names)));
    }
  }
  for (const clause of beatContextClauses(w, 'opener')) lines.opener.push(sentence(beatClauseText(w, game, clause)));
  for (const id of [null, ...w.complications.map(row => row.id)]) {
    const text = beatComplicationText(w, game, id);
    if (text) lines.complication.push(text);
  }
  for (const clause of beatSectionClauses(w, 'involvement')) lines.involvement.push(sentence(beatClauseText(w, game, clause)));
  for (const row of w.consequences) {
    const condition = beatConsequenceCondition(w, row);
    const outcome = beatSectionClauses(w, 'consequences', row.id)[0];
    if (outcome) {
      const timing = choice(BEAT_TIMING, row.timing)?.text;
      const visibility = choice(BEAT_VISIBILITY, row.visibility)?.text;
      lines.consequences.push(sentence(beatClauseText(w, game, outcome) + (timing ? ` ${timing}` : '') + (visibility ? ` (${visibility})` : '')));
    } else if (condition) {
      const source=beatConditionChoice(w,row)?.source;
      lines.consequences.push(sentence('A possible consequence can follow if '+(source?fill(condition,beatClauseNames(w,game,source)):condition)));
    }
    if (text(row.notes)) lines.consequences.push(sentence(row.notes));
  }
  for (const clause of beatSectionClauses(w, 'stakes')) lines.stakes.push(sentence(beatClauseText(w, game, clause)));
  for (const value of beatStakesValues(w, game).rows) {
    const name = value.label || value.valueId, who = text(value.who), from = text(value.from), to = text(value.to);
    lines.stakes.push(sentence(`${name}${who ? ` for ${who}` : ''}${from && to ? ` could move from ${from.toLowerCase()} to ${to.toLowerCase()}` : from ? ` begins with ${from.toLowerCase()}` : to ? ` could lead to ${to.toLowerCase()}` : ' is at stake'}`));
    if (text(value.why)) lines.stakes.push(sentence(value.why));
  }
  if (w.stakes.morals.length) lines.stakes.push(sentence('Moral tensions include ' + natural(w.stakes.morals)));
  for (const key of Object.keys(lines)) if (text(w.notes[key])) lines[key].push(sentence(w.notes[key]));
  return Object.entries(lines).map(([id, parts]) => ({ id, text: parts.join(' ') })).filter(row => row.text);
}
export const beatWorkshopText = (node, game) => beatWorkshopSentences(node, game).map(row => row.text).join('\n\n');
export function detachBeatWorkshopLinks(workshop) {
  const next = { ...workshop };
  if (workshop.roles) next.roles = Object.fromEntries(Object.entries(workshop.roles).map(([key, value]) => [key, { ...value, ref: null }]));
  if (workshop.participants) next.participants = workshop.participants.map(value => ({ ...value, ref: null }));
  if (workshop.bindings) next.bindings = Object.fromEntries(Object.entries(workshop.bindings).map(([key, roles]) => [key, Object.fromEntries(Object.entries(roles).map(([role, value]) => [role, { ...value, ref: null }]))]));
  if (workshop.stakes?.source) next.stakes = { ...workshop.stakes, source: { ...workshop.stakes.source, ref: null } };
  return next;
}
