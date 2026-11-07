import { expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { localDataPlugin } from './localData.js';
import { makeEmptyProject, makeLibrarySeed, migrateProject } from '../src/data/seed.js';
import { reducer } from '../src/state/reducer.js';
import { applyRelationshipWizardResult, createRelationship, relationshipsFor } from '../src/lib/relationships.js';

it('persists one developed relationship across root and nested characters without changing the library', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'larpcraft-relationship-test-'));
  const library = makeLibrarySeed();
  await fs.writeFile(path.join(directory, 'project.json'), JSON.stringify(makeEmptyProject('Relationship test')));
  await fs.writeFile(path.join(directory, 'library.json'), JSON.stringify(library));
  let middleware;
  localDataPlugin(directory).configureServer({ middlewares: { use: handler => { middleware = handler; } } });
  const server = createServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/local-data/project`;
  try {
    const before = await (await fetch(url)).json();
    const fromRef = { coll: 'nodes', parentPath: [], nodeId: 'J' }, toRef = { coll: 'nodes', parentPath: ['D'], nodeId: 'C' };
    let project = { ...makeEmptyProject('Relationship test'), nodes: {
      J: { id: 'J', kind: 'character', title: 'John', body: 'Keep the character writing.' },
      D: { id: 'D', kind: 'concept', sub: { nodes: { C: { id: 'C', kind: 'character', title: 'Carl' } }, edges: [] } },
    } };
    let connection = createRelationship({ id: 'family', fromRef, fromName: 'John', toRef, toName: 'Carl', word: 'father', reverseLabel: 'Son of' });
    const input = { sessionId: 'family-session', sourceId: 'future-framework', questions: [{ key: 'want', prompt: 'What do they want?' }], answers: { want: 'Independence.' }, summary: 'Carl wants independence.' };
    connection = applyRelationshipWizardResult(connection, input);
    connection = applyRelationshipWizardResult({ ...connection, description: connection.description + ' John fears losing him.' }, { ...input, answers: { want: 'Respect.' }, summary: 'Carl wants respect.' });
    project = reducer(project, { type: 'ADD_ENTITY', coll: 'relationships', entity: connection });
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: before.revision, state: project }) });
    expect(response.status).toBe(200);
    const reopened = migrateProject((await (await fetch(url)).json()).state);
    expect(reopened.relationships.family).toEqual(connection);
    expect(relationshipsFor(reopened, toRef)[0]).toMatchObject({ label: 'Son of', targetName: 'John', description: 'Carl wants independence. John fears losing him.', pendingDescription: 'Carl wants respect.' });
    expect(reopened.nodes.D.sub.nodes.C.characterFacts.relationships[0].description).toBe(connection.description);
    expect(reopened.nodes.J.body).toBe('Keep the character writing.');
    expect(JSON.parse(await fs.readFile(path.join(directory, 'project.json'), 'utf8')).relationships.family.wizardInputs[0].answers.want).toBe('Respect.');
    expect(JSON.parse(await fs.readFile(path.join(directory, 'library.json'), 'utf8'))).toEqual(library);
  } finally {
    await new Promise(resolve => server.close(resolve));
    const resolved = path.resolve(directory);
    if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith('larpcraft-relationship-test-')) throw Error('Unexpected test cleanup path');
    await fs.rm(resolved, { recursive: true, force: true });
  }
});
