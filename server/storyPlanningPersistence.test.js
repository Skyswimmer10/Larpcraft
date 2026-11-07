import { expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { localDataPlugin } from './localData.js';
import { makeEmptyProject, makeLibrarySeed, migrateProject } from '../src/data/seed.js';
import { reducer } from '../src/state/reducer.js';
import { storyBeatPatch } from '../src/lib/storyBeat.js';
import { importNarrative } from '../src/state/bridge.js';

it('saves plot drafts, direction overrides and nested beat review data through the real local API', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'larpcraft-story-planning-test-'));
  const library = makeLibrarySeed();
  await fs.writeFile(path.join(directory, 'project.json'), JSON.stringify(makeEmptyProject('Planning persistence')));
  await fs.writeFile(path.join(directory, 'library.json'), JSON.stringify(library));
  let middleware;
  localDataPlugin(directory).configureServer({ middlewares: { use: handler => { middleware = handler; } } });
  const server = createServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/local-data/project`;
  try {
    const before = await (await fetch(url)).json();
    const beat = { id: 'B', kind: 'storyBeat', title: 'A warning', body: 'Keep this scene.', storyBeat: { sections: ['situation'], situation: 'The courier arrives.', retiredField: 'Keep old writing.' } };
    let project = { ...before.state, masterNodes: { A: { id: 'A', kind: 'masterAct', title: 'Opening', storyDirection: { tones: [] }, sub: { nodes: { B: beat }, edges: [] } } } };
    for (const change of [
      { direction: { themes: ['Loyalty vs truth', 'A custom theme'], tones: ['Winter night'] } },
      { structure: 'journey12', stage: 'ordinary', question: 'life', value: 'A market.' },
      { activeStructure: 'event6' },
      { structure: 'event6', stage: 'ground', question: 'normal', value: 'A winter festival.' },
      { structure: 'event6', stage: 'ground', link: { coll: 'masterNodes', parentPath: ['A'], nodeId: 'B', title: 'A warning' } },
    ]) project = reducer(project, { type: 'PATCH_STORY_PLANNING', change });
    const review = { impacts: ['Shapes villain’s motivation', 'Custom impact'], threads: [{ id: 'T', title: 'Who sent it?', kind: 'story', status: 'revealed', notes: 'A familiar seal.', resolution: 'The courier did.' }, { id: 'I', title: 'Conflicting dates', kind: 'inconsistency', status: 'open', notes: 'Check the readout.' }] };
    project = reducer(project, { type: 'GRAPH_UPDATE_NODE', scope: { coll: 'masterNodes', parentPath: ['A'] }, id: 'B', patch: storyBeatPatch(beat, review) });
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: before.revision, state: project }) });
    expect(response.status).toBe(200);
    const reopened = migrateProject((await (await fetch(url)).json()).state);
    expect(reopened.meta.storyPlanning).toEqual(project.meta.storyPlanning);
    expect(reopened.masterNodes.A.storyDirection).toEqual({ tones: [] });
    expect(reopened.masterNodes.A.sub.nodes.B).toEqual(project.masterNodes.A.sub.nodes.B);
    expect(reopened.masterNodes.A.sub.nodes.B.storyBeat.retiredField).toBe('Keep old writing.');
    expect(reopened.masterNodes.A.sub.nodes.B.body).toBe('Keep this scene.');
    expect(JSON.parse(await fs.readFile(path.join(directory, 'project.json'), 'utf8')).meta.storyPlanning).toEqual(project.meta.storyPlanning);
    expect(JSON.parse(await fs.readFile(path.join(directory, 'library.json'), 'utf8'))).toEqual(library);
    const record = { id: 'LIB-B', name: 'A warning', nodeKind: 'storyBeat', template: reopened.masterNodes.A.sub.nodes.B };
    const imported = importNarrative({ ...library, narrative: { 'LIB-B': record } }, makeEmptyProject('Different game'), 'LIB-B');
    expect(imported.nodes[imported.createdId].storyBeat).toMatchObject(review);
  } finally {
    await new Promise(resolve => server.close(resolve));
    const resolved = path.resolve(directory);
    if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith('larpcraft-story-planning-test-')) throw Error('Unexpected test cleanup path');
    await fs.rm(resolved, { recursive: true, force: true });
  }
});
