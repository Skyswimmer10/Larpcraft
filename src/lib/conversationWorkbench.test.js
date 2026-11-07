import { describe, expect, it } from 'vitest';
import { characterReference, conversationCharacters, conversationSpeakerProfile, conversationLocations, conversationLibraryRecord, conversationFromLibrary, conversationText, conversationParticipant, conversationDialogueName, refreshConversationNames } from './conversations.js';
import { ATTRIBUTE_PRESETS, newAttributeField, toggleAttributeValue, characterAttributesText } from './characterAttributes.js';
import { groupExport } from './groupProfile.js';
import { characterExport } from './characterProfile.js';
import { reducer } from '../state/reducer.js';
import { makeEmptyProject, makeLibrarySeed, migrateProject } from '../data/seed.js';
import { createWorkspaceBackup, readWorkspaceBackup } from './workspaceTransfer.js';
import { resolveConversationIcon, participantIconFallback } from './conversationIcons.js';

const ref = characterReference({ coll: 'nodes', parentPath: ['concept'] }, 'C');
const image = 'data:image/png;base64,portrait';
const game = () => ({ ...makeEmptyProject(), nodes: { concept: { id: 'concept', kind: 'concept', sub: { nodes: {
  C: { id: 'C', kind: 'character', title: 'The courier', body: 'A wary messenger.', image: { dataUrl: image }, characterAttributes: { fields: [{ id: 'personality', kind: 'tags', values: ['Wary'] }] } },
  L: { id: 'L', kind: 'storyLocation', title: 'The old gate', body: 'An abandoned archway.', locationId: 'venue' },
}, edges: [] } } }, locations: { venue: { id: 'venue', name: 'North entrance', image: { dataUrl: image }, notes: 'Stone steps.' } } });

describe('conversation workbench context', () => {
  it('preserves removed and custom icons across reusable copies while default portraits remain live', () => {
    const project = game(), profile = conversationSpeakerProfile({ characterRef: ref }, conversationCharacters(project));
    const fallback = participantIconFallback(profile, 'Courier');
    expect(resolveConversationIcon(undefined, fallback)).toEqual({ image: { dataUrl: image } });
    expect(resolveConversationIcon(null, fallback)).toBeNull();
    expect(resolveConversationIcon({ symbol: 'heart' }, fallback)).toEqual({ symbol: 'heart' });
    const script = { id: 'icons', title: 'Custom icons', icon: { image: { dataUrl: image, name: 'badge.png' } }, participants: [{ id: 'C', name: 'Courier', characterRef: ref, icon: null, goalIcons: { trust: { symbol: 'star' }, survival: null } }], passages: [] };
    const record = conversationLibraryRecord(script, project, 'LIB-ICONS');
    expect(record.image.dataUrl).toBe(image);
    const copy = conversationFromLibrary(record, 'copy');
    expect(copy.participants[0].icon).toBeNull(); expect(copy.participants[0].goalIcons.survival).toBeNull();
    expect(copy.participants[0].goalIcons.trust).toEqual({ symbol: 'star' });
    expect(resolveConversationIcon(copy.participants[0].icon, fallback)).toBeNull();
    expect(project.nodes.concept.sub.nodes.C.image.dataUrl).toBe(image);
    copy.participants[0].goalIcons.trust.symbol = 'flag';
    expect(record.template.participants[0].goalIcons.trust.symbol).toBe('star');
    const none = conversationLibraryRecord({ ...script, icon: null }, project, 'LIB-NONE');
    expect(none.hideIcon).toBe(true); expect(none.image).toBeNull();
  });

  it('reads live scoped profiles and locations while preserving detached snapshots without guessing links', () => {
    const project = game(), people = conversationCharacters(project);
    const participant = { id: 'courier', name: 'Old name', characterRef: ref, profileSnapshot: { bio: 'Earlier bio.' }, goals: { trust: 'Win entry.' }, goalLabels: { trust: 'Loyalty' } };
    expect(conversationSpeakerProfile(participant, people)).toEqual({ portrait: image, bio: 'A wary messenger.', traits: ['Wary'] });
    const location = conversationLocations(project).find(row => row.name === 'The old gate');
    expect(location.ref.parentPath).toEqual(['concept']); expect(location.image).toBe(image);
    const script = { id: 'talk', title: 'At the gate', status: 'happened', context: 'At dusk.', authorGoals: 'Plant a clue.', summary: 'The courier gains entry.', location, locationNotes: 'The gate is locked.', participants: [participant], passages: [{ id: 'line', speakerId: 'courier', text: 'Let me pass.', tags: 'Bargaining' }] };
    const record = conversationLibraryRecord(script, project, 'LIB-TALK');
    expect(record.template.participants[0]).toMatchObject({ name: 'The courier', goals: { trust: 'Win entry.' }, profileSnapshot: { portrait: image, bio: 'A wary messenger.' } });
    expect(record.template.participants[0].characterRef).toBeUndefined(); expect(record.template.location.ref).toBeUndefined();
    const copy = conversationFromLibrary(record, 'copy');
    expect(copy.status).toBe('planned'); expect(copy.authorGoals).toBe(script.authorGoals); expect(copy.summary).toBe(script.summary);
    expect(copy.location.name).toBe('The old gate'); expect(copy.passages[0].tags).toBe('Bargaining');
    copy.participants[0].goals.trust = 'A different goal.';
    expect(record.template.participants[0].goals.trust).toBe('Win entry.');
    expect(participant.goals.trust).toBe('Win entry.');
    expect(conversationSpeakerProfile(record.template.participants[0], [])).toEqual(record.template.participants[0].profileSnapshot);
    for (const content of ['Plant a clue.', 'The courier — Loyalty: Win entry.', 'The courier gains entry.', 'The gate is locked.']) expect(conversationText(script, project)).toContain(content);
  });

  it('keeps dialogue aliases independent of live names and preserves them in reusable copies and exports', () => {
    const project = game();
    const participant = { id: 'courier', name: 'Old name', sceneName: '  The stranger  ', characterRef: ref };
    const script = { id: 'aliases', title: 'A disguise', participants: [participant], passages: [{ id: 'p', speakerId: 'courier', text: 'Let me pass.' }] };
    const live = conversationParticipant(participant, project);
    expect(live.name).toBe('The courier');
    expect(conversationDialogueName(live)).toBe('The stranger');
    expect(conversationDialogueName({ ...live, sceneName: '  ' })).toBe('The courier');
    const output = conversationText(script, project);
    expect(output).toContain('Participants: The courier');
    expect(output).toContain('Dialogue names: The courier as The stranger');
    expect(output).toContain('The stranger: Let me pass.');
    const renamed = refreshConversationNames({ ...project, conversations: { aliases: script } });
    expect(renamed.conversations.aliases.participants[0]).toMatchObject({ name: 'The courier', sceneName: '  The stranger  ' });
    expect(project.nodes.concept.sub.nodes.C.title).toBe('The courier');
    const copy = conversationFromLibrary(conversationLibraryRecord(script, project, 'LIB-ALIASES'), 'copy');
    expect(copy.participants[0]).toMatchObject({ name: 'The courier', sceneName: participant.sceneName });
    expect(copy.participants[0].characterRef).toBeUndefined();
    expect(conversationText(copy)).toContain('The stranger: Let me pass.');
  });

  it('round-trips optional philosophy schools, custom values and group notes without rewriting descriptions or answers', () => {
    let field = newAttributeField(ATTRIBUTE_PRESETS.find(row => row.id === 'philosophy'));
    for (const value of ['Stoicism', 'My village creed', 'stoicism']) field = toggleAttributeValue(field, value);
    // Re-select after testing the existing case-insensitive toggle semantics.
    field = toggleAttributeValue(field, 'Stoicism');
    const attributes = { version: 1, fields: [field, { ...newAttributeField(ATTRIBUTE_PRESETS.find(row => row.id === 'ethicalPrinciple')), value: 'Do no harm.' }] };
    const project = game();
    project.nodes.G = { id: 'G', kind: 'group', title: 'The guild', body: 'An independent guild.', questions: [{ id: 'q', answer: 'Original answer.' }] };
    const revised = reducer(project, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'G', patch: { characterAttributes: attributes } });
    expect(revised.nodes.G.body).toBe('An independent guild.'); expect(revised.nodes.G.questions).toEqual(project.nodes.G.questions);
    expect(groupExport(revised.nodes.G)).toContain('Philosophy schools: My village creed, Stoicism');
    expect(characterExport({ ...revised.nodes.G, kind: 'character' }, {}, 'ai')).toContain('Do no harm.');
    const reopened = migrateProject(readWorkspaceBackup(JSON.stringify(createWorkspaceBackup(makeLibrarySeed(), revised))).project);
    expect(reopened.nodes.G.characterAttributes).toEqual(attributes);
    expect(characterAttributesText(reopened.nodes.G)).toContain('My village creed');
  });
});
