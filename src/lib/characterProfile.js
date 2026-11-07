// Character descriptions are derived from accepted, editable sources. No model
// service is called and no unrecorded behaviour is inferred.
import { questionAnswer, savedWizardSession } from './narrativeMemory.js';
import { createFateDraft, fateOutput } from './fateWizard.js';
import { createKolbDraft, kolbOutput } from './kolbWizard.js';
import { createValuesDraft, valuesOutput } from './humanValuesWizard.js';
import { metaProgramNarrative } from './metaProgramNarrative.js';
import { characterFactsText, refreshCharacterRelationships, remapCharacterRelationships } from './characterFacts.js';
import { relationshipDescriptionText } from './relationships.js';
import { fateCharacterEntities, refreshFateCharacterLinks, remapFateCharacterReferences } from './fateCharacter.js';
import { syncCharacterCanvas } from './characterCanvas.js';
import { GROUP_FOUNDATIONS_ID, groupFoundationsText, groupFactsText, refreshGroupFacts, remapGroupReferences, syncGroupRoster } from './groupFoundations.js';
import { generatedDescriptionParagraphs, editDescriptionParagraphs, syncDescriptionParagraphs, descriptionParagraphText, resolveDescriptionParagraph } from './descriptionParagraphs.js';
import { conversationText } from './conversations.js';
import { characterAttributesText } from './characterAttributes.js';
import { characterMediaText } from './research.js';

export const isProfileNode = node => ['character', 'group'].includes(node?.kind);

const clean = value => typeof value === 'string' ? value.trim() : '';
const clone = value => JSON.parse(JSON.stringify(value));
const sentence = value => {
  const text = clean(value);
  return text ? text[0].toLocaleUpperCase() + text.slice(1) + (/[.!?…][”"']?$/.test(text) ? '' : '.') : '';
};
const unique = values => [...new Set(values.map(clean).filter(Boolean))];
export const CHARACTER_INPUT_LABEL = 'Character input';
export const CHARACTER_DETAILS = [
  ['background', 'Background and identity'], ['goals', 'Goals and motivations'],
  ['relationships', 'Relationships and loyalties'], ['voice', 'Voice and speech'],
  ['knowledge', 'What they know'], ['secrets', 'Secrets'],
  ['conditions', 'Situations and exceptions'], ['possibilities', 'Possible changes'],
  ['openQuestions', 'Unanswered questions'], ['tensions', 'Tensions to review between inputs'],
];
export const wizardSessionKey = record => record.sessionId || `${record.sourceType}:${record.sourceId}:${record.title}`;
export function characterWizardRecords(node) {
  return [...new Map([...(node?.narrativeWizardHistory || []), ...(node?.narrativeWizard ? [node.narrativeWizard] : [])]
    .filter(record => record?.sourceId).map(record => [wizardSessionKey(record), record])).values()]
    .map(record => record.sourceId === GROUP_FOUNDATIONS_ID && record.sourceType !== 'framework' ? { ...record, sourceType: 'framework' } : record);
}

export function characterRecordProse(record) {
  if (record.summaryFormat?.includes('prose')) return clean(record.summary);
  const parts = [record.context];
  for (const role of record.roles || []) if (clean(role.replacement)) parts.push(`${role.label || role.original}: ${role.replacement}`);
  for (const row of record.questions || []) {
    const answer = questionAnswer(row, record.answers);
    if (!answer) continue;
    const choice = row.choiceAnswerKey && clean(record.answers?.[row.choiceAnswerKey]);
    if (choice) parts.push(`A recorded preference is ${choice.replaceAll(' | ', ', ')}`);
    const written = clean(record.answers?.[row.textAnswerKey || row.key]);
    if (written) parts.push(row.key === 'archetype' ? `Their chosen archetype is ${written}` : written);
  }
  return unique(parts).map(sentence).join(' ');
}

function currentRecord(node, record) {
  const answers = savedWizardSession(node, {}, record)?.answers || record.answers;
  if (record.sourceId === GROUP_FOUNDATIONS_ID) {
    const summary = groupFoundationsText(answers, { institution: !!node.groupFacts?.institution });
    return JSON.stringify(answers) === JSON.stringify(record.answers) && summary === record.summary ? record : { ...record, answers, summary };
  }
  if (JSON.stringify(answers) === JSON.stringify(record.answers)) return record;
  const next = { ...record, answers };
  if (record.fateDraft) { next.fateDraft = createFateDraft({ record, answers, id: record.fateDraft.id }); next.summary = fateOutput(next.fateDraft); }
  if (record.kolbDraft) { next.kolbDraft = createKolbDraft({ record, answers, id: record.kolbDraft.id }); next.summary = kolbOutput(next.kolbDraft); }
  if (record.valuesDraft) { next.valuesDraft = createValuesDraft({ record, answers, id: record.valuesDraft.id }); next.summary = valuesOutput(next.valuesDraft); }
  if (record.sourceId === 'nlpMetaPrograms') next.summary = record.narrativeText ?? metaProgramNarrative({ answers, context: record.context });
  return next;
}

function generatedRecordProse(record) {
  for (const [key, output] of [['fateDraft', fateOutput], ['kolbDraft', kolbOutput], ['valuesDraft', valuesOutput]]) {
    if (record[key]) { const draft = clone(record[key]); delete draft.output.text; return clean(output(draft)); }
  }
  if (record.sourceId === 'nlpMetaPrograms' && record.focus === 'character') return metaProgramNarrative({ answers: record.answers, context: record.context });
  return characterRecordProse(record);
}

export function characterInputSnapshot(node) {
  return { title: node.title || node.name || 'Untitled input', kind: node.kind,
    ...(node.frameworkId ? { frameworkId: node.frameworkId } : {}),
    body: node.body || node.description || '', records: clone(characterWizardRecords(node).map(record => currentRecord(node, record))) };
}

export function characterSources(node, graph = {}) {
  const profile = node.characterProfile || {};
  const rows = characterWizardRecords(node).map(record => currentRecord(node, record)).map(record => ({
    key: `wizard:${wizardSessionKey(record)}`, label: record.title || record.sourceLabel,
    sourceLabel: record.sourceLabel, record, text: characterRecordProse(record), generated: generatedRecordProse(record),
  }));
  for (const link of profile.links || []) {
    const live = !link.detached && graph.nodes?.[link.nodeId];
    const snapshot = live ? characterInputSnapshot(live) : link.snapshot;
    if (!snapshot) continue;
    const records = snapshot.records || [];
    rows.push({ key: `node:${link.nodeId}`, nodeId: link.nodeId, label: snapshot.title, frameworkId: snapshot.frameworkId, missing: !live, detached: link.detached,
      sourceLabel: unique(records.map(record => record.sourceLabel || record.sourceId)).join(' · ') || (snapshot.kind === 'framework' ? snapshot.frameworkId || 'Framework reference' : 'Canvas concept'),
      records, canvas: live?.sub, text: unique(records.length ? records.map(characterRecordProse) : [snapshot.body]).join('\n\n'),
      generated: unique(records.length ? records.map(generatedRecordProse) : [snapshot.body]).join('\n\n') });
  }
  return rows.map(row => ({ ...row, enabled: !profile.excluded?.includes(row.key) }));
}

export function characterUsesMasculineArchetypes(node, graph = {}) {
  return characterSources(node, graph).some(row => row.enabled && (row.frameworkId === 'jungianMasculineArchetypes'
    || row.record?.sourceId === 'jungianMasculineArchetypes' || row.records?.some(record => record.sourceId === 'jungianMasculineArchetypes')));
}

// Explicit activation avoids rewriting existing authored characters on startup.
export function enableCharacterProfile(node) {
  if (node.characterProfile) return node;
  const originals = unique([node.body, node.description]);
  const baseline = unique(originals.map(value => {
    for (const record of characterWizardRecords(node)) if (clean(record.summary)) value = value.split(record.summary).join('').trim();
    return value;
  })).join('\n\n');
  return { ...node, characterProfile: { version: 1, details: {}, links: [], excluded: [],
    blocks: baseline ? [{ key: 'background', generated: baseline, text: baseline }] : [], baseline } };
}

// Also protect introductions added through older inspectors/imported documents
// that did not yet record a manual-description override.
export function captureCharacterWriting(node) {
  const profile = node.characterProfile;
  if (profile?.descriptionParagraphs) return node;
  if (!profile || profile.manualDescription !== undefined || clean(node.body) === clean(profile.generated)) return node;
  let remainder = clean(node.body);
  let recognized = false;
  for (const text of [...characterWizardRecords(node).map(record => record.summary), ...(profile.blocks || []).map(block => block.text)]) {
    if (clean(text) && remainder.includes(text)) { remainder = remainder.split(text).join('').trim(); recognized = true; }
  }
  if (recognized) return { ...node, characterProfile: { ...profile, baseline: unique([profile.baseline, remainder]).join('\n\n') } };
  return { ...node, characterProfile: { ...profile, manualDescription: node.body || '', manualReviewed: profile.generated } };
}

export function syncCharacterProfile(node, graph = {}) {
  if (!isProfileNode(node) || !node.characterProfile) return node;
  const profile = node.characterProfile;
  const sources = characterSources(node, graph);
  const candidates = [
    ...(node.kind === 'group' ? [{ key: 'group:facts', text: groupFactsText(node) }] : []),
    { key: 'background', text: clean(profile.baseline) },
    ...CHARACTER_DETAILS.filter(([key]) => !['goals', 'secrets', 'possibilities', 'openQuestions', 'tensions'].includes(key) && !(key === 'voice' && profile.performanceText !== undefined))
      .map(([key]) => ({ key: `detail:${key}`, text: sentence(profile.details?.[key]) })),
    ...(node.archetypeEnabled && characterUsesMasculineArchetypes(node, graph) ? ['archetypeDarkSideUp', 'archetypeDarkSideBack'].filter(key => clean(node[key])).map(key => ({ key: `archetype:${key}`, text: sentence(`One recorded dark side is ${node[key]}`) })) : []),
    ...sources.filter(row => row.enabled).map(row => ({ key: row.key, text: row.text, generated: row.generated })),
    ...(node.questions || []).filter(q => clean(q.answer) && !characterWizardRecords(node).some(record => Object.values(record.questionIds || {}).includes(q.id)))
      .map(q => ({ key: `question:${q.id}`, text: sentence(q.answer) })),
    ...(node.typeGroups || []).filter(group => !/^role$/i.test(group.label)).flatMap(group => {
      const selected = group.options?.find(option => option.id === group.selectedId);
      return selected ? [{ key: `type:${group.id}`, text: sentence(`${group.label}: ${selected.label}`) }] : [];
    }),
  ];
  const oldBlocks = profile.blocks || [];
  const candidateMap = new Map(candidates.map(row => [row.key, row]));
  const blocks = candidates.filter(row => row.text).map(row => {
    const generated = row.generated ?? row.text;
    const old = oldBlocks.find(block => block.key === row.key);
    const preferGenerated = old?.preferGenerated && old.sourceOverride === row.text;
    const text = preferGenerated ? generated : row.text;
    if (!old || old.text === old.generated || old.sourceText !== row.text && old.text === old.sourceText) return { key: row.key, generated, text, sourceText: row.text, ...(preferGenerated ? { preferGenerated: true, sourceOverride: row.text } : {}) };
    // Keep a manual passage until its proposed replacement is accepted.
    const proposed = old.sourceText !== row.text ? row.text : generated;
    const pending = old.generated !== generated || old.sourceText !== row.text ? proposed : undefined;
    return { ...old, sourceText: row.text, pending };
  });
  for (const old of oldBlocks) if (!candidateMap.get(old.key)?.text && old.text !== old.generated) blocks.push({ ...old, pending: old.generated !== '' ? '' : undefined });
  const linked = (profile.links || []).map(link => !link.detached && graph.nodes?.[link.nodeId]
    ? { ...link, snapshot: characterInputSnapshot(graph.nodes[link.nodeId]) } : link);
  const seen = new Set();
  const paragraphs = blocks.map(block => block.text).filter(value => {
    const key = clean(value).toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
  const generated = paragraphs.join('\n\n');
  let descriptionParagraphs = profile.descriptionParagraphs;
  if (!descriptionParagraphs && profile.manualDescription !== undefined) {
    descriptionParagraphs = editDescriptionParagraphs(generatedDescriptionParagraphs(oldBlocks), profile.manualDescription);
  }
  if (descriptionParagraphs) descriptionParagraphs = syncDescriptionParagraphs(descriptionParagraphs, blocks);
  const nextProfile = { ...profile, blocks, links: linked, generated,
    ...(descriptionParagraphs ? { descriptionParagraphs, manualDescription: undefined, manualReviewed: undefined } : {}) };
  // A whole-description override is also preserved, with a reviewable proposal.
  const body = descriptionParagraphs ? descriptionParagraphText(descriptionParagraphs) : profile.manualDescription === undefined ? generated : profile.manualDescription;
  const next = syncGroupRoster(syncCharacterCanvas({ ...node, body, description: body, characterProfile: nextProfile }, sources));
  return JSON.stringify(next) === JSON.stringify(node) ? node : next;
}

export function characterProfilePatch(node, graph, patch) {
  const active = enableCharacterProfile(node);
  if ('manualDescription' in patch && !('descriptionParagraphs' in patch)) patch = { ...patch, descriptionParagraphs: undefined };
  return syncCharacterProfile({ ...active, characterProfile: { ...active.characterProfile, ...patch } }, graph);
}

export function editCharacterDescription(node, graph, text) {
  const active = syncCharacterProfile(enableCharacterProfile(node), graph);
  const previous = active.characterProfile.descriptionParagraphs || generatedDescriptionParagraphs(active.characterProfile.blocks);
  return characterProfilePatch(active, graph, { descriptionParagraphs: editDescriptionParagraphs(previous, text), manualDescription: undefined });
}

export function reviewCharacterDescription(node, graph, id, accept, editedText) {
  return characterProfilePatch(node, graph, { descriptionParagraphs: resolveDescriptionParagraph(node.characterProfile.descriptionParagraphs || [], id, accept, editedText) });
}

export const characterDescriptionReviews = node => (node.characterProfile?.descriptionParagraphs || []).filter(row => row.pending !== undefined);

// Deletion removes canonical answers as well as their generated views. Unlike
// exclusion, it must not leave a protected source passage waiting for review.
export function removeCharacterInput(node, graph, key) {
  const sources = characterSources(node, graph), source = sources.find(row => row.key === key);
  if (!source) return node;
  const active = enableCharacterProfile(node), profile = active.characterProfile;
  const records = characterWizardRecords(active), removed = source.record ? [source.record] : [];
  const removedKeys = new Set(removed.map(wizardSessionKey));
  const remaining = records.filter(record => !removedKeys.has(wizardSessionKey(record)));
  const questionIds = new Set(removed.flatMap(record => Object.values(record.questionIds || {})));
  const keptQuestionIds = new Set(remaining.flatMap(record => Object.values(record.questionIds || {})));
  for (const record of removed) for (const definition of record.questions || []) if (!record.questionIds?.[definition.key]) {
    const answer = questionAnswer(definition, record.answers);
    const shared = remaining.some(other => other.questions?.some(row => row.prompt === definition.prompt && questionAnswer(row, other.answers) === answer));
    if (!shared) for (const question of active.questions || []) if (question.prompt === definition.prompt && question.answer === answer) questionIds.add(question.id);
  }
  for (const id of keptQuestionIds) questionIds.delete(id);
  const childIds = new Set(Object.values(active.sub?.nodes || {}).filter(child => child.characterInput?.key === key).map(child => child.id));
  for (const record of removed) if (record.attachedChildId && !remaining.some(other => other.attachedChildId === record.attachedChildId)) childIds.add(record.attachedChildId);
  const oldBlock = profile.blocks?.find(block => block.key === key);
  const ownedText = unique([source.text, source.generated, source.record?.summary, oldBlock?.text, oldBlock?.generated])
    .filter(value => !sources.some(other => other.key !== key && (other.text?.includes(value) || other.generated?.includes(value)))).sort((a, b) => b.length - a.length);
  let manualDescription = profile.manualDescription;
  if (manualDescription !== undefined) for (const value of ownedText) manualDescription = manualDescription.split(value).join('').replace(/\n{3,}/g, '\n\n').trim();
  const next = { ...active,
    narrativeWizard: active.narrativeWizard && !removedKeys.has(wizardSessionKey(active.narrativeWizard)) ? active.narrativeWizard : remaining.at(-1),
    narrativeWizardHistory: remaining,
    questions: (active.questions || []).filter(question => !questionIds.has(question.id)),
    characterProfile: { ...profile,
      links: (profile.links || []).filter(link => `node:${link.nodeId}` !== key),
      excluded: (profile.excluded || []).filter(value => value !== key),
      blocks: (profile.blocks || []).filter(block => block.key !== key && ![...questionIds].some(id => block.key === `question:${id}`)),
      ...(profile.descriptionParagraphs ? { descriptionParagraphs: profile.descriptionParagraphs.filter(row => row.sourceKey !== key && ![...questionIds].some(id => row.sourceKey === `question:${id}`)) } : {}),
      ...(manualDescription !== undefined ? { manualDescription, manualReviewed: undefined } : {}),
    },
    ...(active.characterCanvas ? { characterCanvas: { ...active.characterCanvas, hidden: (active.characterCanvas.hidden || []).filter(value => value !== key) } } : {}),
    ...(active.sub ? { sub: { ...active.sub, nodes: Object.fromEntries(Object.entries(active.sub.nodes || {}).filter(([id]) => !childIds.has(id))), edges: (active.sub.edges || []).filter(edge => !childIds.has(edge.from) && !childIds.has(edge.to)) } } : {}),
  };
  return syncCharacterProfile(next, graph);
}

export function resolveCharacterPassage(node, graph, key, accept) {
  const source = characterSources(node, graph).find(row => row.key === key);
  return characterProfilePatch(node, graph, { blocks: node.characterProfile.blocks.map(block => block.key === key
    ? { ...block, generated: block.pending, text: accept ? block.pending : block.text, pending: undefined,
      preferGenerated: !!(accept && source && block.pending === source.generated), sourceOverride: source?.text } : block) });
}

// A copied character must follow copied inputs, never an unrelated node with a
// coincidentally matching ID in the destination graph.
export function remapCharacterInputs(node, idMap = {}, scope) {
  node = remapGroupReferences(node, idMap, scope);
  node = remapFateCharacterReferences(node, idMap);
  node = remapCharacterRelationships(node, idMap);
  if (!node.characterProfile) return node;
  const remapped = new Set((node.characterProfile.links || []).filter(link => !link.detached && idMap[link.nodeId]).map(link => link.nodeId));
  const remapKey = key => key.startsWith('node:') && remapped.has(key.slice(5)) ? `node:${idMap[key.slice(5)]}` : key;
  return { ...node,
    ...(node.characterCanvas ? { characterCanvas: { ...node.characterCanvas, hidden: (node.characterCanvas.hidden || []).map(remapKey) } } : {}),
    ...(node.sub ? { sub: { ...node.sub, nodes: Object.fromEntries(Object.entries(node.sub.nodes || {}).map(([id, child]) => [id, child.characterInput
      ? { ...child, characterInput: { ...child.characterInput, key: remapKey(child.characterInput.key), ...(remapped.has(child.characterInput.linkedNodeId) ? { linkedNodeId: idMap[child.characterInput.linkedNodeId] } : {}) } } : child])) } } : {}),
    characterProfile: { ...node.characterProfile,
    links: (node.characterProfile.links || []).map(link => idMap[link.nodeId] && !link.detached ? { ...link, nodeId: idMap[link.nodeId] } : { ...link, detached: true }),
    blocks: (node.characterProfile.blocks || []).map(block => ({ ...block, key: remapKey(block.key) })),
    ...(node.characterProfile.descriptionParagraphs ? { descriptionParagraphs: node.characterProfile.descriptionParagraphs.map(row => ({ ...row, sourceKey: row.sourceKey ? remapKey(row.sourceKey) : undefined })) } : {}),
    excluded: (node.characterProfile.excluded || []).map(remapKey),
  } };
}

// Recompute within the same reducer transaction, so save, export and graph undo
// agree. Only opted-in profiles are touched, including deep Master Act lanes.
export function syncProjectCharacters(state, before = state, action = {}) {
  if (!state || !['UPDATE_ENTITY', 'ADD_NODE', 'ADD_ENTITY', 'GRAPH_ADD_NODE', 'GRAPH_UPDATE_NODE', 'DELETE_NODE', 'GRAPH_DELETE_NODE', 'DELETE_ENTITY', 'SYNC_CHARACTER_ARCHETYPE', 'REMOVE_EDGE', 'GRAPH_REMOVE_EDGE'].includes(action.type)) return state;
  if (action.patch && Object.keys(action.patch).every(key => ['x', 'y', 'w', 'h', 'color', 'collapsed'].includes(key))) return state;
  const fateEntities = fateCharacterEntities(state);
  const refreshRecord = record => {
    if (!record?.fateDraft || record.focus !== 'character') return record;
    const draft = refreshFateCharacterLinks(record.fateDraft, fateEntities);
    return draft === record.fateDraft ? record : { ...record, fateDraft: draft, summary: fateOutput(draft) };
  };
  const visit = (nodes = {}, previous = {}, coll, path = [], edges = [], previousEdges = []) => {
    let output = nodes;
    for (const [id, node] of Object.entries(nodes)) {
      let next = node;
      if (node.sub?.nodes) {
        const children = visit(node.sub.nodes, previous[id]?.sub?.nodes, coll, [...path, id], node.sub.edges, previous[id]?.sub?.edges);
        if (children !== node.sub.nodes) next = { ...node, sub: { ...node.sub, nodes: children } };
      }
      if (next.kind === 'character') next = refreshCharacterRelationships(next, { nodes, teams: state.teams, factions: state.factions });
      if (next.kind === 'character') {
        const wizard = refreshRecord(next.narrativeWizard), history = next.narrativeWizardHistory?.map(refreshRecord);
        if (wizard !== next.narrativeWizard || history?.some((record, index) => record !== next.narrativeWizardHistory[index])) next = { ...next, ...(wizard ? { narrativeWizard: wizard } : {}), ...(history ? { narrativeWizardHistory: history } : {}) };
      }
      if (next.kind === 'group') next = refreshGroupFacts(next, state);
      if (isProfileNode(next) && next.characterProfile) {
        const old = previous[id];
        const actionPath = action.scope?.parentPath || (action.scope?.parentId ? [action.scope.parentId] : []);
        const correctGraph = action.type === 'UPDATE_ENTITY' ? action.coll === coll && !path.length
          : (action.scope?.coll || 'nodes') === coll && JSON.stringify(path) === JSON.stringify(actionPath);
        const isDirect = ['UPDATE_ENTITY', 'GRAPH_UPDATE_NODE'].includes(action.type) && correctGraph && action.id === id && node !== old;
        if (isDirect && action.patch && ('body' in action.patch || 'description' in action.patch) && !('narrativeWizard' in action.patch) && !('characterProfile' in action.patch)) {
          next = editCharacterDescription(next, { nodes, teams: state.teams, factions: state.factions }, action.patch.description ?? action.patch.body);
        }
        const sourcePool = coll === 'nodes' && !path.length ? { ...nodes, ...state.frameworks } : nodes;
        const links = (next.characterProfile.links || []).filter(link => link.detached || !sourcePool[link.nodeId]
          || !previousEdges.some(edge => edge.from === link.nodeId && edge.to === id)
          || edges.some(edge => edge.from === link.nodeId && edge.to === id));
        if (links.length !== (next.characterProfile.links || []).length) next = { ...next, characterProfile: { ...next.characterProfile, links } };
        next = syncCharacterProfile(next, { nodes: sourcePool, teams: state.teams, factions: state.factions });
      }
      if (next !== node) { if (output === nodes) output = { ...nodes }; output[id] = next; }
    }
    return output;
  };
  let result = state;
  for (const coll of ['nodes', 'taskNodes', 'masterNodes', 'storyboardNodes']) {
    if (!state[coll]) continue;
    const edgeKey = coll === 'nodes' ? 'edges' : coll.replace('Nodes', 'Edges');
    const nodes = visit(state[coll], before?.[coll], coll, [], state[edgeKey], before?.[edgeKey]);
    if (nodes !== state[coll]) result = { ...result, [coll]: nodes };
  }
  return result;
}

export function characterExport(node, graph = {}, format = 'full', { includeQuestions = false, conversations = [], conversationProject = graph } = {}) {
  const current = syncCharacterProfile(node, graph);
  const profile = current.characterProfile || {};
  const description = clean(current.description ?? current.body);
  const attributes = current.kind === 'character' ? characterAttributesText(current) : '';
  if (format === 'short') return unique((description || attributes).split(/\n\s*\n|\n/).map(paragraph => paragraph.split(/(?<=[.!?])\s+/u)[0])).slice(0, 4).join(' ');
  const facts = characterFactsText(current, graph);
  const relationshipDetails = relationshipDescriptionText(current);
  if (format === 'full') return [facts, ...(attributes ? [`Quick attributes\n${attributes}`] : []), description, ...(relationshipDetails ? [`Relationships\n${relationshipDetails}`] : [])].filter(Boolean).join('\n\n');
  const lines = [`# ${current.title || current.name || 'Character'}`, ...(facts ? ['## Character facts', facts] : []), ...(attributes ? ['## Quick attributes', attributes] : []), '## Character description', description];
  if (relationshipDetails) lines.push('## Relationship descriptions', relationshipDetails);
  for (const [key, label] of CHARACTER_DETAILS) if (clean(profile.details?.[key]) && !(key === 'goals' && current.characterFacts?.goal !== undefined) && !(key === 'voice' && profile.performanceText !== undefined)) lines.push(`## ${label}`, profile.details[key]);
  if (clean(profile.performanceText)) lines.push('## Voice, dialogue and performance', profile.performanceText);
  const media = characterMediaText(current);
  if (media) lines.push('## Media reference notes', media);
  const sources = characterSources(current, graph).filter(row => row.enabled);
  if (sources.length) lines.push('## Accepted writing sources', ...sources.map(row => `${row.label} — ${row.sourceLabel || row.record?.sourceId || 'Concept'}${row.missing ? ' (saved copy)' : ''}`));
  if (includeQuestions) for (const source of sources) for (const record of source.record ? [source.record] : source.records || []) {
    const answers = (record.questions || []).map(row => ({ prompt: row.prompt, answer: questionAnswer(row, record.answers) })).filter(row => row.answer);
    if (answers.length) lines.push(`## Writing notes — ${record.title || 'Input'} · ${record.sourceLabel || record.sourceId}`, 'These are authored writing notes; planned scenes and possible responses are not established events.', ...answers.map(row => `${row.prompt}\n${row.answer}`));
  }
  if (conversations.length) lines.push('## Selected conversations', 'Planned scripts are proposals, not established events. Only exchanges explicitly marked as happened are story history.', ...conversations.map(conversation => conversationText(conversation, conversationProject)));
  const pending = (profile.blocks || []).filter(block => block.pending !== undefined).length;
  if (pending || characterDescriptionReviews(current).length || profile.manualDescription !== undefined && profile.manualDescription !== profile.generated && profile.manualReviewed !== profile.generated) lines.push('## Writer review', 'The description contains protected manual wording. Source changes await review; use the approved description above.');
  lines.push('## Instructions for dialogue and story generation',
    'Use the recorded description and details as context. Frameworks are writing lenses, not diagnoses. Situations and exceptions qualify general tendencies. Secrets are writer-only knowledge unless the story establishes that another person knows them. Possible changes are possibilities, not events that have happened. Do not invent answers to unanswered questions or assume a fixed emotional response.');
  return lines.filter(Boolean).join('\n\n');
}
