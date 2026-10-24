import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { localDataPlugin } from './localData.js';
import { makeEmptyProject, migrateProject } from '../src/data/seed.js';
import { createValuesDraft, editValues, customValue, addCustomValue, addValuesRow } from '../src/lib/humanValuesWizard.js';
import { reducer } from '../src/state/reducer.js';
import { stripMasterCollectionsFromProject } from '../src/lib/storageOwnership.js';

describe('Human Values project persistence', () => {
  it('round-trips advanced drafts, custom values and preferences through the real local API and disk', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'larpcraft-values-test-'));
    await fs.writeFile(path.join(directory, 'project.json'), JSON.stringify(makeEmptyProject('Values persistence test')));
    let middleware;
    localDataPlugin(directory).configureServer({ middlewares: { use: handler => { middleware = handler; } } });
    const server = createServer((request, response) => middleware(request, response, () => { response.statusCode = 404; response.end(); }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/local-data/project`;
    try {
      const before = await (await fetch(url)).json(), definition = customValue('Home', 'Kept\nThreatened\nLost');
      let draft = addCustomValue(createValuesDraft({ id: 'VALUES-DISK', title: 'Home at risk' }), definition);
      draft = editValues(draft, 'meta.depth', 'advanced'); draft = addValuesRow(draft, 'reveal');
      draft = editValues(draft, 'reveal.rows.0.text', 'The mortgage is already paid.');
      draft = editValues(draft, 'lastStep', 'reveal');
      let project = reducer(makeEmptyProject('Values persistence test'), { type: 'SAVE_VALUES_DRAFT', draft });
      project = reducer(project, { type: 'ADD_HUMAN_VALUE', definition });
      project = reducer(project, { type: 'SET_VALUES_PREFERENCES', preferences: { lastDepth: 'advanced', lastPurpose: 'values' } });
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: before.revision, state: stripMasterCollectionsFromProject(project) }) });
      expect(response.status).toBe(200);
      const reopened = migrateProject((await (await fetch(url)).json()).state);
      expect(reopened.valuesWizardDrafts['VALUES-DISK']).toEqual(draft);
      expect(reopened.humanValuesLibrary).toEqual([definition]);
      expect(reopened.valuesWizardPreferences.lastDepth).toBe('advanced');
      expect(Object.keys(reopened.nodes)).toHaveLength(0);
      expect(JSON.parse(await fs.readFile(path.join(directory, 'project.json'), 'utf8')).valuesWizardDrafts['VALUES-DISK'].lastStep).toBe('reveal');
      project = reducer(reopened, { type: 'REMOVE_VALUES_DRAFT', id: 'VALUES-DISK' });
      expect(project.valuesWizardDrafts).toEqual({}); expect(project.humanValuesLibrary).toHaveLength(1);
    } finally {
      await new Promise(resolve => server.close(resolve));
      const resolved = path.resolve(directory);
      if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('larpcraft-values-test-')) throw new Error('Unexpected test directory');
      await fs.rm(resolved, { recursive: true, force: true });
    }
  });
});
