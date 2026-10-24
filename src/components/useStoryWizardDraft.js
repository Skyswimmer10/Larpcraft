import { useEffect, useRef, useState } from 'react';

// A model-independent editing history and debounced project draft. Autosave
// never inserts a canvas node, and callers stop it before committing a result.
export function useStoryWizardDraft(initial, dispatch, saveType) {
  const [history, setHistory] = useState({ past: [], present: initial, future: [] });
  const [kept, setKept] = useState(false);
  const latest = useRef(initial), stopped = useRef(false), group = useRef(null);
  latest.current = history.present;
  const transition = (updater, key = null) => {
    const coalesce = key && key === group.current;
    group.current = key;
    setHistory(current => {
      const next = typeof updater === 'function' ? updater(current.present) : updater;
      if (next === current.present || JSON.stringify(next) === JSON.stringify(current.present)) return current;
      return { past: coalesce ? current.past : [...current.past, current.present].slice(-75), present: next, future: [] };
    });
  };
  const persist = () => { if (!stopped.current) dispatch({ type: saveType, draft: { ...latest.current, updatedAt: Date.now() } }); };
  useEffect(() => {
    if (stopped.current) return;
    setKept(false);
    const timer = setTimeout(() => { if (!stopped.current) { dispatch({ type: saveType, draft: { ...history.present, updatedAt: Date.now() } }); setKept(true); } }, 500);
    return () => clearTimeout(timer);
  }, [history.present, dispatch, saveType]);
  return {
    draft: history.present, kept, transition, persist,
    synchronize: updater => setHistory(current => { const next = updater(current.present); return next === current.present ? current : { ...current, present: next }; }),
    replace: draft => { persist(); group.current = null; setHistory({ past: [], present: draft, future: [] }); },
    endGroup: () => { group.current = null; }, stopSaving: () => { stopped.current = true; },
    canUndo: !!history.past.length, canRedo: !!history.future.length,
    undo: () => { group.current = null; setHistory(current => current.past.length ? { past: current.past.slice(0, -1), present: current.past.at(-1), future: [current.present, ...current.future] } : current); },
    redo: () => { group.current = null; setHistory(current => current.future.length ? { past: [...current.past, current.present], present: current.future[0], future: current.future.slice(1) } : current); },
  };
}
