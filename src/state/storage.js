// Local-first persistence: each store (library / active project) saves its
// whole state under its own IndexedDB key, debounced after every change.
// IndexedDB is the primary store, with localStorage as the offline fallback.
import { get, set, del } from 'idb-keyval';

const IDB_TIMEOUT_MS = 1800;

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

export async function loadKey(key) {
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
export function saveKeyDebounced(key, state) {
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
