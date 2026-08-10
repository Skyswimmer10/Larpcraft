import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { reducer } from './reducer.js';
import { makeLibrarySeed, makeProjectSeed, makeEmptyProject, migrateLibrary, migrateProject, LIB_REV, SEED_REV } from '../data/seed.js';
import { loadKey, saveKeyDebounced, clearKey } from './storage.js';
import deployedLibrary from '../data/deployedLibrary.json';
import { mergeBundledLibrary } from '../lib/bundledLibrary.js';

// Two distinct stores:
//  - Library: the persistent master database (templates). Survives across games.
//  - Project: the currently open game (instances, quest graph, teams).
// Each has its own context pair and its own IndexedDB slot.

const LIB_KEY = 'larpcraft:library';
const PROJ_KEY = 'larpcraft:activeProject';

const LibStateCtx = createContext(null);
const LibDispatchCtx = createContext(null);
const ProjStateCtx = createContext(null);
const ProjDispatchCtx = createContext(null);

const MAX_UNDO = 100;
const GRAPH_PATCH_KEYS = ['nodes', 'edges', 'subnodes', 'frameworks', 'frames', 'numberMarkers', 'titleMarkers'];
const GRAPH_ENTITY_COLLECTIONS = new Set(['nodes', 'subnodes', 'frameworks', 'frames', 'numberMarkers', 'titleMarkers']);
const UNDOABLE_ACTIONS = new Set([
  'BATCH',
  'ADD_NODE',
  'DELETE_NODE',
  'DELETE_SUBNODE',
  'ADD_EDGE',
  'UPDATE_EDGE',
  'REMOVE_EDGE',
  'FRAME_MOVE',
  'FRAME_SCALE',
  'FRAME_TO_COMPOSITE',
  'COMPOSITE_TO_FRAME',
  'GRAPH_ADD_NODE',
  'GRAPH_UPDATE_NODE',
  'GRAPH_DELETE_NODE',
  'SYNC_CHARACTER_ARCHETYPE',
  'GRAPH_ADD_EDGE',
  'GRAPH_UPDATE_EDGE',
  'GRAPH_REMOVE_EDGE',
  'GRAPH_ADD_FRAME',
  'GRAPH_UPDATE_FRAME',
  'GRAPH_DELETE_FRAME',
  'GRAPH_MOVE_FRAME',
  'GRAPH_SCALE_FRAME',
  'GRAPH_ADD_NUMBER_MARKER',
  'GRAPH_UPDATE_NUMBER_MARKER',
  'GRAPH_DELETE_NUMBER_MARKER',
  'GRAPH_ADD_TITLE_MARKER',
  'GRAPH_UPDATE_TITLE_MARKER',
  'GRAPH_DELETE_TITLE_MARKER',
  'GRAPH_CLEAR',
  'CLEAR_NARRATIVE_CANVAS',
  'SET_STORY_POS',
  'ADD_ALIGN',
  'REMOVE_ALIGN',
  'SET_STORY_DYNAMICS_GRAPH',
]);

const isGraphPatch = (patch = {}) => GRAPH_PATCH_KEYS.some((key) => Object.prototype.hasOwnProperty.call(patch, key));
const isUndoableAction = (action) => {
  if (!action || ['RESET', 'UNDO', 'END_UNDO_GROUP'].includes(action.type)) return false;
  if (UNDOABLE_ACTIONS.has(action.type)) return true;
  if (['ADD_ENTITY', 'UPDATE_ENTITY', 'DELETE_ENTITY'].includes(action.type) && GRAPH_ENTITY_COLLECTIONS.has(action.coll)) return true;
  if (action.type === 'UPDATE_ENTITY' && ['stories', 'mechStructures', 'concepts'].includes(action.coll)) {
    return isGraphPatch(action.patch);
  }
  return false;
};

const scopeKey = (scope = {}) => `${scope.coll || 'nodes'}:${(scope.parentPath || (scope.parentId ? [scope.parentId] : [])).join('/')}`;
const patchKey = (patch = {}) => Object.keys(patch).sort().join(',');
const undoGroupFor = (action) => {
  if (action.undoGroup) return action.undoGroup;
  switch (action.type) {
    case 'UPDATE_ENTITY': return `entity:${action.coll}:${action.id}:${patchKey(action.patch)}`;
    case 'GRAPH_UPDATE_NODE': return `graph-node:${scopeKey(action.scope)}:${action.id}:${patchKey(action.patch)}`;
    case 'GRAPH_UPDATE_FRAME': return `graph-frame:${scopeKey(action.scope)}:${action.id}:${patchKey(action.patch)}`;
    case 'GRAPH_UPDATE_NUMBER_MARKER': return `graph-number:${scopeKey(action.scope)}:${action.id}:${patchKey(action.patch)}`;
    case 'GRAPH_UPDATE_TITLE_MARKER': return `graph-title:${scopeKey(action.scope)}:${action.id}:${patchKey(action.patch)}`;
    case 'GRAPH_UPDATE_EDGE': return `graph-edge:${scopeKey(action.scope)}:${action.from}:${action.to}:${patchKey(action.patch)}`;
    case 'FRAME_MOVE': return `frame-move:${action.frameId}`;
    case 'FRAME_SCALE': return `frame-scale:${action.frameId}`;
    case 'GRAPH_MOVE_FRAME': return `graph-frame-move:${scopeKey(action.scope)}:${action.id}`;
    case 'GRAPH_SCALE_FRAME': return `graph-frame-scale:${scopeKey(action.scope)}:${action.id}`;
    case 'SET_STORY_POS': return `story-position:${action.nodeId}`;
    default: return null;
  }
};

export function undoableReducer(state, action) {
  if (action.type === 'RESET') return { present: action.seed, past: [], undoGroup: null };
  if (action.type === 'END_UNDO_GROUP') return state.undoGroup ? { ...state, undoGroup: null } : state;
  if (action.type === 'UNDO') {
    if (!state?.past?.length) return state;
    const past = state.past.slice(0, -1);
    return { present: state.past[state.past.length - 1], past, undoGroup: null };
  }
  if (!state?.present) return state;
  const next = reducer(state.present, action);
  if (next === state.present) return state;
  if (!isUndoableAction(action)) return { ...state, present: next, undoGroup: null };
  const undoGroup = undoGroupFor(action);
  if (undoGroup && undoGroup === state.undoGroup) return { ...state, present: next };
  return { present: next, past: [...state.past, state.present].slice(-MAX_UNDO), undoGroup };
}

const isTextEditingTarget = (target) => {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  return target.isContentEditable || ['input', 'textarea', 'select'].includes(tag);
};

export function StoreProvider({ children }) {
  const [libState, rawLibDispatch] = useReducer(undoableReducer, { present: null, past: [], undoGroup: null });
  const [projState, rawProjDispatch] = useReducer(undoableReducer, { present: null, past: [], undoGroup: null });
  const [booted, setBooted] = useState(false);
  const [bootError, setBootError] = useState(null);
  const lastUndoStore = useRef('project');
  const lib = libState.present;
  const proj = projState.present;

  const libDispatch = useCallback((action) => {
    if (isUndoableAction(action)) lastUndoStore.current = 'library';
    rawLibDispatch(action);
  }, []);
  const projDispatch = useCallback((action) => {
    if (isUndoableAction(action)) lastUndoStore.current = 'project';
    rawProjDispatch(action);
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([loadKey(LIB_KEY), loadKey(PROJ_KEY)]).then(([savedLib, savedProj]) => {
      if (!alive) return;
      try {
        // Library is migrated additively: newer schema revs backfill missing
        // collections (e.g. gmRules) instead of discarding the saved library.
        rawLibDispatch({ type: 'RESET', seed: migrateLibrary(mergeBundledLibrary(deployedLibrary, savedLib)) });
        // Project is migrated additively (backfills `facts` etc.) so an open game
        // survives schema bumps instead of being reset.
        rawProjDispatch({ type: 'RESET', seed: migrateProject(savedProj) });
        setBootError(null);
        setBooted(true);
      } catch (err) {
        console.error('LARP Craft: startup migration failed.', err);
        setBootError(err);
      }
    }).catch((err) => {
      if (!alive) return;
      console.error('LARP Craft: startup load failed.', err);
      setBootError(err);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const endGroup = () => {
      rawLibDispatch({ type: 'END_UNDO_GROUP' });
      rawProjDispatch({ type: 'END_UNDO_GROUP' });
    };
    window.addEventListener('pointerup', endGroup);
    window.addEventListener('pointercancel', endGroup);
    window.addEventListener('focusout', endGroup);
    return () => {
      window.removeEventListener('pointerup', endGroup);
      window.removeEventListener('pointercancel', endGroup);
      window.removeEventListener('focusout', endGroup);
    };
  }, []);

  const resetAfterBootError = useCallback(async () => {
    await Promise.all([clearKey(LIB_KEY), clearKey(PROJ_KEY)]);
    rawLibDispatch({ type: 'RESET', seed: makeLibrarySeed() });
    rawProjDispatch({ type: 'RESET', seed: makeProjectSeed() });
    setBootError(null);
    setBooted(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== 'z') return;
      if (isTextEditingTarget(e.target)) return;
      e.preventDefault();
      if (lastUndoStore.current === 'library') rawLibDispatch({ type: 'UNDO' });
      else rawProjDispatch({ type: 'UNDO' });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => { if (booted && lib) saveKeyDebounced(LIB_KEY, lib); }, [lib, booted]);
  useEffect(() => { if (booted && proj) saveKeyDebounced(PROJ_KEY, proj); }, [proj, booted]);

  if (bootError) {
    return (
      <div className="boot">
        <div>
          <b>Could not load the saved library or game.</b>
          <p>The saved browser database may be blocked or contain an older broken record. Your data has not been overwritten.</p>
          <button className="btn" onClick={() => window.location.reload()}>Retry</button>
          <button className="btn danger" onClick={resetAfterBootError}>Reset demo data</button>
        </div>
      </div>
    );
  }

  if (!booted || !lib || !proj) return <div className="boot">Loading library &amp; game…</div>;
  return (
    <LibStateCtx.Provider value={lib}>
      <LibDispatchCtx.Provider value={libDispatch}>
        <ProjStateCtx.Provider value={proj}>
          <ProjDispatchCtx.Provider value={projDispatch}>{children}</ProjDispatchCtx.Provider>
        </ProjStateCtx.Provider>
      </LibDispatchCtx.Provider>
    </LibStateCtx.Provider>
  );
}

// Project (active game) hooks — the names most views already use.
export const useGame = () => useContext(ProjStateCtx);
export const useDispatch = () => useContext(ProjDispatchCtx);
// Library (master database) hooks.
export const useLibrary = () => useContext(LibStateCtx);
export const useLibraryDispatch = () => useContext(LibDispatchCtx);

export function newGame(projDispatch, name = 'Untitled game') {
  projDispatch({ type: 'RESET', seed: makeEmptyProject(name) });
}

export async function resetDemoData(libDispatch, projDispatch) {
  await Promise.all([clearKey(LIB_KEY), clearKey(PROJ_KEY)]);
  libDispatch({ type: 'RESET', seed: makeLibrarySeed() });
  projDispatch({ type: 'RESET', seed: makeProjectSeed() });
}
