import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { localDataPlugin } from './localData.js';
import { makeEmptyProject, migrateProject } from '../src/data/seed.js';
import { createStoryActivity, normalizeStoryDynamicsGraph, updateStoryDynamicsChart } from '../src/data/storyDynamics.js';
import { undoableReducer } from '../src/state/store.jsx';

describe('activity and overview journey persistence', () => {
  it('saves and reopens both scales, local tags and source links, and undoes activity removal', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'larpcraft-dynamics-test-'));
    let middleware;
    await fs.writeFile(path.join(directory, 'project.json'), JSON.stringify(makeEmptyProject('Dynamics test')));
    localDataPlugin(directory).configureServer({ middlewares: { use: handler => { middleware = handler; } } });
    const server = createServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end(); }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/local-data/project`;
    try {
      const before = await (await fetch(url)).json();
      const root = normalizeStoryDynamicsGraph(before.state.storyDynamicsGraph);
      const activity = { ...createStoryActivity(root, 'Escape'), start: 70, end: 80, sources: [{ coll: 'taskNodes', parentPath: ['ACT'], nodeId: 'M1', title: 'Timed puzzle' }] };
      const graph = updateStoryDynamicsChart({ ...root, durationMinutes: 300, activities: [activity] }, activity.id, { ...activity.graph, curves: [{ id: 'local', label: 'Escape tension', points: [{ x: 0, y: 10 }, { x: 50, y: 90 }], color: '#fff' }], tags: [{ id: 'victory', type: 'victory', label: 'Out of danger', x: 90, y: 60 }] });
      let state = { present: before.state, past: [], undoGroup: null };
      state = undoableReducer(state, { type: 'SET_STORY_DYNAMICS_GRAPH', graph });
      state = undoableReducer(state, { type: 'SET_STORY_DYNAMICS_GRAPH', graph: { ...graph, activities: [] } });
      state = undoableReducer(state, { type: 'UNDO' });
      expect(state.present.storyDynamicsGraph).toEqual(graph);
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: before.revision, state: state.present }) });
      expect(response.status).toBe(200);
      const reopened = migrateProject((await (await fetch(url)).json()).state);
      expect(normalizeStoryDynamicsGraph(reopened.storyDynamicsGraph)).toEqual(normalizeStoryDynamicsGraph(graph));
      expect(reopened.storyDynamicsGraph.curves).toEqual(root.curves);
      expect(reopened.storyDynamicsGraph.activities[0].graph.tags[0].label).toBe('Out of danger');
      expect(JSON.parse(await fs.readFile(path.join(directory, 'project.json'), 'utf8')).storyDynamicsGraph.activities[0].sources[0].nodeId).toBe('M1');
    } finally {
      await new Promise(resolve => server.close(resolve));
      const resolved = path.resolve(directory);
      if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith('larpcraft-dynamics-test-')) throw Error('Unexpected test cleanup path');
      await fs.rm(resolved, { recursive: true, force: true });
    }
  });
});
