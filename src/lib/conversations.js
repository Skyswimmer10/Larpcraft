import { conversationIconMetadata } from './conversationIcons.js';

const text = value => typeof value === 'string' ? value.trim() : '';
const COLLECTIONS = ['nodes', 'masterNodes', 'taskNodes', 'storyboardNodes'];
export const characterReference = (scope = {}, nodeId) => ({ coll: scope.coll || 'nodes', parentPath: scope.parentPath || (scope.parentId ? [scope.parentId] : []), nodeId });
export const characterReferenceKey = ref => ref ? JSON.stringify([ref.coll || 'nodes', ref.parentPath || [], ref.nodeId]) : '';
export function conversationCharacterGraph(project, ref) {
  let nodes = project[ref.coll || 'nodes'] || {};
  for (const id of ref.parentPath || []) nodes = nodes[id]?.sub?.nodes || {};
  return { nodes, teams: project.teams, factions: project.factions };
}

export function conversationCharacters(project = {}) {
  const rows = [];
  const visit = (nodes, coll, parentPath = [], labels = []) => {
    for (const node of Object.values(nodes || {})) {
      const name = node.title || node.name || node.id;
      if (node.kind === 'character') {
        const ref = characterReference({ coll, parentPath }, node.id);
        rows.push({ ref, key: characterReferenceKey(ref), name, node, location: [coll === 'nodes' ? 'Narrative' : coll === 'masterNodes' ? 'Master Story' : coll === 'taskNodes' ? 'Mechanics' : 'Storyboard', ...labels].join(' / ') });
      }
      if (node.sub?.nodes) visit(node.sub.nodes, coll, [...parentPath, node.id], [...labels, name]);
    }
  };
  for (const coll of COLLECTIONS) visit(project[coll], coll);
  return rows;
}

export function conversationParticipant(participant, project, characters = conversationCharacters(project)) {
  const live = participant.characterRef && characters.find(row => row.key === characterReferenceKey(participant.characterRef));
  return { ...participant, name: live?.name || participant.name || 'Unnamed speaker', missing: !!participant.characterRef && !live };
}

// Dialogue aliases belong to one conversation; roster/profile names stay canonical.
export const conversationDialogueName = participant => text(participant?.sceneName) || participant?.name || 'Unknown speaker';

export function conversationsForCharacter(project, ref) {
  const key = characterReferenceKey(ref);
  return Object.values(project.conversations || {}).filter(conversation => conversation.participants?.some(participant => participant.characterRef && characterReferenceKey(participant.characterRef) === key));
}

export function createConversation(id, participant) {
  return { id, title: 'New conversation', status: 'planned', context: '', participants: participant ? [participant] : [], passages: [] };
}

const clone = value => JSON.parse(JSON.stringify(value));
export const CONVERSATION_GOALS = [
  { id: 'survival', label: 'Survival', icon: 'user', color: '#80b6d9' },
  { id: 'trust', label: 'Trust', icon: 'heart', color: '#d7b06d' },
  { id: 'mission', label: 'Mission', icon: 'flag', color: '#b89cdd' },
];

export const CONVERSATION_SPEAKER_COLORS = [
  { from: '#6250a6', to: '#483677', edge: '#bfa0ff', label: '#eee4ff' },
  { from: '#147b6a', to: '#125143', edge: '#62e3bb', label: '#d1fff0' },
  { from: '#93651b', to: '#614311', edge: '#ffd079', label: '#fff0c7' },
  { from: '#246ba2', to: '#174568', edge: '#8cd7ff', label: '#e1f5ff' },
  { from: '#984e7b', to: '#653253', edge: '#f6a0ce', label: '#ffe0f1' },
  { from: '#9a4e3c', to: '#673329', edge: '#ffac8c', label: '#ffe9db' },
];

// Profile context is read live. Detached templates retain a snapshot, never a
// game-specific character binding. Goals belong to the exchange, not the person.
export function conversationSpeakerProfile(participant, characters) {
  const node = characters.find(row => row.key === characterReferenceKey(participant?.characterRef))?.node;
  if (!node) return participant?.profileSnapshot || {};
  const fields = node.characterAttributes?.fields || [];
  const traits = fields.filter(field => field.kind !== 'text').flatMap(field => field.values || []).filter(Boolean);
  return {
    ...(node.image?.dataUrl ? { portrait: node.image.dataUrl } : {}),
    ...(node.description || node.body ? { bio: node.description || node.body } : {}),
    ...(traits.length ? { traits: [...new Set(traits)] } : {}),
  };
}

export function conversationLocations(project = {}) {
  const rows = [];
  const visit = (nodes, coll, parentPath = []) => {
    for (const node of Object.values(nodes || {})) {
      if (node.kind === 'storyLocation') {
        const ref = characterReference({ coll, parentPath }, node.id);
        const physical = project.locations?.[node.locationId];
        rows.push({ key: characterReferenceKey(ref), ref, name: node.title || node.name || node.id,
          description: node.description || node.body || '', image: node.image?.dataUrl || physical?.image?.dataUrl || '' });
      }
      if (node.sub?.nodes) visit(node.sub.nodes, coll, [...parentPath, node.id]);
    }
  };
  for (const coll of COLLECTIONS) visit(project[coll], coll);
  for (const location of Object.values(project.locations || {})) {
    rows.push({ key: 'physical:' + location.id, ref: { coll: 'locations', nodeId: location.id }, name: location.name || location.title || location.id, description: location.notes || '', image: location.image?.dataUrl || '' });
  }
  return rows;
}

function detachedConversation(conversation, project) {
  const snapshot = clone(conversation), characters = conversationCharacters(project);
  if (snapshot.location) {
    const live = conversationLocations(project).find(row => characterReferenceKey(row.ref) === characterReferenceKey(snapshot.location.ref));
    const { ref, key, ...location } = live || snapshot.location;
    snapshot.location = location;
  }
  return { ...snapshot, participants: (conversation.participants || []).map(participant => {
    const { characterRef, missing, ...named } = conversationParticipant(participant, project);
    const profileSnapshot = conversationSpeakerProfile(participant, characters);
    return clone({ ...named, ...(Object.keys(profileSnapshot).length ? { profileSnapshot } : {}) });
  }) };
}

export function conversationLibraryRecord(conversation, project, id) {
  const template = { ...detachedConversation(conversation, project), id };
  return { id, name: template.title || 'Untitled conversation', nodeKind: 'conversation', libraryRole: 'content', ...conversationIconMetadata(template), color: '#A8B6FF',
    description: template.context || template.participants.map(row => row.name).join(' · '), template };
}

export function conversationTemplatePatch(record, patch) {
  const template = { ...record.template, ...patch };
  return { template, ...conversationIconMetadata(template), name: template.title || 'Untitled conversation', description: template.context || (template.participants || []).map(row => row.name).join(' · ') };
}

export function conversationFromLibrary(record, id) {
  // A reusable exchange starts as a plan in its new game. Speakers are assigned
  // explicitly; matching names or graph IDs never bind to unrelated characters.
  return { ...detachedConversation(record.template, {}), id, status: 'planned', libraryTemplateId: record.id };
}

export function addConversationParticipant(conversation, participant) {
  if (!text(participant.name) || !participant.id || conversation.participants.some(row => row.id === participant.id || participant.characterRef && characterReferenceKey(row.characterRef) === characterReferenceKey(participant.characterRef))) return conversation;
  return { ...conversation, participants: [...conversation.participants, participant] };
}

export function removeConversationParticipant(conversation, id) {
  if (conversation.passages.some(passage => passage.speakerId === id)) return conversation;
  return { ...conversation, participants: conversation.participants.filter(row => row.id !== id) };
}

export function conversationText(conversation, project = {}) {
  const participants = (conversation.participants || []).map(row => conversationParticipant(row, project));
  const name = id => id === 'narration' ? 'Narration / stage directions' : conversationDialogueName(participants.find(row => row.id === id));
  return [
    conversation.title || 'Untitled conversation',
    conversation.status === 'happened' ? 'Happened in the story' : 'Planned script — not established story history',
    participants.length ? 'Participants: ' + participants.map(row => row.name).join(' · ') : '',
    participants.some(row => text(row.sceneName) && text(row.sceneName) !== row.name) ? 'Dialogue names: ' + participants.filter(row => text(row.sceneName) && text(row.sceneName) !== row.name).map(row => `${row.name} as ${text(row.sceneName)}`).join(' · ') : '',
    text(conversation.context) ? 'Context: ' + conversation.context : '',
    text(conversation.authorGoals) ? 'Author goals / story relevance: ' + conversation.authorGoals : '',
    conversation.location?.name ? 'Location: ' + conversation.location.name : '',
    text(conversation.locationNotes ?? conversation.location?.description) ? 'Location notes: ' + (conversation.locationNotes ?? conversation.location.description) : '',
    ...participants.flatMap(row => CONVERSATION_GOALS.filter(goal => text(row.goals?.[goal.id])).map(goal => `${row.name} — ${row.goalLabels?.[goal.id] || goal.label}: ${row.goals[goal.id]}`)),
    ...(conversation.passages || []).filter(row => text(row.text)).map(row => name(row.speakerId) + ': ' + row.text),
    text(conversation.summary) ? 'Conversation summary: ' + conversation.summary : '',
  ].filter(Boolean).join('\n\n');
}

// Snapshot names follow renames and survive deletion. References include their
// complete graph path, so unrelated characters with matching IDs never link.
export function refreshConversationNames(project) {
  if (!Object.keys(project.conversations || {}).length) return project;
  const characters = conversationCharacters(project);
  let conversations = project.conversations;
  for (const [id, conversation] of Object.entries(conversations)) {
    const participants = (conversation.participants || []).map(row => {
      const current = conversationParticipant(row, project, characters);
      return current.name === row.name ? row : { ...row, name: current.name };
    });
    if (participants.some((row, index) => row !== conversation.participants[index])) {
      if (conversations === project.conversations) conversations = { ...conversations };
      conversations[id] = { ...conversation, participants };
    }
  }
  return conversations === project.conversations ? project : { ...project, conversations };
}
