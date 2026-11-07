import { uniqueStoryTags } from './storyPlanning.js';
import { beatWorkshopText, detachBeatWorkshopLinks } from './storyBeatWorkshop.js';
export const STORY_BEAT_TYPE = { id: 'storyBeat', label: 'Story Beat', color: '#5CA8F5', icon: 'flag', blurb: 'A story moment with optional situation, objective, dialogue and gameplay sections.' };
export const isStoryBeat = node => !node?.mechKind && ['storyBeat', 'event', 'quest'].includes(node?.kind);
export const STORY_BEAT_SECTIONS = [
  { id: 'situation', label: 'Situation / change', fields: [['situation', 'What happens or changes?'], ['consequences', 'Consequences · optional']] },
  { id: 'objective', label: 'Objective', fields: [['objective', 'What are they trying to achieve?'], ['completion', 'How will you know it is complete? · optional']] },
  { id: 'dialogue', label: 'Dialogue / readout', fields: [['dialogue', 'What is said or read to the players?']] },
  { id: 'gameplay', label: 'Gameplay', fields: [['gameplay', 'What do players do, and how are outcomes decided?']] },
];

export function storyBeatDetails(node) {
  const details = node.storyBeat || {};
  const sections = Array.isArray(details.sections) ? details.sections : node.kind === 'event' ? ['situation'] : node.kind === 'quest' ? ['objective'] : [];
  return {
    ...details,
    impacts: uniqueStoryTags(details.impacts),
    threads: Array.isArray(details.threads) ? details.threads.filter(row => row && typeof row.id === 'string') : [],
    sections: [...new Set(sections.filter(id => STORY_BEAT_SECTIONS.some(section => section.id === id)))],
    conversationIds: Array.isArray(details.conversationIds) ? [...new Set(details.conversationIds.filter(id => typeof id === 'string'))] : [],
    mechanicRefs: Array.isArray(details.mechanicRefs) ? details.mechanicRefs.filter(ref => ref && ['nodes', 'masterNodes', 'taskNodes'].includes(ref.coll) && typeof ref.nodeId === 'string') : [],
  };
}

export const storyBeatPatch = (node, patch) => ({ storyBeat: { ...storyBeatDetails(node), ...patch } });

export function storyBeatReviewText(node) {
  const details = storyBeatDetails(node);
  return [details.impacts.length ? `Story impact: ${details.impacts.join(', ')}` : '', ...details.threads.map(row => `${row.kind === 'inconsistency' ? 'Authoring issue' : 'Story thread'} · ${row.status || 'open'}: ${row.title || 'Untitled'}${row.notes ? '\n' + row.notes : ''}${row.resolution ? '\nResolution: ' + row.resolution : ''}`)].filter(Boolean).join('\n\n');
}
export function storyBeatSectionPatch(node, sectionId, visible) {
  const sections = storyBeatDetails(node).sections;
  return storyBeatPatch(node, { sections: visible ? [...new Set([...sections, sectionId])] : sections.filter(id => id !== sectionId) });
}

export function storyBeatCanvasText(node) {
  const details = storyBeatDetails(node);
  return [...new Set([node.body, beatWorkshopText(node), ...STORY_BEAT_SECTIONS.filter(section => details.sections.includes(section.id)).map(section => details[section.fields[0][0]] ? `${section.label}: ${details[section.fields[0][0]]}` : '')].filter(Boolean))].join('\n\n');
}

export const storyBeatMechanicKey = ref => JSON.stringify([ref.coll, ref.parentPath || [], ref.nodeId]);
export function storyBeatMechanics(project) {
  const records = [];
  const walk = (nodes, coll, parentPath = [], labels = []) => {
    for (const node of Object.values(nodes || {})) {
      const title = node.title || node.name || node.id;
      if (node.mechKind || ['mechanic', 'task'].includes(node.kind)) records.push({ coll, parentPath, nodeId: node.id, title, label: [...labels, title].join(' / ') });
      if (node.sub?.nodes) walk(node.sub.nodes, coll, [...parentPath, node.id], [...labels, title]);
    }
  };
  for (const coll of ['taskNodes', 'masterNodes', 'nodes']) walk(project?.[coll], coll);
  return records;
}

// Game links are selected anew when a saved template is reused. Text stays local
// to the Story Beat, including sections currently hidden from the inspector.
export function detachStoryBeatLinks(value) {
  if (!value || typeof value !== 'object') return value;
  const next = { ...value };
  if (isStoryBeat(value) && value.storyBeat) next.storyBeat = { ...value.storyBeat, conversationIds: [], mechanicRefs: [], ...(value.storyBeat.workshop ? { workshop: detachBeatWorkshopLinks(value.storyBeat.workshop) } : {}) };
  if (value.nodes) next.nodes = Object.fromEntries(Object.entries(value.nodes).map(([id, node]) => [id, detachStoryBeatLinks(node)]));
  if (value.sub) next.sub = detachStoryBeatLinks(value.sub);
  return next;
}
