import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { localDataPlugin } from './localData.js';
import { locationMapDefaults, makeEmptyProject, migrateProject } from '../src/data/seed.js';

describe('location annotation disk persistence', () => {
  it('retains names, colors, visibility, geographic anchors and existing links through save/reload', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'larpcraft-map-test-'));
    await fs.writeFile(path.join(directory, 'project.json'), JSON.stringify(makeEmptyProject('Map persistence test')));
    let middleware;
    localDataPlugin(directory).configureServer({ middlewares: { use: handler => { middleware = handler; } } });
    const server = createServer((request, response) => middleware(request, response, () => { response.statusCode = 404; response.end(); }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const url = `http://127.0.0.1:${server.address().port}/api/local-data/project`;
      const location = { id: 'L', name: 'Camp', ...locationMapDefaults(), markers: [{ id: 'M', kind: 'sensor', refId: 'S', x: 20, y: 30, audience: 'facilitator' }], arrows: [{ id: 'A', x1: 2, y1: 3, x2: 5, y2: 7 }], mapLabels: [{ id: 'N', text: 'Old well', x: 3, y: 4, audience: 'all', color: '#e8d25c', osmAnchor: { start: { lat: 56.9496, lon: 24.1052 } } }], mapZones: [{ id: 'Z', name: 'Assembly area', x: 10, y: 20, w: 40, h: 30, audience: 'facilitator', color: '#79c9a5', storyLocationId: 'STORY' }] };
      const project = { ...makeEmptyProject(), locations: { L: location } };
      const before = await (await fetch(url)).json();
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: before.revision, state: project }) });
      expect(response.status).toBe(200);
      const reopened = migrateProject((await (await fetch(url)).json()).state);
      expect(reopened.locations.L).toEqual(location);
      expect(JSON.parse(await fs.readFile(path.join(directory, 'project.json'), 'utf8')).locations.L).toEqual(location);
    } finally {
      await new Promise(resolve => server.close(resolve));
      const resolved = path.resolve(directory);
      if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith('larpcraft-map-test-')) throw Error('Unexpected test cleanup path');
      await fs.rm(resolved, { recursive: true, force: true });
    }
  });
});
