import { describe, expect, it } from 'vitest';
import { FRAMEWORK_TYPES, makeEmptyProject } from '../data/seed.js';
import { createGroupResult, saveGroupResult, groupExport } from './groupProfile.js';
import { GROUP_FOUNDATIONS_ID } from './groupFoundations.js';
import { narrativeSources } from './narrativeWizard.js';
import { buildStoryLibrarySections } from './narrativeLibrary.js';
import { savedWizardSession } from './narrativeMemory.js';
import { characterSources, characterProfilePatch, editCharacterDescription, characterDescriptionReviews, reviewCharacterDescription } from './characterProfile.js';
import { undoableReducer } from '../state/store.jsx';
import { reducer } from '../state/reducer.js';

const make = () => createGroupResult({ id: 'G', title: 'Lantern Guild', facts: { kind: 'Guild', members: [{ id: 'm', name: 'Mira', role: 'Guide' }] }, answers: { 'bonds:choice': 'Trust', origin: 'They met on the road.' } });
const scope = { coll: 'nodes' };

describe('group input controls and framework compatibility', () => {
  it('catalogues Group Foundations once as a framework in the wizard and library', () => {
    const rows = narrativeSources({ concepts: { legacy: { id: GROUP_FOUNDATIONS_ID, name: 'Group Foundations' } } }).filter(row => row.source.id === GROUP_FOUNDATIONS_ID);
    expect(rows).toHaveLength(1); expect(rows[0].type).toBe('framework');
    expect(rows[0].source).toBe(FRAMEWORK_TYPES[GROUP_FOUNDATIONS_ID]);
    expect(rows[0].guidance.best).toContain('relationship');
    const sections = buildStoryLibrarySections({}, 'tools');
    expect(sections.find(section => section.id === 'frameworks').items.find(row => row.id === 'frameworks:' + GROUP_FOUNDATIONS_ID).label).toBe('Group Foundations');
  });

  it('resumes older concept-classified foundations as a framework without changing session identity, answers or native tree layout', () => {
    const group = make(), record = group.narrativeWizard;
    group.narrativeWizard = { ...record, sourceType: 'concept' };
    const child = Object.values(group.sub.nodes).find(row => row.characterInput);
    child.kind = 'concept'; child.x = 789; child.sub.nodes.origin.x = 615;
    const before = JSON.stringify(group), session = savedWizardSession(group, {});
    expect(session.type).toBe('framework'); expect(session.record.sessionId).toBe(record.sessionId);
    expect(session.answers.origin).toBe('They met on the road.');
    expect(JSON.stringify(group)).toBe(before);
    const next = saveGroupResult(group, { id: 'G', title: 'Lantern Guild', facts: group.groupFacts, answers: { origin: 'They met at dawn.' } }, session.record);
    expect(characterSources(next)).toHaveLength(1);
    const updated = Object.values(next.sub.nodes).find(row => row.characterInput);
    expect(updated.kind).toBe('framework'); expect(updated.x).toBe(789); expect(updated.sub.nodes.origin.x).toBe(615);
    expect(savedWizardSession(next, {}).answers.origin).toBe('They met at dawn.');
  });

  it('supports inclusion, deletion and one-step undo without deleting native facts, members, image or independent writing', () => {
    let group = make(); group.image = { dataUrl: 'data:image/png;base64,guild' };
    group = editCharacterDescription(group, {}, group.body + '\n\nThe guild keeps a library.');
    const key = characterSources(group)[0].key;
    const excluded = characterProfilePatch(group, {}, { excluded: [key] });
    expect(excluded.body).not.toContain('Their bonds rest on trust.');
    expect(savedWizardSession(excluded, {}).answers['bonds:choice']).toBe('Trust');
    const state = { ...makeEmptyProject(), nodes: { G: group }, groupWizardDrafts: {
      removed: { scope, targetId: 'G', sessionId: group.narrativeWizard.sessionId, answers: { origin: 'An old draft.' } },
      other: { scope: { coll: 'masterNodes', parentId: 'ACT' }, targetId: 'G', sessionId: group.narrativeWizard.sessionId },
    } };
    const changed = undoableReducer({ present: state, past: [] }, { type: 'REMOVE_CHARACTER_INPUT', scope, id: 'G', key });
    const after = changed.present.nodes.G;
    expect(after.narrativeWizard).toBeUndefined(); expect(after.questions).toEqual([]);
    expect(after.body).not.toContain('They met on the road.'); expect(after.body).toContain('The guild keeps a library.');
    expect(after.groupFacts).toEqual(group.groupFacts); expect(after.image).toEqual(group.image);
    expect(Object.values(after.sub.nodes).some(row => row.characterInput)).toBe(false);
    expect(Object.keys(changed.present.groupWizardDrafts)).toEqual(['other']);
    expect(undoableReducer(changed, { type: 'UNDO' }).present).toEqual(state);
  });

  it('preserves rewritten group paragraphs and offers the changed question as a local revision', () => {
    let group = make();
    group = editCharacterDescription(group, {}, group.body + '\n\nThey maintain a lighthouse.');
    group = editCharacterDescription(group, {}, group.body.replace('Their bonds rest on trust.', 'They rely on shared stories.'));
    const id = group.narrativeWizard.questionIds['bonds'];
    const next = reducer({ ...makeEmptyProject(), nodes: { G: group } }, { type: 'GRAPH_UPDATE_NODE', scope, id: 'G', patch: { questions: group.questions.map(row => row.id === id ? { ...row, answer: 'Oaths' } : row) } }).nodes.G;
    const reviews = characterDescriptionReviews(next);
    expect(reviews).toHaveLength(1);
    expect(next.body).toContain('They rely on shared stories.'); expect(next.body).toContain('They maintain a lighthouse.');
    const accepted = reviewCharacterDescription(next, {}, reviews[0].id, true);
    expect(accepted.body).toContain('oaths'); expect(accepted.body).toContain('They maintain a lighthouse.');
    expect(groupExport(accepted, true, 'ai')).toContain('Oaths');
  });
});
