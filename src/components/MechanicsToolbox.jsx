import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import NodePalette from './NodePalette.jsx';
import MechanicsCollection from './MechanicsCollection.jsx';
import { catalogueRecords, collectionPayload } from '../mechanics/collections.js';
import { PrimIcon } from './bits.jsx';
import { TOOLBOX_KEY, WORK_AREAS, WIZARD_STEPS, toolboxPreferences, toolboxCategories, visibleToolboxCategories, searchToolbox } from '../mechanics/toolbox.js';
import './MechanicsToolbox.css';

const readPreferences = () => {
  try { return toolboxPreferences(JSON.parse(localStorage.getItem(TOOLBOX_KEY))); }
  catch { return toolboxPreferences(); }
};

function ToolboxDialog({ title, onClose, children }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return createPortal(<dialog ref={ref} className="mechanics-tools-dialog" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target !== event.currentTarget) return; const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose(); }}>
    <div className="mechanics-tools-dialog-head"><h2 id={titleId}>{title}</h2><button className="btn ghost small" aria-label={`Close ${title}`} onClick={onClose}>×</button></div>
    {children}
  </dialog>, document.body);
}

function QuickAdd({ categories, preferences, onClose }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchToolbox(categories, query), [categories, query]);
  const shown = results.slice(0, 60);
  const listRef = useRef(null);
  const resultId = useId();
  const pick = item => { onClose(); item.onClick?.(); };
  const move = offset => {
    const next = Math.max(0, Math.min(shown.length - 1, active + offset));
    setActive(next);
    listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
  };
  return <ToolboxDialog title="Quick Add" onClose={onClose}>
    <input autoFocus className="field-input" aria-label="Search all mechanics nodes" placeholder="Search all nodes, including hidden categories…" value={query}
      aria-controls={resultId} onChange={event => { setQuery(event.target.value); setActive(0); }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); move(event.key === 'ArrowDown' ? 1 : -1); }
        if (event.key === 'Enter' && shown[active]) { event.preventDefault(); pick(shown[active]); }
      }} />
    <p className="dim mechanics-tools-hint">Adding a node keeps your category choices. Use ↑ ↓ and Enter, or click a result.</p>
    <div className="mechanics-search-results" id={resultId} ref={listRef}>
      {shown.map((item, index) => <button key={item.id} className={`mechanics-search-result${index === active ? ' active' : ''}`} onClick={() => pick(item)}>
        <PrimIcon icon={item.icon || 'layers'} color={item.color || 'currentColor'} size={20} />
        <span><b>{item.label}</b><small>{item.categoryLabel} · {item.area === 'collection' ? 'Mechanics collection' : WORK_AREAS.find(area => area.id === item.area)?.label}{item.area !== 'collection' && !preferences.pinned[item.categoryId] ? ' · Hidden in toolbox' : ''}</small>{item.blurb && <span>{item.blurb}</span>}</span>
        <span aria-hidden="true">+</span>
      </button>)}
    </div>
    <p className="dim mechanics-tools-hint" role="status">{results.length ? `${results.length} matching nodes${results.length > shown.length ? ' · Keep typing to narrow the list' : ''}` : 'No matching nodes. Try a different name or a shorter word.'}</p>
  </ToolboxDialog>;
}

function MechanicsWizard({ onClose, onCreate }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const input = useRef(null);
  const current = WIZARD_STEPS[step];
  useEffect(() => { input.current?.focus(); }, [step]);
  const finish = () => { onCreate(answers); onClose(); };
  const anyAnswer = Object.values(answers).some(value => value.trim());
  return <ToolboxDialog title="Mechanics Wizard" onClose={onClose}>
    <ol className="mechanics-wizard-steps">{WIZARD_STEPS.map((item, index) => <li key={item.id} aria-current={index === step ? 'step' : undefined}><span>{index + 1}</span>{item.label}</li>)}</ol>
    <label className="mechanics-wizard-question">{current.question}<textarea ref={input} className="field-input" rows={6} value={answers[current.id] || ''} onChange={event => setAnswers(value => ({ ...value, [current.id]: event.target.value }))} /></label>
    <p className="dim mechanics-tools-hint">{current.hint}</p>
    <p className="dim mechanics-tools-hint">Your answers become editable nodes on this canvas. Nothing is added until you finish. Blank answers are skipped.</p>
    <div className="mechanics-tools-dialog-foot"><button className="btn ghost" onClick={onClose}>Cancel</button>{step > 0 && <button className="btn" onClick={() => setStep(value => value - 1)}>Back</button>}
      {step < WIZARD_STEPS.length - 1 ? <><button className="btn ghost" onClick={() => { setAnswers(value => ({ ...value, [current.id]: '' })); setStep(value => value + 1); }}>Skip</button><button className="btn primary" onClick={() => setStep(value => value + 1)}>Next</button></> : <button className="btn primary" disabled={!anyAnswer} onClick={finish}>Create starting nodes</button>}
    </div>
  </ToolboxDialog>;
}

// Shared by game and library canvases. Preferences describe tools, never graph data.
export function useMechanicsToolbox({ groups, lib, onAdd, onCreateWizard, enabled = true, headerAction, subtitle = 'Click or drag a tool onto the canvas' }) {
  const [preferences, setPreferences] = useState(readPreferences);
  const [dialog, setDialog] = useState(null);
  const [query, setQuery] = useState('');
  const categories = useMemo(() => toolboxCategories([
    ...groups.map(group => ({ ...group, items: group.items.map(item => lib.mechPrimitives?.[item.id.split(':')[1]]?.mechKind === 'action' ? { ...item, onClick: () => setDialog('collection') } : item) })),
    { id: 'catalogue', items: catalogueRecords(lib).map(record => ({ id: collectionPayload(record.kind, record.id), label: record.label, blurb: record.description, icon: record.icon, color: record.color, onClick: () => onAdd?.(collectionPayload(record.kind, record.id)) })) },
  ], lib), [groups, lib, onAdd]);
  const visible = visibleToolboxCategories(categories, preferences);
  const area = WORK_AREAS.find(item => item.id === preferences.area);
  const hidden = categories.filter(category => category.area === area.id && !preferences.pinned[category.id]).length;
  const changePreferences = next => {
    setPreferences(next);
    try { localStorage.setItem(TOOLBOX_KEY, JSON.stringify(next)); } catch { /* The current toolbox still works without browser storage. */ }
    window.dispatchEvent(new CustomEvent('larpcraft:toolbox-change', { detail: next }));
  };
  useEffect(() => {
    const sync = event => { if (event.type === 'storage' && event.key !== TOOLBOX_KEY) return; setPreferences(event.detail ? toolboxPreferences(event.detail) : readPreferences()); };
    window.addEventListener('storage', sync);
    window.addEventListener('larpcraft:toolbox-change', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('larpcraft:toolbox-change', sync); };
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const key = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !event.altKey) {
        if (document.querySelector('dialog[open], [aria-modal="true"], .modal-backdrop')) return;
        event.preventDefault(); setDialog('search');
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [enabled]);
  const controls = <div className="mechanics-toolbox-controls">
    <div className="mechanics-work-areas" aria-label="Mechanics work areas">{WORK_AREAS.map(item => <button key={item.id} className={`btn small${item.id === area.id ? ' primary' : ''}`} aria-pressed={item.id === area.id} onClick={() => { setQuery(''); changePreferences({ ...preferences, area: item.id }); }}><PrimIcon icon={item.icon} color="currentColor" size={14} />{item.label}</button>)}</div>
    <p className="dim mechanics-tools-hint">{area.hint}</p>
  </div>;
  const footer = <div className="mechanics-toolbox-footer"><span>{hidden ? `${hidden} ${hidden === 1 ? 'category' : 'categories'} hidden in ${area.label}` : `All ${area.label.toLowerCase()} categories shown`}</span><button className="linkbtn" onClick={() => setDialog('categories')}>Manage categories</button>{headerAction && <div className="mechanics-toolbox-extras">{headerAction}</div>}</div>;
  return {
    palette: <NodePalette title="My toolbox" subtitle={subtitle} search={query} onSearch={setQuery} groups={visible} controls={controls} footer={footer}
      emptyMessage={visible.length ? 'No tools in these categories yet. Quick Add can search other categories.' : `No categories pinned in ${area.label}. Choose Categories to show tools.`}
      headerAction={<button className="btn tiny" onClick={() => setDialog('categories')}>Categories</button>} />,
    actions: <div className="mechanics-toolbox-actions"><button className="btn" onClick={() => setDialog('collection')}><PrimIcon icon="layers" color="currentColor" size={15} />Mechanics collection</button><button className="btn primary" onClick={() => setDialog('search')}><PrimIcon icon="search" color="currentColor" size={15} />Quick Add <kbd>Ctrl K</kbd></button><button className="btn" onClick={() => setDialog('wizard')}><PrimIcon icon="cog" color="currentColor" size={15} />Mechanics Wizard</button></div>,
    dialogs: enabled && (dialog === 'collection' ? <MechanicsCollection onAdd={onAdd} onClose={() => setDialog(null)} /> : dialog === 'search' ? <QuickAdd categories={categories} preferences={preferences} onClose={() => setDialog(null)} /> : dialog === 'wizard' ? <MechanicsWizard onClose={() => setDialog(null)} onCreate={onCreateWizard} /> : dialog === 'categories' ? <ToolboxDialog title="Toolbox categories" onClose={() => setDialog(null)}>
      <p className="dim mechanics-tools-hint">Checked categories appear in their work area. Unchecked categories stay hidden when you switch areas. Quick Add searches all of them.</p>
      <div className="mechanics-category-grid">{WORK_AREAS.map(item => <section key={item.id}><h3>{item.label}</h3>{categories.filter(category => category.area === item.id).map(category => <label key={category.id} className="mechanics-category-check"><input type="checkbox" checked={preferences.pinned[category.id]} onChange={event => changePreferences({ ...preferences, pinned: { ...preferences.pinned, [category.id]: event.target.checked } })} /><span>{category.label}</span><small>{category.items.length}</small></label>)}</section>)}</div>
      <div className="mechanics-tools-dialog-foot"><button className="btn primary" onClick={() => setDialog(null)}>Done</button></div>
    </ToolboxDialog> : null),
  };
}
