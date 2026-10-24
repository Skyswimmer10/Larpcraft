import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { localDataPlugin } from './localData.js';
import { makeEmptyProject, migrateProject } from '../src/data/seed.js';
import { createFateDraft, editFate, fateDetailPath, getFate } from '../src/lib/fateWizard.js';
import { reducer } from '../src/state/reducer.js';
import { stripMasterCollectionsFromProject } from '../src/lib/storageOwnership.js';

describe('FATE project draft persistence', () => {
  it('round-trips a separate unfinished draft and preferences through the real local API and startup migration', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'larpcraft-fate-test-'));
    await fs.writeFile(path.join(directory, 'project.json'), JSON.stringify(makeEmptyProject('FATE persistence test')));
    let middleware;
    localDataPlugin(directory).configureServer({ middlewares: { use: handler => { middleware = handler; } } });
    const server = createServer((request, response) => middleware(request, response, () => { response.statusCode = 404; response.end(); }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/local-data/project`;
    try {
      const before = await (await fetch(url)).json();
      let draft = createFateDraft({ id: 'DRAFT-ON-DISK', purpose: 'character', title: 'A keeper', scope: { coll: 'nodes' } });
      draft = editFate(draft, 'meta.depth', 'advanced');
      draft = editFate(draft, 'lastStep', 'E');
      draft = editFate(draft, 'emotion.curve', [{ t: 0, v: 20 }, { t: 50, v: 90 }, { t: 100, v: 30 }]);
      draft = editFate(draft, 'meta.purpose', 'communication');
      draft = editFate(draft, 'title', 'Conversation A');
      draft = editFate(draft, 'communication.speaker', 'Mickey');
      draft = editFate(draft, 'communication.listener', 'Scooby');
      draft = editFate(draft, 'authority.source', ['A secret', 'Evidence']);
      draft = editFate(draft, fateDetailPath('authority.source', 'A secret'), 'He knows where the food went.');
      draft = editFate(draft, 'communication.lines.A', 'I know where to look.');
      draft = editFate(draft, 'meta.purpose', 'character');
      draft = editFate(draft, 'lastStep', 'E');
      let project = reducer(makeEmptyProject('FATE persistence test'), { type: 'SAVE_FATE_DRAFT', draft });
      project = reducer(project, { type: 'SET_FATE_PREFERENCES', preferences: { lastDepth: 'advanced', customVocabulary: { 'focus.channels': ['A tapping pipe'] } } });
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: before.revision, state: stripMasterCollectionsFromProject(project) }) });
      expect(response.status).toBe(200);
      const disk = JSON.parse(await fs.readFile(path.join(directory, 'project.json'), 'utf8'));
      const reopened = migrateProject((await (await fetch(url)).json()).state);
      expect(disk.fateWizardDrafts['DRAFT-ON-DISK']).toEqual(draft);
      expect(reopened.fateWizardDrafts['DRAFT-ON-DISK'].lastStep).toBe('E');
      expect(reopened.fateWizardDrafts['DRAFT-ON-DISK'].emotion.curve[1].v).toBe(90);
      const conversation = reopened.fateWizardDrafts['DRAFT-ON-DISK'].purposeBanks.communication;
      expect(conversation.communication.listener).toBe('Scooby');
      expect(conversation.authority.source).toEqual(['A secret', 'Evidence']);
      expect(getFate(conversation, fateDetailPath('authority.source', 'A secret'))).toBe('He knows where the food went.');
      expect(conversation.communication.lines.A).toBe('I know where to look.');
      expect(reopened.fateWizardPreferences.customVocabulary['focus.channels']).toEqual(['A tapping pipe']);
      expect(Object.keys(reopened.nodes)).toHaveLength(0);
    } finally {
      await new Promise(resolve => server.close(resolve));
      const resolved = path.resolve(directory);
      if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('larpcraft-fate-test-')) throw new Error('Unexpected test directory');
      await fs.rm(resolved, { recursive: true, force: true });
    }
  });
});
