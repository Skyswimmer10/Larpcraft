import { describe, expect, it, vi } from 'vitest';
import { conversationLibraryRecord, conversationFromLibrary, conversationTemplatePatch, characterReference, conversationsForCharacter } from './conversations.js';
import { makeLibrarySeed, makeEmptyProject, migrateLibrary } from '../data/seed.js';
import { buildStoryLibrarySections } from './narrativeLibrary.js';
import { undoableReducer } from '../state/store.jsx';
import { createWorkspaceBackup, readWorkspaceBackup } from './workspaceTransfer.js';

const ref = characterReference({}, 'C');
const project = () => ({ ...makeEmptyProject(), nodes: { C: { id: 'C', kind: 'character', title: 'Moro the guide' } }, conversations: {
  talk: { id: 'talk', title: 'At the gate', status: 'happened', context: 'At sunset', participants: [{ id: 'speaker', name: 'Old Moro', characterRef: ref }, { id: 'guard', name: 'The guard' }], passages: [{ id: 'line', speakerId: 'speaker', text: 'Let us through.' }, { id: 'stage', speakerId: 'narration', text: 'The guard hesitates.' }] },
} });

describe('reusable conversation library', () => {
  it('saves a detached snapshot with current speaker names and preserves the original game', () => {
    const game = project(), before = JSON.stringify(game);
    const record = conversationLibraryRecord(game.conversations.talk, game, 'LIB-TALK');
    expect(record.name).toBe('At the gate');
    expect(record.template.participants[0]).toEqual({ id: 'speaker', name: 'Moro the guide' });
    expect(record.template.passages).toEqual(game.conversations.talk.passages);
    record.template.passages[0].text = 'A library edit.';
    expect(JSON.stringify(game)).toBe(before);
    expect(record.template.status).toBe('happened');
  });

  it('inserts independent planned copies and never binds speakers by coincidentally matching names or IDs', () => {
    const game = project(), record = conversationLibraryRecord(game.conversations.talk, game, 'LIB-TALK');
    const first = conversationFromLibrary(record, 'copy-1'), second = conversationFromLibrary(record, 'copy-2');
    expect(first.status).toBe('planned'); expect(first.libraryTemplateId).toBe('LIB-TALK');
    expect(first.participants.every(row => !row.characterRef)).toBe(true);
    const target = { ...project(), conversations: { 'copy-1': first } };
    expect(conversationsForCharacter(target, ref)).toEqual([]);
    first.passages[0].text = 'A new reply.';
    expect(second.passages[0].text).toBe('Let us through.');
    expect(record.template.passages[0].text).toBe('Let us through.');
    expect(game.conversations.talk.status).toBe('happened');
    expect(first.passages[0].speakerId).toBe(first.participants[0].id);
  });

  it('keeps library metadata in sync with edits and supports library undo independently of project conversations', () => {
    const game = project(), record = conversationLibraryRecord(game.conversations.talk, game, 'LIB-TALK');
    const library = { ...makeLibrarySeed(), conversationTemplates: { [record.id]: record } };
    const edited = undoableReducer({ present: library, past: [] }, { type: 'UPDATE_ENTITY', coll: 'conversationTemplates', id: record.id, patch: conversationTemplatePatch(record, { title: 'A changed template', context: 'At dawn' }) });
    expect(edited.present.conversationTemplates[record.id].name).toBe('A changed template');
    expect(edited.present.conversationTemplates[record.id].description).toBe('At dawn');
    expect(edited.present.conversationTemplates[record.id].template.title).toBe('A changed template');
    expect(undoableReducer(edited, { type: 'UNDO' }).present).toEqual(library);
    expect(game.conversations.talk.title).toBe('At the gate');
    const deleted = undoableReducer(edited, { type: 'DELETE_ENTITY', coll: 'conversationTemplates', id: record.id });
    expect(deleted.present.conversationTemplates[record.id]).toBeUndefined();
    expect(undoableReducer(deleted, { type: 'UNDO' }).present).toEqual(edited.present);
  });

  it('shows a Conversations category in Created Content and routes it to its own library collection', () => {
    const game = project(), record = conversationLibraryRecord(game.conversations.talk, game, 'LIB-TALK'), pick = vi.fn();
    const sections = buildStoryLibrarySections({ conversationTemplates: { [record.id]: record } }, 'content', pick);
    const [card] = sections.find(section => section.id === 'conversations').items;
    expect(card.label).toBe('At the gate');
    card.onPick();
    expect(pick).toHaveBeenCalledWith({ coll: 'conversationTemplates', id: record.id, record });
    expect(buildStoryLibrarySections({ conversationTemplates: { [record.id]: record } }, 'tools').flatMap(section => section.items).some(row => row.id === card.id)).toBe(false);
  });

  it('backfills older libraries and transfers templates and game conversations through complete workspace backups', () => {
    const game = project(), library = makeLibrarySeed(); delete library.conversationTemplates;
    expect(migrateLibrary(library).conversationTemplates).toEqual({});
    const record = conversationLibraryRecord(game.conversations.talk, game, 'LIB-TALK');
    library.conversationTemplates = { [record.id]: record };
    const reopened = readWorkspaceBackup(JSON.stringify(createWorkspaceBackup(library, game)));
    expect(reopened.library.conversationTemplates[record.id]).toEqual(record);
    expect(reopened.project.conversations).toEqual(game.conversations);
    expect(reopened.project.conversationTemplates).toBeUndefined();
    expect(reopened.library.conversations).toBeUndefined();
  });
});
