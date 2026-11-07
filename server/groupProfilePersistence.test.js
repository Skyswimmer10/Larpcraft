import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { localDataPlugin } from './localData.js';
import { makeEmptyProject, migrateProject } from '../src/data/seed.js';
import { createGroupResult, saveGroupResult, groupExport } from '../src/lib/groupProfile.js';
import { savedWizardSession } from '../src/lib/narrativeMemory.js';

describe('group profile disk persistence', () => {
  it('retains editable filled trees, member references, role-specific loyalties and unfinished drafts through the local API', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'larpcraft-group-test-'));
    await fs.writeFile(path.join(directory, 'project.json'), JSON.stringify(makeEmptyProject('Group persistence test')));
    let middleware;
    localDataPlugin(directory).configureServer({ middlewares: { use: handler => { middleware = handler; } } });
    const server = createServer((request, response) => middleware(request, response, () => { response.statusCode = 404; response.end(); }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/local-data/project`;
    try {
      const before = await (await fetch(url)).json();
      const facts = { kind: 'Institution', size: 'Several hundred', purpose: 'Maintain the roads', institution: true,
        members: [{ id: 'member', name: 'Mira', role: 'Mediator', loyalty: 'Council', ref: { coll: 'nodes', path: ['C'] } }] };
      const group = createGroupResult({ id: 'G', title: 'Lantern Guild', facts, answers: { mandate: 'Keep trade routes open.', succession: 'The council elects a master.', 'pressures:choice': 'Resource shortages' } });
      group.image = { dataUrl: 'data:image/png;base64,guild', name: 'guild.png', type: 'image/png' };
      group.characterProfile.manualDescription = 'Protected description of the guild.';
      group.body = group.description = 'Protected description of the guild.';
      const project = { ...makeEmptyProject(), nodes: { G: group, C: { id: 'C', kind: 'character', title: 'Mira' } }, groupWizardDrafts: { draft: { id: 'draft', schemaVersion: 1, title: 'A second group', facts, answers: { bonds: 'Shared promises.' }, step: 'power' } } };
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: before.revision, state: project }) });
      expect(response.status).toBe(200);
      const reopened = migrateProject((await (await fetch(url)).json()).state);
      expect(reopened.nodes.G.groupFacts).toEqual(group.groupFacts);
      expect(reopened.nodes.G.body).toBe('Protected description of the guild.');
      expect(reopened.nodes.G.sub).toEqual(group.sub);
      expect(reopened.nodes.G.image).toEqual(group.image);
      expect(reopened.groupWizardDrafts.draft.answers.bonds).toBe('Shared promises.');
      const session = savedWizardSession(reopened.nodes.G, {});
      expect(session.type).toBe('framework');
      expect(session.answers.mandate).toBe('Keep trade routes open.');
      const edited = saveGroupResult(reopened.nodes.G, { id: 'G', title: 'Lantern Guild', facts, answers: { ...session.answers, mandate: 'Protect caravans only during winter.' } }, session.record);
      expect(edited.body).toBe('Protected description of the guild.');
      expect(edited.characterProfile.generated).toContain('Protect caravans only during winter.');
      expect(groupExport(edited, true)).toContain('How are leaders appointed or replaced?');
      expect(JSON.parse(await fs.readFile(path.join(directory, 'project.json'), 'utf8')).nodes.G).toEqual(project.nodes.G);
    } finally {
      await new Promise(resolve => server.close(resolve));
      const resolved = path.resolve(directory);
      if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith('larpcraft-group-test-')) throw Error('Unexpected test cleanup path');
      await fs.rm(resolved, { recursive: true, force: true });
    }
  });
});
