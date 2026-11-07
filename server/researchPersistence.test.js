import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { localDataPlugin } from './localData.js';
import { makeEmptyProject, makeLibrarySeed, migrateLibrary, migrateProject } from '../src/data/seed.js';
import { stripMasterCollectionsFromProject } from '../src/lib/storageOwnership.js';

describe('research and media disk persistence', () => {
  it('round-trips library attachments and tables separately from character media, portrait and wizard answers', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'larpcraft-research-test-'));
    await fs.writeFile(path.join(directory, 'library.json'), JSON.stringify(makeLibrarySeed()));
    await fs.writeFile(path.join(directory, 'project.json'), JSON.stringify(makeEmptyProject()));
    let middleware;
    localDataPlugin(directory).configureServer({ middlewares: { use: handler => { middleware = handler; } } });
    const server = createServer((request, response) => middleware(request, response, () => { response.statusCode = 404; response.end(); }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/local-data`;
    try {
      const image = { id: 'IMG', name: 'study.png', type: 'image/png', dataUrl: 'data:image/png;base64,YWJj', size: 3 };
      const pdf = { id: 'PDF', name: 'source.pdf', type: 'application/pdf', dataUrl: 'data:application/pdf;base64,YWJj', size: 3 };
      const research = { REF: { id: 'REF', title: 'Costume sources', credit: 'Source author', panels: [{ id: 'P', type: 'file', file: pdf }, { id: 'T', type: 'table', columns: [{ id: 'name', label: 'Name' }, { id: 'value', label: 'Value' }, { id: 'unit', label: 'Unit' }], rows: [{ id: 'R', cells: { name: 'Cloth', value: '5', unit: 'm' } }] }] } };
      const node = { id: 'C', kind: 'character', title: 'Mira', body: 'Existing prose.', image, narrativeWizard: { answers: { color: 'Blue' } }, researchIds: ['REF'], mediaGallery: [{ id: 'M', type: 'image', file: image, caption: 'Costume study' }, { id: 'V', type: 'video', url: 'https://example.com/greeting.mp4', caption: 'At dusk' }] };
      const states = { library: { ...makeLibrarySeed(), research }, project: stripMasterCollectionsFromProject({ ...makeEmptyProject(), research, nodes: { C: node } }) };
      for (const [kind, state] of Object.entries(states)) {
        const before = await (await fetch(`${base}/${kind}`)).json();
        const response = await fetch(`${base}/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: before.revision, state }) });
        expect(response.status).toBe(200);
      }
      const library = migrateLibrary((await (await fetch(`${base}/library`)).json()).state);
      const project = migrateProject((await (await fetch(`${base}/project`)).json()).state);
      expect(library.research).toEqual(research);
      expect(project.nodes.C.mediaGallery).toEqual(node.mediaGallery);
      expect(project.nodes.C.researchIds).toEqual(['REF']);
      expect(project.nodes.C.image).toEqual(image);
      expect(project.nodes.C.narrativeWizard.answers.color).toBe('Blue');
      expect(project).not.toHaveProperty('research');
      expect(JSON.parse(await fs.readFile(path.join(directory, 'project.json'), 'utf8')).nodes.C.mediaGallery).toEqual(node.mediaGallery);
    } finally {
      await new Promise(resolve => server.close(resolve));
      const resolved = path.resolve(directory);
      if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith('larpcraft-research-test-')) throw Error('Unexpected test cleanup path');
      await fs.rm(resolved, { recursive: true, force: true });
    }
  });
});
