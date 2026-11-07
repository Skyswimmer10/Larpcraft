import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { localDataPlugin } from './localData.js';
import bundled from '../src/data/deployedLibrary.json';
import { makeEmptyProject, migrateProject, makeLibrarySeed, migrateLibrary } from '../src/data/seed.js';
import { createWizardNode, conceptRoles, reviseWizardResult, wizardLibraryRecord } from '../src/lib/narrativeWizard.js';
import { dragonQuestions, dragonKey, isDragonConcept } from '../src/lib/dragonWorkshop.js';
import { savedWizardSession } from '../src/lib/narrativeMemory.js';
import { wizardFieldPatch } from '../src/lib/wizardFields.js';
import { reducer } from '../src/state/reducer.js';

describe('Dragon workshop persistence', () => {
  it('reopens editable node mappings, revises the same graph, and keeps library copies independent', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'larpcraft-dragon-test-'));
    await fs.writeFile(path.join(directory, 'project.json'), JSON.stringify(makeEmptyProject('Workshop persistence')));
    await fs.writeFile(path.join(directory, 'library.json'), JSON.stringify(makeLibrarySeed()));
    let middleware;
    localDataPlugin(directory).configureServer({ middlewares: { use: handler => { middleware = handler; } } });
    const server = createServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end(); }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/local-data`;
    const read = async key => (await fetch(`${url}/${key}`)).json();
    const write = async (key, before, state) => {
      const response = await fetch(`${url}/${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: before.revision, state }) });
      expect(response.status).toBe(200);
    };
    try {
      const before = await read('project'), src = structuredClone(bundled.concepts['LIB-CPT-DRAGON']);
      const bank = { [dragonKey('city')]: 'The market', [dragonKey('dragon')]: 'A famine', [dragonKey('defendPlan')]: 'Share the grain', [dragonKey('escapePlan')]: 'A long route description. '.repeat(200) };
      const node = createWizardNode({ source: src, type: 'concept', id: 'D', title: 'A custom-named dilemma', questions: dragonQuestions(src), answers: bank, roles: conceptRoles(src), focus: 'scene' });
      let project = { ...before.state, nodes: { D: node }, masterNodes: { ACT: { id: 'ACT', kind: 'masterAct', sub: { nodes: { D: structuredClone(node) }, edges: [] } } } };
      project = reducer(project, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'masterNodes', parentPath: ['ACT', 'D'] }, id: 'S022', patch: wizardFieldPatch(node.sub.nodes.S022, dragonKey('defendPlan'), 'Ask neighbouring towns for grain') });
      await write('project', before, project);
      const reopened = migrateProject((await read('project')).state);
      expect(reopened.nodes.D.narrativeWizard.answers[dragonKey('defendPlan')]).toBe('Share the grain');
      const nested = reopened.masterNodes.ACT.sub.nodes.D;
      expect(nested.body).toContain('Ask neighbouring towns for grain');
      const session = savedWizardSession(nested, {});
      expect(session.answers[dragonKey('escapePlan')]).toBe(bank[dragonKey('escapePlan')].trim());
      expect(session.answers[dragonKey('defendPlan')]).toBe('Ask neighbouring towns for grain');
      const addition = createWizardNode({ source: session.source, type: 'concept', id: 'D', title: nested.title, questions: dragonQuestions(session.source, session.record.questions), answers: { ...session.answers, [dragonKey('defendPlan')]: 'Ration the grain' }, roles: session.record.roles, focus: 'scene' });
      const revised = reviseWizardResult(nested, addition, session.source);
      expect(Object.keys(revised.sub.nodes)).toEqual(Object.keys(nested.sub.nodes));
      expect(revised.sub.edges).toEqual(nested.sub.edges);
      expect(revised.sub.nodes.S022.wizardFields[dragonKey('defendPlan')].answer).toBe('Ration the grain');
      const libBefore = await read('library'), saved = wizardLibraryRecord(revised, 'LIB-DRAGON-SAVED');
      await write('library', libBefore, { ...libBefore.state, [saved.coll]: { ...libBefore.state[saved.coll], [saved.entity.id]: saved.entity } });
      const lib = migrateLibrary((await read('library')).state), template = lib.concepts['LIB-DRAGON-SAVED'];
      expect(isDragonConcept(template)).toBe(true);
      expect(template.nodes.S022.wizardFields[dragonKey('defendPlan')].answer).toBe('Ration the grain');
      template.nodes.S022.wizardFields[dragonKey('defendPlan')].answer = 'Library edit';
      expect(revised.sub.nodes.S022.wizardFields[dragonKey('defendPlan')].answer).toBe('Ration the grain');
      expect(JSON.parse(await fs.readFile(path.join(directory, 'project.json'), 'utf8')).masterNodes.ACT.sub.nodes.D.body).toBe(nested.body);
    } finally {
      await new Promise(resolve => server.close(resolve));
      const resolved = path.resolve(directory);
      if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith('larpcraft-dragon-test-')) throw Error('Unexpected test cleanup path');
      await fs.rm(resolved, { recursive: true, force: true });
    }
  });
});
