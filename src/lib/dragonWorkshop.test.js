import { describe, expect, it } from 'vitest';
import bundled from '../data/deployedLibrary.json';
import { makeEmptyProject } from '../data/seed.js';
import { createWizardNode, conceptQuestions, conceptRoles, appendWizardResult, reviseWizardResult, wizardLibraryRecord } from './narrativeWizard.js';
import { dragonAnswers, dragonQuestions, dragonKey, dragonSummary, isDragonConcept } from './dragonWorkshop.js';
import { savedWizardSession } from './narrativeMemory.js';
import { wizardFieldPatch } from './wizardFields.js';
import { reducer, locateGraph } from '../state/reducer.js';
import { undoableReducer } from '../state/store.jsx';

const source = () => structuredClone(bundled.concepts['LIB-CPT-DRAGON']);
const answers = { [dragonKey('city')]: 'The riverside market', [dragonKey('dragon')]: 'The creditor syndicate', [dragonKey('valuable')]: 'Shared livelihoods', [dragonKey('wants')]: 'The deeds before sunset', [dragonKey('escapePlan')]: 'Move north', [dragonKey('defendPlan')]: 'Invite witnesses', [dragonKey('attackPlan')]: 'Expose the fraud', [dragonKey('defendCost')]: 'Restricted movement' };
const build = (src = source(), bank = answers, focus = 'scene', id = 'D') => createWizardNode({ source: src, type: 'concept', id, title: 'The market dilemma', questions: dragonQuestions(src), answers: bank, roles: conceptRoles(src), focus });

describe('Dragon focused workshop and existing concept tree', () => {
  it('recognises renamed canonical templates and leaves unrelated concepts alone', () => {
    expect(isDragonConcept({ id: 'LIB-CPT-DRAGON', name: 'Renamed' })).toBe(true);
    expect(isDragonConcept({ name: 'Dragon and the Castle' })).toBe(true);
    expect(isDragonConcept({ name: 'Dragon racing' })).toBe(false);
    expect(isDragonConcept(wizardLibraryRecord(build(), 'LIB-RENAMED').entity)).toBe(true);
  });

  it('fills existing nodes, grouping several fields on one node without duplicating the graph', () => {
    const src = source(), before = JSON.stringify(src), node = build(src);
    expect(Object.keys(node.sub.nodes)).toEqual(Object.keys(src.nodes));
    expect(node.sub.edges).toEqual(src.edges); expect(node.sub.frames).toEqual(src.frames);
    expect(node.sub.nodes.S007.kind).toBe(src.nodes.S007.kind);
    expect(node.sub.nodes.S007.wizardFields[dragonKey('wants')].answer).toBe('The deeds before sunset');
    expect(node.sub.nodes.S007.wizardFields[dragonKey('dragon')].answer).toBe('The creditor syndicate');
    expect(node.sub.nodes.S022.wizardFields[dragonKey('defendPlan')].answer).toBe('Invite witnesses');
    expect(node.narrativeWizard.summaryFormat).toBe('dragon-prose');
    expect(node.body).not.toContain('What is good and valuable here?');
    expect(node.body).toContain('Possible escape'); expect(node.body).toContain('Possible defence'); expect(node.body).toContain('Possible attack');
    expect(JSON.stringify(src)).toBe(before);
  });

  it('migrates old role answers, native question answers and unrelated earlier writing', () => {
    const src = source(), questions = conceptQuestions(src, 'scene');
    const oldAnswers = { 'question:city': 'Old home', 'question:dragon': 'Old threat', 'question:wants': 'Control the square', 'node:S009': 'A shared history', 'node:S008': 'The home is divided', 'focus:extra': 'Keep this extra note' };
    const next = dragonAnswers(src, oldAnswers, [], questions);
    expect(next[dragonKey('city')]).toBe('Old home'); expect(next[dragonKey('valuable')]).toBe('A shared history');
    expect(next[dragonKey('wants')]).toBe('Control the square');
    const nextQuestions = dragonQuestions(src, [...questions, { key: 'node:S008', prompt: 'How this community acts', nodePath: ['S008'] }, { key: 'focus:extra', prompt: 'Extra context' }]);
    expect(nextQuestions.some(row => row.key === 'node:S008')).toBe(true);
    expect(nextQuestions.some(row => row.key === 'focus:extra')).toBe(true);
    expect(dragonSummary(next, nextQuestions)).toContain('Keep this extra note');
  });

  it.each(['nodes', 'nested', 'masterNodes'])('node edits update the wizard and description within %s', coll => {
    const node = build();
    const project = { ...makeEmptyProject('Dragon test'), nodes: coll === 'nodes' ? { D: node } : coll === 'nested' ? { ACT: { id: 'ACT', kind: 'masterAct', sub: { nodes: { D: node }, edges: [] } } } : {}, masterNodes: coll === 'masterNodes' ? { D: node } : {} };
    const scope = { coll: coll === 'masterNodes' ? coll : 'nodes', parentPath: coll === 'nested' ? ['ACT', 'D'] : ['D'] };
    const edited = reducer(project, { type: 'GRAPH_UPDATE_NODE', scope, id: 'S022', patch: wizardFieldPatch(node.sub.nodes.S022, dragonKey('defendPlan'), 'Bring everyone to the square') });
    const root = coll === 'nested' ? edited.nodes.ACT.sub.nodes.D : edited[coll].D;
    expect(root.body).toContain('Bring everyone to the square'); expect(root.body).not.toContain('Invite witnesses');
    expect(root.narrativeWizard.answers[dragonKey('defendPlan')]).toBe('Bring everyone to the square');
    expect(savedWizardSession(root, {}).answers[dragonKey('defendPlan')]).toBe('Bring everyone to the square');
    expect(locateGraph(edited, scope).nodes.S022.wizardFields[dragonKey('defendPlan')].answer).toBe('Bring everyone to the square');
  });

  it('retains layouts, changed node types, authored prose and deleted nodes when continuing', () => {
    let node = build();
    node = { ...node, sub: { ...node.sub, nodes: { ...node.sub.nodes, S022: { ...node.sub.nodes.S022, x: 3210, kind: 'storyBeat', body: 'My authored scene.', custom: 'keep' } } } };
    delete node.sub.nodes.S009;
    const session = savedWizardSession(node, {});
    const questions = dragonQuestions(session.source, session.record.questions);
    expect(questions.find(row => row.dragonField === 'valuable').nodePath).toBeUndefined();
    const addition = createWizardNode({ source: session.source, type: 'concept', id: 'D', title: node.title, focus: 'scene', roles: session.record.roles, questions, answers: { ...session.answers, [dragonKey('defendPlan')]: 'A revised assembly' } });
    const revised = reviseWizardResult(node, addition, session.source);
    expect(revised.sub.nodes.S009).toBeUndefined();
    expect(revised.sub.nodes.S022).toMatchObject({ x: 3210, kind: 'storyBeat', body: 'My authored scene.', custom: 'keep' });
    expect(revised.sub.nodes.S022.wizardFields[dragonKey('defendPlan')].answer).toBe('A revised assembly');
  });

  it('keeps long answers, empty answers and custom node prose independent', () => {
    const node = build(), original = node.sub.nodes.S007;
    const long = 'A detailed account of the threat. '.repeat(1000);
    const edited = { ...original, ...wizardFieldPatch(original, dragonKey('wants'), long) };
    expect(edited.wizardFields[dragonKey('wants')].answer).toBe(long);
    const custom = { ...edited, body: 'Separate authored writing.' };
    const patch = wizardFieldPatch(custom, dragonKey('wants'), '');
    expect(patch.body).toBeUndefined(); expect(patch.wizardFields[dragonKey('wants')].answer).toBe('');
    const saved = wizardLibraryRecord({ ...node, sub: { ...node.sub, nodes: { ...node.sub.nodes, S007: custom } } }, 'LIB-CUSTOM').entity;
    expect(build(saved, dragonAnswers(saved)).sub.nodes.S007.body).toBe('Separate authored writing.');
  });

  it('retains extra questions added to a custom template', () => {
    const src = source();
    src.questions.push({ key: 'weather', label: 'How does the weather change the options?' });
    const questions = dragonQuestions(src);
    expect(questions.filter(row => row.key === 'question:weather')).toHaveLength(1);
    expect(questions.filter(row => row.key === 'question:city')).toHaveLength(0);
    expect(dragonSummary({ 'question:weather': 'The northern road is flooded' }, questions)).toContain('The northern road is flooded');
    const saved = wizardLibraryRecord(createWizardNode({ source: src, type: 'concept', id: 'CUSTOM', title: 'Custom dilemma', questions, answers: { ...answers, 'question:weather': 'The northern road is flooded' }, roles: [], focus: 'scene' }), 'LIB-CUSTOM').entity;
    expect(dragonQuestions(saved).some(row => row.key === 'question:weather')).toBe(true);
    expect(dragonAnswers(saved)['question:weather']).toBe('The northern road is flooded');
  });

  it('updates a character-attached concept without losing another framework or manual writing', () => {
    const addition = build(source(), answers, 'character');
    let character = appendWizardResult({ id: 'C', kind: 'character', title: 'Moro', body: 'They own a bakery.' }, addition);
    const child = Object.values(character.sub.nodes).find(node => node.characterInput);
    expect(child.sub.nodes.S022.wizardFields).toBeDefined();
    let project = { ...makeEmptyProject('Character test'), nodes: { C: character } };
    project = reducer(project, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'nodes', parentPath: ['C', child.id] }, id: 'S022', patch: wizardFieldPatch(child.sub.nodes.S022, dragonKey('defendPlan'), 'Seek protection from the elders') });
    character = project.nodes.C;
    expect(character.body).toContain('They own a bakery.');
    expect(character.narrativeWizard.answers[dragonKey('defendPlan')]).toBe('Seek protection from the elders');
    expect(character.body).toContain('Seek protection from the elders');
    expect(savedWizardSession(character, {}).answers[dragonKey('defendPlan')]).toBe('Seek protection from the elders');
  });

  it('supports one-step undo and independent library copies', () => {
    const node = build(), project = { ...makeEmptyProject('Undo'), nodes: { D: node } };
    let state = { present: project, past: [], undoGroup: null };
    state = undoableReducer(state, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'nodes', parentPath: ['D'] }, id: 'S022', patch: wizardFieldPatch(node.sub.nodes.S022, dragonKey('defendPlan'), 'An undoable choice') });
    state = undoableReducer(state, { type: 'UNDO' });
    expect(state.present.nodes.D.body).toBe(node.body);
    const { entity } = wizardLibraryRecord(node, 'LIB-COPY');
    entity.nodes.S022.wizardFields[dragonKey('defendPlan')].answer = 'Library-only edit';
    expect(node.sub.nodes.S022.wizardFields[dragonKey('defendPlan')].answer).toBe('Invite witnesses');
  });
});
