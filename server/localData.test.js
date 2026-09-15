import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { localDataPlugin } from './localData.js';

describe('local disk persistence', () => {
  it('shares images across clients, preserves previous data, archives drafts, and rejects stale or foreign writes', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'larpcraft-disk-test-'));
    const original = { images: { sample: { dataUrl: 'data:image/png;base64,aGVsbG8=' } }, name: 'Original' };
    await fs.writeFile(path.join(directory, 'library.json'), JSON.stringify(original));
    let middleware;
    localDataPlugin(directory).configureServer({ middlewares: { use: handler => { middleware = handler; } } });
    const server = createServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end(); }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const request = (name, data, headers = {}) => fetch(`${origin}/api/local-data/${name}`, data ? { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) } : undefined);
    try {
      const a = await (await request('library')).json();
      const b = await (await request('library')).json();
      const edit = { ...original, name: 'Edited in Brave' };
      expect((await request('library', { revision: a.revision, state: edit })).status).toBe(200);
      expect((await (await request('library')).json()).state).toEqual(edit);
      expect(JSON.parse(await fs.readFile(path.join(directory, 'library.previous.json'), 'utf8'))).toEqual(original);
      expect((await request('library', { revision: b.revision, state: { name: 'Stale Codex tab' } })).status).toBe(409);
      expect(JSON.parse(await fs.readFile(path.join(directory, 'library.json'), 'utf8'))).toEqual(edit);
      expect((await request('archive', { state: original })).status).toBe(200);
      expect((await fs.readdir(path.join(directory, 'browser-backups'))).length).toBe(1);
      expect((await request('library', { revision: a.revision, state: {} }, { Origin: 'https://example.com' })).status).toBe(403);
      expect((await request('unknown')).status).toBe(404);
    } finally {
      await new Promise(resolve => server.close(resolve));
      // Only remove the unique test directory created above.
      if (path.dirname(directory) !== os.tmpdir() || !path.basename(directory).startsWith('larpcraft-disk-test-')) throw new Error('Unexpected test directory');
      await fs.rm(directory, { recursive: true, force: true });
    }
  });
});
