import { describe, expect, it } from 'vitest';
import { FATE_FIELDS, FATE_PURPOSE_LABELS } from '../data/fateWizard.js';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { NARRATIVE_FOCUSES } from '../data/narrativeGuidance.js';
import { reducer } from '../state/reducer.js';
import { createFateDraft, editFate, getFate, fateSuggestions, acceptFateSuggestion, keepFateField, resolveFateTemplate, fateCompletion, fateChecks, fateOutput, fateQuestions, fateAnswers, fateEntities, fateSavedModels, fateScopeKey, summarizeFateStep, orderFateOptions, rememberFateOption, fateSessionRecord } from './fateWizard.js';
import { createWizardNode, reviseWizardResult, wizardLibraryRecord, appendWizardResult, frameworkQuestions } from './narrativeWizard.js';
import { savedWizardSession, savedWizardSessions } from './narrativeMemory.js';

const make = options => createFateDraft({ id: 'D1', ...options });
const build = draft => createWizardNode({ source: FRAMEWORK_TYPES.fate, type: 'framework', id: 'BOB', title: draft.title, context: draft.context, focus: draft.meta.purpose, fateDraft: draft, questions: fateQuestions(draft), answers: fateAnswers(draft) });

describe('FATE shared draft and memory', () => {
  it.each(Object.keys(NARRATIVE_FOCUSES))('supports the existing %s purpose with no assumed character preferences', purpose => {
    const draft = make({ purpose });
    expect(FATE_PURPOSE_LABELS[purpose]).toHaveLength(4);
    expect(draft.meta.purpose).toBe(purpose);
    for (const fields of Object.values(FATE_FIELDS)) for (const field of fields) expect(getFate(draft, field.path)).toBeDefined();
    expect(draft.emotion.direction).toBeNull();
    expect(draft.focus.capture).toBeNull();
    expect(fateCompletion(draft, 'F').filled).toBe(0);
    expect(summarizeFateStep(draft, 'A')).toBe('');
  });
  it('keeps threat and reward independent, and real and perceived authority together', () => {
    let draft = editFate(make(), 'focus.hooks', ['A possible threat', 'Something worth gaining']);
    draft = editFate(draft, 'authority.basis', ['Actual power or ability', 'Belief that they have power']);
    expect(fateSuggestions(draft, 'E').find(rule => rule.path === 'emotion.direction').proposed).toBe('Both impulses conflict');
    expect(draft.emotion.direction).toBeNull();
    expect(draft.authority.basis).toHaveLength(2);
  });
  it('offers suggestions without mutating answers; accepted values track changed context', () => {
    let draft = editFate(make(), 'focus.hooks', ['A possible threat']);
    const offer = fateSuggestions(draft, 'E').find(rule => rule.path === 'emotion.direction');
    expect(draft.emotion.direction).toBeNull();
    draft = acceptFateSuggestion(draft, offer);
    expect(draft.emotion.direction).toBe('Pull away');
    expect(draft.fieldMeta['emotion.direction'].source).toBe('suggested');
    draft = editFate(draft, 'focus.hooks', ['Something worth gaining']);
    expect(draft.emotion.direction).toBe('Pull away');
    expect(draft.fieldMeta['emotion.direction'].stale).toBe(true);
    const keep = keepFateField(draft, 'emotion.direction');
    expect(keep.emotion.direction).toBe('Pull away');
    expect(keep.fieldMeta['emotion.direction'].stale).toBe(false);
    const updated = acceptFateSuggestion(draft, fateSuggestions(draft, 'E').find(rule => rule.path === 'emotion.direction'));
    expect(updated.emotion.direction).toBe('Move toward it');
    expect(updated.fieldMeta['emotion.direction'].stale).toBeUndefined();
  });
  it('detaches a suggestion when edited and does not modify locked steps', () => {
    let draft = editFate(make(), 'focus.hooks', ['A possible threat']);
    draft = acceptFateSuggestion(draft, fateSuggestions(draft, 'E')[0]);
    draft = editFate(draft, 'emotion.direction', 'It depends');
    expect(draft.fieldMeta['emotion.direction'].source).toBe('user');
    expect(draft.fieldMeta['emotion.direction'].ruleId).toBeUndefined();
    draft = editFate(draft, 'meta.locks.E', true);
    expect(fateSuggestions(draft, 'E')).toEqual([]);
    expect(editFate(draft, 'emotion.direction', 'Move toward it')).toBe(draft);
  });
  it('flags later written descriptions for review and preserves previous multi-selections when accepting another suggestion', () => {
    let draft = editFate(make(), 'focus.anchor', 'The first bell');
    draft = editFate(draft, 'authority.anchor', 'An experienced keeper');
    draft = editFate(draft, 'focus.anchor', 'A bell that rings twice');
    expect(draft.fieldMeta['authority.anchor'].stale).toBe(true);
    expect(draft.authority.anchor).toBe('An experienced keeper');
    draft = editFate(draft, 'focus.threatTypes', ['Injury', 'Exclusion']);
    draft = acceptFateSuggestion(draft, fateSuggestions(draft, 'E').find(rule => rule.id === 'danger-trigger'));
    draft = acceptFateSuggestion(draft, fateSuggestions(draft, 'E').find(rule => rule.id === 'exclusion-trigger'));
    expect(draft.emotion.triggers).toEqual(['Danger', 'Being excluded']);
  });
  it('never loses advanced answers when switching modes', () => {
    let draft = editFate(make(), 'meta.depth', 'advanced');
    draft = editFate(draft, 'emotion.curve', [{ t: 0, v: 20 }, { t: 50, v: 90 }, { t: 100, v: 50 }]);
    draft = editFate(draft, 'meta.depth', 'simple');
    expect(draft.emotion.curve).toHaveLength(3);
    expect(JSON.parse(JSON.stringify(draft)).emotion.curve[1].v).toBe(90);
  });
  it('resolves known context, names, lists, fallbacks and long answers without exposing object values', () => {
    let draft = editFate(make(), 'meta.targets', ['p1']);
    draft = editFate(draft, 'focus.channels', ['Sound', 'Motion', 'Silence']);
    expect(resolveFateTemplate('{meta.targetsLabel} sees {focus.channels}. {authority.source|An unknown voice}', draft, [{ key: 'p1', name: 'Bob' }])).toBe('Bob sees Sound, Motion and Silence. An unknown voice');
    expect(resolveFateTemplate('{missing.path|a clue} {not.here}', draft)).toBe('a clue ');
    expect(resolveFateTemplate('{meta|context}', draft)).toBe('context');
    draft.focus.anchor = 'a'.repeat(300);
    expect(resolveFateTemplate('{focus.anchor}', draft)).toHaveLength(73);
    expect(draft.focus.anchor).toHaveLength(300);
  });
  it('preserves long legacy answers and notes, then saves prose with the original answer keys', () => {
    const answers = { 'phase:F': 'Gold and royal promises. '.repeat(15), 'phase:A': 'The royal seal', 'phase:T': 'The river guild', 'phase:E': 'A familiar marching song' };
    const old = createWizardNode({ source: FRAMEWORK_TYPES.fate, type: 'framework', id: 'OLD', title: 'Bob', focus: 'character', questions: frameworkQuestions(FRAMEWORK_TYPES.fate, {}, 'character'), answers });
    old.questions.push({ id: 'custom', prompt: 'Other work', answer: 'Keep me' });
    const session = savedWizardSession(old, {});
    const draft = make({ record: session.record, answers: session.answers, purpose: 'character', targetId: old.id });
    expect(draft.focus.anchor).toBe(answers['phase:F'].trim());
    expect(draft.notes.F).toBe(answers['phase:F'].trim());
    expect(draft.fieldMeta['focus.anchor'].source).toBe('migrated');
    const updated = reviseWizardResult(old, build(draft), FRAMEWORK_TYPES.fate);
    expect(updated.body).not.toContain('Working on:');
    expect(updated.body).not.toContain(FATE_PURPOSE_LABELS.character[0]);
    expect(updated.questions.find(row => row.id === 'custom').answer).toBe('Keep me');
    const nextSession = savedWizardSession(updated, {});
    expect(nextSession.answers['phase:F']).toBe(answers['phase:F'].trim());
    const resumed = make({ record: nextSession.record, answers: nextSession.answers, targetId: old.id });
    expect(resumed.workspace.sessionId).toBe(updated.narrativeWizard.sessionId);
    expect(resumed.focus.anchor).toBe(draft.focus.anchor);
  });
  it('keeps authored prose through changes, library copies and continued editing', () => {
    let draft = make({ purpose: 'character', title: 'Bob' });
    draft = editFate(draft, 'output.text', 'Bob seeks a home among the river guild.');
    draft = editFate(draft, 'focus.anchor', 'A royal promise');
    expect(fateOutput(draft)).toBe('Bob seeks a home among the river guild.');
    const node = build(draft), copy = wizardLibraryRecord(node, 'LIB-BOB');
    expect(copy.entity.description).toBe(fateOutput(draft));
    const session = savedWizardSession(copy.entity.template, {});
    expect(make({ record: session.record, answers: session.answers }).output.text).toBe(fateOutput(draft));
    draft = editFate(draft, 'output.text', undefined);
    expect(fateOutput(draft)).toContain('a royal promise');
    expect(fateOutput(draft)).not.toContain('seeks a home');
  });
  it('assigns independent editing slots to copies of the same saved template', () => {
    const record = build(make({ title: 'Reusable FATE character', purpose: 'character' })).narrativeWizard;
    const first = createFateDraft({ record, targetId: 'FIRST' });
    const second = createFateDraft({ record, targetId: 'SECOND' });
    expect(first.id).not.toBe(second.id);
    expect(first.workspace.targetId).toBe('FIRST');
    expect(second.workspace.targetId).toBe('SECOND');
    expect(first.workspace.sessionId).toBe(record.sessionId);
  });
  it('identifies an older session without a session ID even after the writer renames the draft', () => {
    const older = { sourceId: 'fate', sourceType: 'framework', title: 'Original version', focus: 'character', answers: { 'phase:F': 'A bridge bell' } };
    const target = { narrativeWizardHistory: [{ ...older, title: 'Other version' }, older], narrativeWizard: older };
    const draft = editFate(make({ record: older }), 'title', 'Renamed version');
    expect(fateSessionRecord(target, draft.workspace)).toBe(older);
    expect(fateSessionRecord(target, make().workspace)).toBeUndefined();
  });
  it('keeps player briefings free of designer notes and hidden resistance details', () => {
    let draft = make({ title: 'Bridge briefing' });
    draft.focus.anchor = 'Listen for the bridge bell.';
    draft.emotion.resistance = 'The keeper secretly opposes the guild.';
    draft.notes.F = 'Reveal the betrayal later.';
    draft = editFate(draft, 'output.format', 'Player briefing');
    expect(fateOutput(draft)).toContain('Listen for the bridge bell.');
    expect(fateOutput(draft)).not.toMatch(/secretly|betrayal/);
  });
  it('stores unfinished drafts separately and removes only the completed draft', () => {
    let game = { nodes: { keep: { id: 'keep', body: 'Keep me' } }, fateWizardDrafts: { other: { id: 'other' } } };
    const draft = make();
    game = reducer(game, { type: 'SAVE_FATE_DRAFT', draft });
    expect(Object.keys(game.nodes)).toEqual(['keep']);
    expect(JSON.parse(JSON.stringify(game)).fateWizardDrafts.D1).toEqual(draft);
    game = reducer(game, { type: 'REMOVE_FATE_DRAFT', id: 'D1' });
    expect(game.fateWizardDrafts).toEqual({ other: { id: 'other' } });
    expect(game.nodes.keep.body).toBe('Keep me');
  });
  it('distinguishes nested entities with duplicate IDs and includes groups and master acts', () => {
    const game = { nodes: { a: { id: 'a', title: 'A', sub: { nodes: { X: { id: 'X', title: 'First Bob' } } } }, b: { id: 'b', title: 'B', sub: { nodes: { X: { id: 'X', title: 'Second Bob' } } } } }, masterNodes: { a: { id: 'a', title: 'An act' } }, teams: { a: { id: 'a', name: 'The guild' } } };
    const entities = fateEntities(game);
    expect(new Set(entities.map(entity => entity.key)).size).toBe(entities.length);
    expect(entities.filter(entity => entity.name.includes('Bob'))).toHaveLength(2);
    expect(fateScopeKey({ parentId: 'a' })).toBe(fateScopeKey({ coll: 'nodes', parentPath: ['a'] }));
  });
  it('keeps recent and custom vocabulary in project preferences with a clearable independent record', () => {
    let preferences = rememberFateOption({}, 'focus.channels', 'A tapping pipe', true);
    preferences = rememberFateOption(preferences, 'focus.channels', 'A tapping pipe');
    const field = FATE_FIELDS.F.find(field => field.path === 'focus.channels');
    expect(orderFateOptions(field, preferences)[0]).toBe('A tapping pipe');
    const game = reducer({ nodes: {} }, { type: 'SET_FATE_PREFERENCES', preferences });
    expect(game.fateWizardPreferences.chipUsage['focus.channels']['A tapping pipe']).toBe(2);
    expect(reducer(game, { type: 'SET_FATE_PREFERENCES', preferences: {} }).fateWizardPreferences).toEqual({});
  });
  it('reports gaps as recorded-detail completeness and permits deliberate tensions', () => {
    let draft = make();
    expect(fateChecks(draft).filter(row => row.id.startsWith('missing:'))).toHaveLength(0);
    expect(fateChecks(editFate(draft, 'meta.mode', 'diagnose')).filter(row => row.id.startsWith('missing:'))).toHaveLength(4);
    draft = editFate(draft, 'focus.anchor', 'A broken seal');
    expect(fateCompletion(draft, 'F')).toMatchObject({ filled: 1, total: 3 });
    draft = editFate(draft, 'meta.mode', 'diagnose');
    expect(fateOutput(draft)).toContain('Focus: 1/3 core details recorded');
    expect(fateOutput(draft)).not.toContain('strength');
    draft = editFate(draft, 'dismissedWarnings', ['missing:A']);
    expect(fateChecks(draft).some(row => row.id === 'missing:A')).toBe(false);
  });
  it('retains multiple framework sessions and finds source models for copying', () => {
    const node = build(make({ title: 'An invitation', purpose: 'scene' }));
    const king = createWizardNode({ source: FRAMEWORK_TYPES.jungianMasculineArchetypes, type: 'framework', id: 'K', title: 'A leader', focus: 'character', questions: frameworkQuestions(FRAMEWORK_TYPES.jungianMasculineArchetypes), answers: { archetype: 'King' } });
    const combined = appendWizardResult(node, king);
    expect(savedWizardSessions(combined, {})).toHaveLength(2);
    expect(fateSavedModels({ nodes: { BOB: combined } })).toHaveLength(1);
  });
  it('does not silently accept newer draft schemas', () => {
    expect(() => make({ record: { fateDraft: { schemaVersion: 9 } } })).toThrow(/newer version/);
  });
});
