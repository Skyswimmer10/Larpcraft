import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { localDataPlugin } from './localData.js';
import { makeEmptyProject, migrateProject } from '../src/data/seed.js';
import { createKolbDraft, editKolb, addKolbTurn } from '../src/lib/kolbWizard.js';
import { reducer } from '../src/state/reducer.js';
import { stripMasterCollectionsFromProject } from '../src/lib/storageOwnership.js';

describe('Kolb project persistence', () => {
  it('keeps two-cycle drafts, provenance and preferences through the actual local API and startup migration', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'larpcraft-kolb-test-'));
    await fs.writeFile(path.join(directory, 'project.json'), JSON.stringify(makeEmptyProject('Kolb persistence test')));
    let middleware;
    localDataPlugin(directory).configureServer({ middlewares: { use: handler => { middleware = handler; } } });
    const server = createServer((request, response) => middleware(request, response, () => { response.statusCode = 404; response.end(); }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/local-data/project`;
    try {
      const before = await (await fetch(url)).json();
      let draft = createKolbDraft({ id: 'KOLB-DISK', purpose: 'character', title: 'A new understanding' });
      draft = editKolb(draft, 'turns.0.ae.branches.refute', { enabled: true, text: 'The river breaks through the wall.', consequence: 'A new plan is needed.' });
      draft = addKolbTurn(draft, 'refute');
      draft = editKolb(draft, 'meta.depth', 'advanced');
      let project = reducer(makeEmptyProject('Kolb persistence test'), { type: 'SAVE_KOLB_DRAFT', draft });
      project = reducer(project, { type: 'SET_KOLB_PREFERENCES', preferences: { lastEntry: 'AE', lastDepth: 'advanced' } });
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: before.revision, state: stripMasterCollectionsFromProject(project) }) });
      expect(response.status).toBe(200);
      const reopened = migrateProject((await (await fetch(url)).json()).state);
      expect(reopened.kolbWizardDrafts['KOLB-DISK'].turns[1].ce.anchor).toBe('The river breaks through the wall.');
      expect(reopened.kolbWizardDrafts['KOLB-DISK'].turns[0].ae.observed).toBeNull();
      expect(reopened.kolbWizardDrafts['KOLB-DISK'].fieldMeta['turns.1.ce.anchor'].source).toBe('linked');
      expect(reopened.kolbWizardPreferences.lastEntry).toBe('AE');
      expect(Object.keys(reopened.nodes)).toHaveLength(0);
      expect(JSON.parse(await fs.readFile(path.join(directory, 'project.json'), 'utf8')).kolbWizardDrafts['KOLB-DISK']).toEqual(draft);
    } finally {
      await new Promise(resolve => server.close(resolve));
      const resolved = path.resolve(directory);
      if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('larpcraft-kolb-test-')) throw new Error('Unexpected test directory');
      await fs.rm(resolved, { recursive: true, force: true });
    }
  });
});
