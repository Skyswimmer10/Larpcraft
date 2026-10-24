import { describe, expect, it } from 'vitest';
import { createFateDraft, normalizeFateDraft, editFate, fateDetailPath, getFate, fateOutput, fateDesignNotes, summarizeFateStep, switchFatePurpose, addFateEmotionPattern, linkFateListenerProfile, fateProfileSignature, fateProfileContext, fateQuestions, fateAnswers, fateSuggestions, fateChecks } from './fateWizard.js';
import { fateFieldsFor } from '../data/fatePurposes.js';
import { createWizardNode, reviseWizardResult, wizardLibraryRecord } from './narrativeWizard.js';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { savedWizardSession } from './narrativeMemory.js';
const make = purpose => createFateDraft({ id: 'FATE-TYPES', purpose: purpose || 'communication', title: 'Conversation A' });
const detail = (draft, path, option, text) => editFate(draft, fateDetailPath(path, option), text);
const node = draft => createWizardNode({ source: FRAMEWORK_TYPES.fate, type: 'framework', id: 'N1', title: draft.title, focus: draft.meta.purpose, questions: fateQuestions(draft), answers: fateAnswers(draft), fateDraft: draft });

describe('Distinct FATE purposes and specific choices', () => {
  it('keeps categories and written descriptions together instead of using them as alternatives', () => {
    let d = editFate(make(), 'focus.hooks', ['Something worth gaining']);
    d = editFate(d, 'focus.channels', ['Spoken words', 'Silence']);
    d = detail(d, 'focus.hooks', 'Something worth gaining', 'An extra share of the food.');
    d = editFate(d, 'focus.anchor', 'Scooby notices the sandwich.');
    expect(summarizeFateStep(d, 'F')).toContain('something worth gaining');
    expect(summarizeFateStep(d, 'F')).toContain('spoken words and silence');
    expect(summarizeFateStep(d, 'F')).toContain('Scooby notices the sandwich.');
    expect(fateDesignNotes(d)).toContain('An extra share of the food.');
  });
  it('supports several authority sources with their own details and legacy migration', () => {
    let d = make(); d.authority.source = 'A secret'; d.authority.secondary = ['Expertise', 'Evidence']; delete d.revision;
    d = normalizeFateDraft(d);
    expect(d.authority.source).toEqual(['A secret', 'Expertise', 'Evidence']);
    d = detail(d, 'authority.source', 'A secret', 'Mickey knows where the missing food went.');
    d = detail(d, 'authority.source', 'Expertise', 'He knows the kitchen staff.');
    d = editFate(d, 'authority.anchor', 'Scooby believes Mickey knows the answer.');
    expect(summarizeFateStep(d, 'A')).toMatch(/secret.*expertise.*evidence/i);
    expect(summarizeFateStep(d, 'A')).toContain('Mickey knows');
    d = editFate(d, 'authority.source', ['A secret']);
    expect(normalizeFateDraft(d).authority.source).toEqual(['A secret']);
  });
  it('keeps unchecked option details while excluding them from active output', () => {
    let d = editFate(make('character'), 'focus.hooks', ['A possible threat']);
    d = detail(d, 'focus.hooks', 'A possible threat', 'Losing the crew frightens her.');
    d = editFate(d, 'focus.hooks', []);
    expect(getFate(d, fateDetailPath('focus.hooks', 'A possible threat'))).toBe('Losing the crew frightens her.');
    expect(fateOutput(d)).not.toContain('Losing the crew');
    d = editFate(d, 'focus.hooks', ['A possible threat']); expect(fateOutput(d)).toContain('Losing the crew');
  });
  it('keeps independent titles, context, choices and edited wording for each purpose', () => {
    let d = editFate(make(), 'output.text', 'Mickey: “Will you help?”');
    d = editFate(d, 'communication.listener', 'Scooby');
    d = switchFatePurpose(d, 'character'); expect(d.title).toBe(''); expect(d.output.text).toBeUndefined(); expect(d.focus.hooks).toEqual([]);
    d = editFate(d, 'title', 'Mira'); d = editFate(d, 'context', 'A captain who values her crew.');
    d = editFate(d, 'output.text', 'Mira trusts people who have earned her respect.');
    d = switchFatePurpose(d, 'communication');
    expect(d.title).toBe('Conversation A'); expect(d.communication.listener).toBe('Scooby');
    expect(fateOutput(d)).toBe('Mickey: “Will you help?”');
    d = switchFatePurpose(d, 'character'); expect(d.title).toBe('Mira'); expect(fateOutput(d)).toContain('earned her respect');
    expect(JSON.parse(JSON.stringify(d)).purposeBanks.communication.title).toBe('Conversation A');
  });
  it('shares Simple/Advanced details within a purpose and preserves workspace identity across purpose switches', () => {
    let d = editFate(make(), 'workspace.targetId', 'existing');
    d = editFate(d, 'meta.depth', 'advanced'); d = editFate(d, 'focus.noise', ['Other conversations']);
    d = switchFatePurpose(d, 'character'); expect(d.meta.depth).toBe('advanced');
    d = editFate(d, 'meta.depth', 'simple'); d = switchFatePurpose(d, 'communication');
    expect(d.meta.depth).toBe('simple'); expect(d.focus.noise).toEqual(['Other conversations']); expect(d.workspace.targetId).toBe('existing');
  });
  it('uses character-specific controls for recurring preferences rather than a one-off persuasion request', () => {
    expect(fateFieldsFor('character', 'F').find(field => field.path === 'focus.channels').simple).toBe(false);
    expect(fateFieldsFor('character', 'A').some(field => field.path === 'authority.compliance')).toBe(false);
    expect(fateFieldsFor('character', 'T').find(field => field.path === 'tribe.groups').simple).toBe(true);
    expect(fateFieldsFor('character', 'E').find(field => field.path === 'emotion.recurring').control).toBe('multi');
    expect(fateFieldsFor('communication', 'E').some(field => field.path === 'emotion.recurring')).toBe(false);
  });
  it('records multiple mixtures of feelings with triggers, usual responses and exceptions', () => {
    let d = addFateEmotionPattern(make('character'));
    d = editFate(d, 'emotion.recurring', ['Fear', 'Pride']);
    d = editFate(d, 'emotion.patterns.0.situation', 'her crew is watching');
    d = editFate(d, 'emotion.patterns.0.feelings', ['Fear', 'Pride']);
    d = editFate(d, 'emotion.patterns.0.response', 'hiding her doubts');
    d = editFate(d, 'emotion.patterns.0.exception', 'she speaks privately to a friend');
    d = addFateEmotionPattern(d);
    expect(d.emotion.patterns).toHaveLength(2); expect(d.emotion.patterns[0].id).not.toBe(d.emotion.patterns[1].id);
    expect(fateOutput(d)).toContain('fear and pride'); expect(fateOutput(d)).toContain('hiding her doubts'); expect(fateOutput(d)).toContain('privately');
    d = editFate(d, 'emotion.patterns.0.exception', 'When she speaks privately.');
    d = editFate(d, 'emotion.patterns.0.response', 'Pretend to be brave.');
    expect(fateOutput(d)).toContain('They tend to pretend to be brave.'); expect(fateOutput(d)).not.toContain('when When');
  });
  it('creates spoken dialogue only from explicitly written words without inventing speaker or listener reactions', () => {
    let d = editFate(make(), 'focus.anchor', 'Scooby notices a reward.');
    d = editFate(d, 'communication.speaker', 'Mickey'); d = editFate(d, 'communication.listener', 'Scooby');
    expect(fateOutput(d)).toBe('');
    d = editFate(d, 'focus.channels', ['Spoken words', 'Silence']);
    d = detail(d, 'focus.channels', 'Spoken words', 'Help find the key, and the sandwich is yours.');
    d = detail(d, 'focus.channels', 'Silence', 'He pauses after mentioning the sandwich.');
    expect(fateOutput(d)).toBe('Mickey: “Help find the key, and the sandwich is yours.”');
    expect(fateOutput(d)).not.toContain('He pauses');
    expect(fateDesignNotes(d)).toContain('He pauses');
    d = editFate(d, 'communication.listenerReply', 'What kind of sandwich?');
    expect(fateOutput(d)).toContain('Scooby: “What kind of sandwich?”');
  });
  it('lets explicit spoken lines take priority over an opening detail and preserves manual dialogue', () => {
    let d = editFate(make(), 'focus.channels', ['Spoken words']);
    d = detail(d, 'focus.channels', 'Spoken words', 'An earlier opening.');
    d = editFate(d, 'communication.lines.F', 'A revised opening.');
    expect(fateOutput(d)).toContain('A revised opening.'); expect(fateOutput(d)).not.toContain('An earlier opening.');
    d = editFate(d, 'output.text', 'Mickey: “My final wording.”'); d = editFate(d, 'focus.anchor', 'Something changed');
    expect(fateOutput(d)).toBe('Mickey: “My final wording.”');
  });
  it('uses a saved character profile as explicit listener background without overwriting dialogue decisions', () => {
    let profile = editFate(make('character'), 'authority.anchor', 'Mira trusts practical experience.');
    profile = editFate(profile, 'tribe.anchor', 'Her crew matters most.');
    const model = { key: 'MIRA:profile', entity: { key: '["nodes","MIRA"]', name: 'Mira' }, record: node(profile).narrativeWizard };
    let d = editFate(make(), 'authority.anchor', 'A different argument.'); d = linkFateListenerProfile(d, model);
    expect(d.communication.listener).toBe('Mira'); expect(d.authority.anchor).toBe('A different argument.');
    expect(fateProfileContext(d, 'A').summary).toContain('practical experience');
    expect(fateProfileContext(d, 'T').summary).toContain('crew');
    model.record.fateDraft.authority.anchor = 'She now distrusts experts.';
    expect(fateProfileContext(d, 'A').summary).toContain('practical experience');
    expect(d.communication.profile.signature).not.toBe(fateProfileSignature(model));
    const before = fateProfileSignature(model);
    model.record.fateDraft.purposeBanks.communication = { unrelated: 'Keep this out of the source signature.' };
    expect(fateProfileSignature(model)).toBe(before);
  });
  it('preserves optional omissions and locks selected details and spoken lines', () => {
    let d = make(); expect(fateChecks(d).some(check => check.id.startsWith('missing:'))).toBe(false);
    const character = editFate(make('character'), 'focus.hooks', ['A possible threat']);
    expect(fateSuggestions(character).some(row => row.path === 'emotion.direction')).toBe(false);
    d = editFate(d, 'meta.locks.F', true);
    expect(editFate(d, fateDetailPath('focus.hooks', 'Something worth gaining'), 'Gold')).toBe(d);
    expect(editFate(d, 'communication.lines.F', 'Listen')).toBe(d);
  });
  it('round-trips specific answers and dialogue through saved questions, library copying and revision', () => {
    let d = editFate(make(), 'authority.source', ['A secret']);
    d = detail(d, 'authority.source', 'A secret', 'The missing food is in the tower.');
    d = editFate(d, 'communication.lines.A', 'I know where the food is.');
    const before = node(d); before.questions = [{ id: 'keep', prompt: 'Other work', answer: 'Keep this.' }];
    const q = fateQuestions(d).find(row => row.key.startsWith('fate:detail:'));
    const answers = { ...fateAnswers(d), [q.key]: 'The food is in the kitchen.' };
    const reopened = createFateDraft({ record: before.narrativeWizard, answers });
    expect(getFate(reopened, fateDetailPath('authority.source', 'A secret'))).toBe('The food is in the kitchen.');
    expect(fateOutput(reopened)).toContain('I know where the food is.');
    const updated = reviseWizardResult(before, node(reopened), FRAMEWORK_TYPES.fate);
    expect(updated.id).toBe('N1'); expect(updated.questions[0].answer).toBe('Keep this.');
    const library = wizardLibraryRecord(updated, 'LIB-CONV');
    expect(library.entity.narrativeWizard.fateDraft.communication.lines.A).toBe('I know where the food is.');
    expect(savedWizardSession(updated, {})?.record.fateDraft.communication.lines.A).toBe('I know where the food is.');
  });
  it('encodes dots and unusual option names safely in detail paths', () => {
    let d = make('character'); const path = fateDetailPath('tribe.groups', 'A.B / __proto__');
    d = editFate(d, path, 'A specific group.');
    expect(getFate(d, path)).toBe('A specific group.'); expect({}.polluted).toBeUndefined();
  });
});
