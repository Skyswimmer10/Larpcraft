import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const hash = text => createHash('sha256').update(text).digest('hex');
const MAX_BYTES = 100 * 1024 * 1024;
async function body(req) {
  const chunks = []; let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > MAX_BYTES) throw new Error('Save exceeds 100 MB');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function localDataPlugin(directory = path.resolve('.larpcraft')) {
  let queue = Promise.resolve();
  async function writeAtomic(file, text) {
    await fs.mkdir(directory, { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    const handle = await fs.open(temporary, 'wx');
    try { await handle.writeFile(text); await handle.sync(); } finally { await handle.close(); }
    try { await fs.rename(temporary, file); } catch (error) { await fs.unlink(temporary).catch(() => {}); throw error; }
  }
  return {
    name: 'larpcraft-local-data',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (!url.pathname.startsWith('/api/local-data/')) return next();
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'application/json');
        const reply = (status, value) => { res.statusCode = status; res.end(JSON.stringify(value)); };
        const host = req.headers.host || '';
        if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)
          || (req.headers.origin && req.headers.origin !== `http://${host}`)
          || req.headers['sec-fetch-site'] === 'cross-site') return reply(403, { error: 'Local same-origin access only' });
        const name = url.pathname.slice('/api/local-data/'.length);
        if (!['library', 'project', 'archive'].includes(name)) return reply(404, { error: 'Unknown store' });
        try {
          if (req.method === 'GET' && name !== 'archive') {
            await queue;
            const text = await fs.readFile(path.join(directory, `${name}.json`), 'utf8');
            return reply(200, { state: JSON.parse(text), revision: hash(text) });
          }
          if (req.method !== 'POST' || !req.headers['content-type']?.startsWith('application/json')) return reply(405, { error: 'JSON POST required' });
          const data = await body(req);
          const task = queue.then(async () => {
            if (name === 'archive') {
              const text = JSON.stringify(data);
              const folder = path.join(directory, 'browser-backups');
              await fs.mkdir(folder, { recursive: true });
              const file = path.join(folder, `${hash(text)}.json`);
              await fs.writeFile(file, text, { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; });
              return reply(200, { archived: true });
            }
            if (!data.state || typeof data.state !== 'object' || Array.isArray(data.state)) return reply(400, { error: 'Invalid state' });
            const file = path.join(directory, `${name}.json`);
            const previous = await fs.readFile(file, 'utf8');
            if (hash(previous) !== data.revision) return reply(409, { error: 'Another tab or browser saved newer changes. This browser draft is retained; reconcile before reloading.' });
            const text = JSON.stringify(data.state);
            if (text !== previous) {
              // Keep the preceding committed version in addition to browser archives.
              await writeAtomic(path.join(directory, `${name}.previous.json`), previous);
              await writeAtomic(file, text);
            }
            return reply(200, { revision: hash(text) });
          });
          queue = task.catch(() => {});
          await task;
        } catch (error) { reply(500, { error: error.message }); }
      });
    },
  };
}
