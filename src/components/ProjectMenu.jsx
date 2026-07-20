import React, { useEffect, useRef, useState } from 'react';
import { useGame, useDispatch, newGame } from '../state/store.jsx';
import { makeEmptyProject, SEED_REV } from '../data/seed.js';
import { downloadText } from '../lib/csv.js';

// File menu: the active game's lifecycle. The Library is untouched by all of
// these — only the ActiveProjectState is created / serialized / replaced.
export default function ProjectMenu() {
  const proj = useGame();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [backdropOpen, setBackdropOpen] = useState(false);
  const fileRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const act = (fn) => () => { setOpen(false); fn(); };

  const doNew = act(() => {
    if (!window.confirm('Start a new game? The current game will be replaced — use "Save game" first to keep a JSON copy.')) return;
    const name = window.prompt('Name for the new game:', 'Untitled game') || 'Untitled game';
    newGame(dispatch, name);
  });

  const doSave = act(() => {
    const slug = proj.meta.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'game';
    downloadText(`${slug}.larpcraft.json`, JSON.stringify(proj, null, 2), 'application/json');
  });

  const doOpen = act(() => fileRef.current?.click());

  async function openFile(file) {
    try {
      const data = JSON.parse(await file.text());
      if (data.rev !== SEED_REV || !data.meta || !data.items || !data.nodes) {
        window.alert('This file is not a compatible LARP Craft game save.');
        return;
      }
      dispatch({ type: 'RESET', seed: data });
    } catch {
      window.alert("Couldn't read that file — it isn't valid JSON.");
    }
  }

  const doRename = act(() => {
    const name = window.prompt('Rename this game:', proj.meta.name);
    if (name) dispatch({ type: 'RENAME_PROJECT', name });
  });

  const doClose = act(() => {
    if (!window.confirm('Close the current game? Unsaved-to-file changes stay only in this browser until a new game replaces them.')) return;
    dispatch({ type: 'RESET', seed: makeEmptyProject('No game open') });
  });

  return (
    <div className="filemenu" ref={rootRef}>
      <button className={`menubtn${open ? ' on' : ''}`} onClick={() => setOpen(!open)}>File</button>
      {open && (
        <div className="menudrop">
          <button onClick={doNew}>New game…</button>
          <button onClick={doOpen}>Open game (JSON)…</button>
          <button onClick={doSave}>Save game as JSON</button>
          <button onClick={doRename}>Rename game…</button>
          <div className="menusep" />
          <button onClick={() => { setOpen(false); setBackdropOpen(true); }}>Backdrop Settings…</button>
          <div className="menusep" />
          <button onClick={doClose}>Close game</button>
        </div>
      )}
      <input ref={fileRef} hidden type="file" accept=".json,application/json"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) openFile(f); e.target.value = ''; }} />
      {backdropOpen && <BackdropSettings onClose={() => setBackdropOpen(false)} />}
    </div>
  );
}

function BackdropSettings({ onClose }) {
  const proj = useGame();
  const dispatch = useDispatch();
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const backdrops = proj.meta.backdrops || {};
  const header = { image: null, opacity: 0.34, ...(backdrops.header || {}) };
  const content = { image: null, opacity: 0.25, ...(backdrops.content || {}) };
  const update = (patch) => dispatch({ type: 'SET_META', patch: { backdrops: { header, content, ...patch } } });
  const readImage = (slot) => (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => update({
      [slot]: {
        ...(slot === 'header' ? header : content),
        image: { kind: 'photo', name: file.name, dataUrl: reader.result },
      },
    });
    reader.readAsDataURL(file);
  };
  const imageForBoth = header.image || content.image;
  const useSameForBoth = () => {
    if (!imageForBoth) {
      headerRef.current?.click();
      return;
    }
    update({
      header: { ...header, image: imageForBoth },
      content: { ...content, image: imageForBoth },
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal backdrop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modalhead">
          <div>
            <b>Backdrop Settings</b>
            <small>Choose exactly where each background image appears.</small>
          </div>
          <button className="x big" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="backdrop-presets">
          <button className="btn" onClick={useSameForBoth}>Use same image for both</button>
          <button className="btn" onClick={() => update({ content: { ...content, image: null } })}>Header only</button>
          <button className="btn" onClick={() => update({ header: { ...header, image: null } })}>Content Area only</button>
          <button className="btn ghost" onClick={() => update({ header: { ...header, image: null }, content: { ...content, image: null } })}>Clear all backdrops</button>
        </div>
        <div className="backdrop-grid">
          <BackdropSlot
            title="Header Background"
            hint="Shown only in the top application header."
            slot={header}
            uploadLabel={header.image ? 'Change header image' : 'Upload header image'}
            inputRef={headerRef}
            onUpload={readImage('header')}
            onRemove={() => update({ header: { ...header, image: null } })}
            onOpacity={(opacity) => update({ header: { ...header, opacity } })}
          />
          <BackdropSlot
            title="Content Area Background"
            hint="Shown behind the main working and canvas area, not in the header."
            slot={content}
            uploadLabel={content.image ? 'Change content image' : 'Upload content image'}
            inputRef={contentRef}
            onUpload={readImage('content')}
            onRemove={() => update({ content: { ...content, image: null } })}
            onOpacity={(opacity) => update({ content: { ...content, opacity } })}
          />
        </div>
      </div>
    </div>
  );
}

function BackdropSlot({ title, hint, slot, uploadLabel, inputRef, onUpload, onRemove, onOpacity }) {
  return (
    <section className="backdrop-slot">
      <div className="backdrop-preview">
        {slot.image?.dataUrl ? <img src={slot.image.dataUrl} alt="" /> : <span>None</span>}
      </div>
      <div className="backdrop-slot-body">
        <b>{title}</b>
        <small>{hint}</small>
        {slot.image?.name && <span className="mono dim">{slot.image.name}</span>}
        <div className="backdrop-actions">
          <button className="btn" onClick={() => inputRef.current?.click()}>{uploadLabel}</button>
          <button className="btn ghost" onClick={onRemove}>None / Remove</button>
        </div>
        {slot.image?.dataUrl && (
          <label className="menuslider inline">
            <span>Opacity · {Math.round((slot.opacity ?? 0.25) * 100)}%</span>
            <input type="range" min="5" max="75" value={Math.round((slot.opacity ?? 0.25) * 100)}
              onChange={(e) => onOpacity(+e.target.value / 100)} />
          </label>
        )}
      </div>
      <input ref={inputRef} hidden type="file" accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }} />
    </section>
  );
}
