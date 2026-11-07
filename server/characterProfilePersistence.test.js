import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { localDataPlugin } from './localData.js';
import { makeEmptyProject, migrateProject } from '../src/data/seed.js';
import { characterInputSnapshot, characterProfilePatch, characterExport } from '../src/lib/characterProfile.js';
import { savedWizardSessions } from '../src/lib/narrativeMemory.js';
import { createWizardNode, appendWizardResult } from '../src/lib/narrativeWizard.js';
import { reducer } from '../src/state/reducer.js';

describe('character source persistence', () => {
  it('retains editable source snapshots, protected writing, live links and current export through disk save and migration', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'larpcraft-character-test-'));
    await fs.writeFile(path.join(directory, 'project.json'), JSON.stringify(makeEmptyProject('Character persistence test')));
    let middleware;
    localDataPlugin(directory).configureServer({ middlewares: { use: handler => { middleware = handler; } } });
    const server = createServer((request, response) => middleware(request, response, () => { response.statusCode = 404; response.end(); }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api/local-data/project`;
    try {
      const before = await (await fetch(url)).json();
      const input = { id: 'P', kind: 'concept', title: 'A promise', body: 'They seek shelter at dawn.' };
      const source = { id: 'SOURCE', name: 'A responsibility', category: 'characterConcept', nodes: {}, edges: [] };
      const wizard = createWizardNode({ source, type: 'concept', title: 'Their duty', focus: 'character', id: 'W', questions: [{ key: 'duty', prompt: 'What duty matters?' }], answers: { duty: 'They protect the village.' } });
      let node = appendWizardResult({ id: 'C', kind: 'character', title: 'Mira', body: 'Handwritten introduction.' }, wizard);
      node = characterProfilePatch(node, { nodes: { P: input } }, { links: [{ nodeId: 'P', snapshot: characterInputSnapshot(input) }], details: { secrets: 'They know the hidden path.' } });
      node.characterFacts = { gender: 'Woman', race: 'Human', age: '39', role: 'Main character', goal: 'Protect the village', relationships: [{ id: 'r', type: 'Loyal to', name: 'Village council' }] };
      node.image = { dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6r8AAAAASUVORK5CYII=', name: 'mira.png', type: 'image/png' };
      node.characterProfile.performanceText = 'They speak quietly.\nWelcome, traveller.';
      node.characterAttributes = { version: 1, fields: [{ id: 'personality', label: 'Personality', category: 'personality', kind: 'tags', values: ['Patient', 'Curious'] }, { id: 'custom:mark', label: 'Mark', category: 'custom', kind: 'text', value: 'Silver hand' }] };
      const project = reducer({ ...makeEmptyProject(), nodes: { C: node, P: input } }, { type: 'UPDATE_ENTITY', coll: 'nodes', id: 'P', patch: { body: 'They seek shelter only during storms.' } });
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: before.revision, state: project }) });
      expect(response.status).toBe(200);
      const reopened = migrateProject((await (await fetch(url)).json()).state);
      const character = reopened.nodes.C;
      expect(character.body).toContain('Handwritten introduction.');
      expect(character.body).toContain('only during storms');
      expect(character.body).not.toContain('at dawn');
      expect(savedWizardSessions(character, {})[0].answers.duty).toBe('They protect the village.');
      expect(character.characterCanvas.version).toBe(1);
      const canvasInput = character.sub.nodes[character.narrativeWizard.attachedChildId];
      expect(canvasInput.characterInput.sessionId).toBe(character.narrativeWizard.sessionId);
      expect(Object.values(canvasInput.sub.nodes).some(node => node.wizardAnswer === 'They protect the village.')).toBe(true);
      expect(characterExport(character, reopened, 'ai')).toContain('They know the hidden path.');
      expect(characterExport(character, reopened, 'ai')).toContain('Loyal to: Village council');
      expect(characterExport(character, reopened, 'ai')).toContain('Welcome, traveller.');
      expect(character.characterFacts).toEqual(node.characterFacts);
      expect(character.characterAttributes).toEqual(node.characterAttributes);
      expect(characterExport(character, reopened, 'full')).toContain('Personality: Patient, Curious');
      expect(characterExport(character, reopened, 'ai')).toContain('Mark: Silver hand');
      expect(character.image).toEqual(node.image);
      expect(character.characterProfile.links[0].snapshot.body).toContain('only during storms');
      expect(JSON.parse(await fs.readFile(path.join(directory, 'project.json'), 'utf8')).nodes.C).toEqual(project.nodes.C);
    } finally {
      await new Promise(resolve => server.close(resolve));
      const resolved = path.resolve(directory);
      if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith('larpcraft-character-test-')) throw Error('Unexpected test cleanup path');
      await fs.rm(resolved, { recursive: true, force: true });
    }
  });
});
