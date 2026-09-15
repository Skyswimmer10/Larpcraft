// Local Vite sessions commit to disk; deployed builds retain browser storage.
// Browser snapshots remain recovery copies, never a silent substitute for disk.
import { get, set, del } from 'idb-keyval';

const IDB_TIMEOUT_MS = 1800;
const diskMode = import.meta.env.DEV;
const storeNames = { 'larpcraft:library': 'library', 'larpcraft:activeProject': 'project' };
const revisions = {}, pending = {}, diskTimers = {}, chains = {}, errors = {};
const listeners = new Set();
let status = diskMode ? 'Connecting to local files…' : 'Saved in this browser';
export const subscribeStorageStatus = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export const getStorageStatus = () => status;
function publish() {
  status = Object.values(errors).find(Boolean) || (Object.keys(pending).length ? 'Saving to local files…' : 'Saved to local files');
  listeners.forEach(listener => listener());
}
async function diskRequest(name, payload) {
  const response = await fetch(`/api/local-data/${name}`, {
    ...(payload ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Local save failed (${response.status})`);
  }
  return response.json();
}
export async function loadKey(key) {
  if (!diskMode || !storeNames[key]) return loadBrowserKey(key);
  // Archive this browser's data BEFORE selecting the shared disk copy.
  const browser = await loadBrowserKey(key);
  if (browser) await diskRequest('archive', { key, origin: location.origin, state: browser });
  const record = await diskRequest(storeNames[key]);
  revisions[key] = record.revision;
  publish();
  return record.state;
}
function commit(key) {
  const state = pending[key];
  if (!state) return;
  chains[key] = (chains[key] || Promise.resolve()).then(async () => {
    try {
      const record = await diskRequest(storeNames[key], { state, revision: revisions[key] });
      revisions[key] = record.revision;
      if (pending[key] === state) delete pending[key];
      delete errors[key];
    } catch (error) {
      errors[key] = `Local save needs attention: ${error.message}`;
      // Preserve the complete draft on disk even when a revision conflict blocks
      // replacing the shared canonical state.
      await diskRequest('archive', { key, origin: location.origin, state, recovery: 'uncommitted-draft' }).catch(() => {});
    }
    publish();
  });
}
export function retryLocalSaves() {
  Object.keys(pending).forEach(key => { clearTimeout(diskTimers[key]); commit(key); });
}
export function saveKeyDebounced(key, state) {
  saveBrowserKeyDebounced(key, state);
  if (!diskMode || !storeNames[key]) return;
  pending[key] = state;
  publish();
  clearTimeout(diskTimers[key]);
  diskTimers[key] = setTimeout(() => commit(key), 500);
}
if (typeof window !== 'undefined' && diskMode) {
  window.addEventListener('beforeunload', event => {
    if (Object.keys(pending).length) { event.preventDefault(); event.returnValue = ''; }
  });
}

function withStorageTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label} timed out`)), IDB_TIMEOUT_MS);
    }),
  ]);
}

const ls = (() => {
  try {
    const k = '__larpcraft_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    return null;
  }
})();

async function loadBrowserKey(key) {
  let idbTimeout = null;
  try {
    const v = await withStorageTimeout(get(key), `IndexedDB load for ${key}`);
    if (v != null) return v;
  } catch (err) {
    if (err?.message?.includes('timed out')) idbTimeout = err;
    console.warn(`LARP Craft: IndexedDB load failed (${key}); trying localStorage fallback.`, err);
  }
  if (ls) {
    try {
      const raw = ls.getItem(key);
      if (raw != null) return JSON.parse(raw);
    } catch {
      /* corrupt or unreadable -- treat as empty */
    }
  }
  if (idbTimeout) throw idbTimeout;
  return null;
}

const timers = {};
function saveBrowserKeyDebounced(key, state) {
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => {
    set(key, state).catch((err) => {
      if (!ls) { console.warn(`LARP Craft: save failed (${key})`, err); return; }
      try {
        ls.setItem(key, JSON.stringify(state));
      } catch (lsErr) {
        console.warn(`LARP Craft: save failed (${key}) -- data too large for offline storage; use File > Save to keep your work.`, lsErr);
      }
    });
  }, 400);
}

export async function clearKey(key) {
  try {
    await del(key);
  } catch {
    /* ignore */
  }
  if (ls) {
    try { ls.removeItem(key); } catch { /* ignore */ }
  }
}
