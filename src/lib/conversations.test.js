import { describe, expect, it } from 'vitest';
import { characterReference, characterReferenceKey, conversationCharacters, conversationParticipant, conversationsForCharacter, createConversation, addConversationParticipant, removeConversationParticipant, conversationText } from './conversations.js';
import { makeEmptyProject, migrateProject } from '../data/seed.js';
import { undoableReducer } from '../state/store.jsx';
import { reducer } from '../state/reducer.js';
import { characterExport } from './characterProfile.js';
import { createWorkspaceBackup, readWorkspaceBackup } from './workspaceTransfer.js';
import { makeLibrarySeed } from '../data/seed.js';

const ref = id => characterReference({ coll: 'nodes' }, id);
const person = (id, name) => ({ id: 'speaker-' + id, name, characterRef: ref(id) });
const fixture = () => ({ ...makeEmptyProject(), nodes: { A: { id: 'A', kind: 'character', title: 'Moro', body: 'A cautious guide.' }, B: { id: 'B', kind: 'character', title: 'Uno' }, G: { id: 'G', kind: 'group', title: 'The council' } } });
const conversation = () => ({
  ...addConversationParticipant(createConversation('talk', person('A', 'Moro')), person('B', 'Uno')),
  title: 'At the closed gate', passages: [{ id: 'line', speakerId: 'speaker-A', text: 'Who sent you?' }, { id: 'direction', speakerId: 'narration', text: 'The gate opens.' }],
});

describe('shared conversations', () => {
  it('uses one canonical record from every participant and does not invent relationships', () => {
    let project = reducer(fixture(), { type: 'ADD_ENTITY', coll: 'conversations', entity: conversation() });
    expect(conversationsForCharacter(project, ref('A'))[0]).toBe(conversationsForCharacter(project, ref('B'))[0]);
    project = reducer(project, { type: 'UPDATE_ENTITY', coll: 'conversations', id: 'talk', patch: { title: 'At sunrise' } });
    expect(conversationsForCharacter(project, ref('A'))[0].title).toBe('At sunrise');
    expect(conversationsForCharacter(project, ref('B'))[0].title).toBe('At sunrise');
    expect(project.nodes.A.characterFacts).toBeUndefined();
    expect(project.nodes.B.characterFacts).toBeUndefined();
  });

  it('supports profile-less names, prevents duplicate links, and never drops passages when removing a speaker', () => {
    const original = conversation(), named = { id: 'captain', name: 'The captain' };
    const added = addConversationParticipant(original, named);
    expect(added.participants).toContain(named);
    expect(addConversationParticipant(added, { ...person('A', 'Moro'), id: 'duplicate' })).toBe(added);
    expect(removeConversationParticipant(added, 'speaker-A')).toBe(added);
    expect(removeConversationParticipant(added, 'captain').participants).not.toContain(named);
    const project = { ...fixture(), conversations: { talk: { ...original, participants: [named] } } };
    expect(conversationsForCharacter(project, ref('A'))).toEqual([]);
    expect(conversationText(added)).toContain('The captain');
  });

  it('disambiguates repeated character IDs by complete nested graph scope and ignores non-character nodes', () => {
    let project = fixture();
    project.masterNodes = { ACT: { id: 'ACT', kind: 'masterAct', sub: { nodes: { A: { id: 'A', kind: 'character', title: 'Another Moro' } } } } };
    const nested = characterReference({ coll: 'masterNodes', parentId: 'ACT' }, 'A');
    expect(characterReferenceKey(nested)).not.toBe(characterReferenceKey(ref('A')));
    expect(conversationCharacters(project)).toHaveLength(3);
    project.conversations = { talk: createConversation('talk', { id: 'nested', name: 'Another Moro', characterRef: nested }) };
    expect(conversationsForCharacter(project, nested)).toHaveLength(1);
    expect(conversationsForCharacter(project, ref('A'))).toHaveLength(0);
    project = reducer(project, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'masterNodes', parentId: 'ACT' }, id: 'A', patch: { title: 'Renamed nested Moro' } });
    expect(project.conversations.talk.participants[0].name).toBe('Renamed nested Moro');
    expect(project.nodes.A.title).toBe('Moro');
  });

  it('follows renames, retains names when a character is deleted, and supports undo for script edits and deletion', () => {
    let state = { present: { ...fixture(), conversations: { talk: conversation() } }, past: [], undoGroup: null };
    state = undoableReducer(state, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'A', patch: { title: 'Moro the guide' } });
    expect(state.present.conversations.talk.participants[0].name).toBe('Moro the guide');
    const renamed = state.present;
    state = undoableReducer(state, { type: 'GRAPH_DELETE_NODE', scope: { coll: 'nodes' }, id: 'A' });
    expect(conversationParticipant(state.present.conversations.talk.participants[0], state.present)).toMatchObject({ name: 'Moro the guide', missing: true });
    expect(undoableReducer(state, { type: 'UNDO' }).present).toEqual(renamed);
    state = undoableReducer(state, { type: 'UPDATE_ENTITY', coll: 'conversations', id: 'talk', patch: { passages: [{ id: 'line', speakerId: 'speaker-B', text: 'A revised reply.' }] } });
    const edited = state.present;
    state = undoableReducer(state, { type: 'DELETE_ENTITY', coll: 'conversations', id: 'talk' });
    expect(state.present.conversations.talk).toBeUndefined();
    expect(undoableReducer(state, { type: 'UNDO' }).present).toEqual(edited);
  });

  it('exports only selected exchanges and distinguishes planned scripts from story history', () => {
    const project = { ...fixture(), conversations: { talk: conversation() } }, node = project.nodes.A;
    expect(characterExport(node, project, 'ai')).not.toContain('Who sent you?');
    const context = characterExport(node, project, 'ai', { conversations: [project.conversations.talk] });
    expect(context).toContain('Planned script — not established story history');
    expect(context).toContain('Moro: Who sent you?');
    expect(context).toContain('Narration / stage directions: The gate opens.');
    expect(node.body).toBe('A cautious guide.');
    expect(conversationText({ ...project.conversations.talk, status: 'happened' }, project)).toContain('Happened in the story');
    expect(characterExport(node, project, 'full', { conversations: [project.conversations.talk] })).not.toContain('Who sent you?');
  });

  it('backfills older projects and retains shared records and scoped participants through complete workspace transfer', () => {
    const old = fixture(); delete old.conversations;
    expect(migrateProject(old).conversations).toEqual({});
    const project = { ...old, conversations: { talk: conversation() } };
    const reopened = readWorkspaceBackup(JSON.stringify(createWorkspaceBackup(makeLibrarySeed(), project))).project;
    expect(reopened.conversations).toEqual(project.conversations);
    expect(conversationsForCharacter(reopened, ref('B'))[0].id).toBe('talk');
  });
});
