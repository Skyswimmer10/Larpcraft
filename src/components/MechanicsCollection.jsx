import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { PrimIcon } from './bits.jsx';
import StructureThumb from './StructureThumb.jsx';
import MechanismBrowser from './MechanismBrowser.jsx';
import { useCollectionColumns, useCollectionModal, useColumnPreference } from './CollectionLayout.jsx';
import { collectionPayload, collectionSources, favoritesFirst, savedMechanicCategory, savedMechanicSource, savedMechanicsForSource } from '../mechanics/collections.js';
import { mechanismCollectionForKind } from '../data/mechanismCatalog.js';
import { genId } from '../data/csvSchemas.js';
import './MechanicsCollection.css';

function SavedMechanics({ source, columns, onAdd, onClose, view = {}, onView }) {
  const lib = useLibrary(), dispatch = useLibraryDispatch();
  const { query = '', hidden = {}, selected = '' } = view;
  const setQuery = query => onView({ query });
  const setHidden = update => onView({ hidden: typeof update === 'function' ? update(hidden) : update });
  const setSelected = selected => onView({ selected });
  const [categoryName, setCategoryName] = useState(null);
  const grid = useRef(null);
  const all = savedMechanicsForSource(lib, source);
  const categories = [{ id: 'unsorted', label: 'Unsorted' }, ...Object.values(lib.mechanicsSources?.[source]?.categories || {})];
  const shown = all.filter(r => !hidden[savedMechanicCategory(r)] && `${r.name} ${r.description || ''}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => favoritesFirst(a, b) || a.name.localeCompare(b.name));
  const focused = lib.mechStructures?.[selected] && savedMechanicSource(lib.mechStructures[selected], lib) === source ? lib.mechStructures[selected] : shown[0];
  const count = useCollectionColumns(grid, columns, shown.length > 0);
  const patch = (record, patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'mechStructures', id: record.id, patch });
  const changeSource = record => {
    const existing = lib.mechanicsSources?.[source];
    dispatch(existing ? { type: 'UPDATE_ENTITY', coll: 'mechanicsSources', id: source, patch: record } : { type: 'ADD_ENTITY', coll: 'mechanicsSources', entity: { id: source, label: collectionSources(lib).find(s => s.id === source)?.label, ...record } });
  };
  const addCategory = event => {
    event.preventDefault();
    if (!categoryName?.trim()) return;
    const id = genId(lib.mechanicsSources?.[source]?.categories || {}, 'category-');
    changeSource({ categories: { ...(lib.mechanicsSources?.[source]?.categories || {}), [id]: { id, label: categoryName.trim() } } });
    setCategoryName(null);
  };
  return <div className="mechanism-browser-layout">
    <aside className="mechanism-browser-filters"><b>Show / Hide</b><section>{categories.map(category => <label key={category.id}><input type="checkbox" checked={!hidden[category.id]} onChange={() => setHidden(value => ({ ...value, [category.id]: !value[category.id] }))} /><span>{category.label}</span><em>{all.filter(r => savedMechanicCategory(r) === category.id).length}</em></label>)}</section>
      <div className="mechanism-browser-filter-footer"><button className="btn wide" onClick={() => setHidden(Object.fromEntries(categories.map(c => [c.id, categories.every(c => !hidden[c.id])]))) }>{categories.every(c => !hidden[c.id]) ? 'Hide All' : 'Show All'}</button><button className="btn wide" onClick={() => setCategoryName('')}>+ Add category</button></div>
      {categoryName !== null && <form className="collection-inline-form" onSubmit={addCategory}><label>Category name<input className="field-input" autoFocus aria-label="New mechanic category" value={categoryName} onChange={e => setCategoryName(e.target.value)} required maxLength={50} /></label><button className="btn small" type="submit">Create category</button><button className="btn ghost small" type="button" onClick={() => setCategoryName(null)}>Cancel</button></form>}
    </aside>
    <main className="mechanism-browser-main"><div className="mechanism-browser-toolbar"><input className="search" aria-label="Search saved mechanics" placeholder="Search saved mechanics…" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="collection-order-note"><PrimIcon icon="star" color="currentColor" size={13} />Favorites first<span>{shown.length} mechanics · {count} columns</span></div>
      {shown.length ? <div className="mechanism-browser-grid" ref={grid} style={{ '--collection-columns': count }}>{shown.map(record => <div className="mechanism-tile-wrap" key={record.id}><button className={`mechanism-tile${focused?.id === record.id ? ' focused' : ''}`} aria-label={`Inspect ${record.name}`} onClick={() => setSelected(record.id)} style={{ '--accent': '#A87BF0' }}><span className="mechanism-tile-image saved-tree-image"><StructureThumb structure={{ ...record, nodes: record.nodes || {}, edges: record.edges || [] }} lib={lib} width={360} height={240} /></span><span className="mechanism-tile-copy"><b>{record.name}</b><small>{record.description || 'Saved mechanic tree'}</small></span><span className="mechanism-tile-meta"><i>{Object.keys(record.nodes || {}).length} nodes inside</i><i>{categories.find(c => c.id === savedMechanicCategory(record))?.label || 'Unsorted'}</i></span></button><button className="collection-star" aria-label={`${record.favorite ? 'Remove' : 'Add'} ${record.name} ${record.favorite ? 'from' : 'to'} favorites`} aria-pressed={Boolean(record.favorite)} onClick={() => patch(record, { favorite: !record.favorite })}><PrimIcon icon="star" color="currentColor" size={17} /></button></div>)}</div> : <div className="mechanism-browser-empty">{all.length ? 'No mechanics match this search and these category choices.' : 'This source is empty. Save a mechanic tree to the library, then choose its source here.'}</div>}
    </main>
    <aside className="mechanism-browser-editor">{focused ? <><div className="mechanism-editor-head"><b>{focused.name}</b></div><div className="collection-tree-preview"><StructureThumb structure={{ ...focused, nodes: focused.nodes || {}, edges: focused.edges || [] }} lib={lib} width={500} height={300} /></div><p className="collection-description">{focused.description || 'No description yet.'}</p><label className="mechanism-editor-field"><span>Source</span><select className="field-input" aria-label="Saved mechanic source" value={source} onChange={e => { patch(focused, { sourceId: e.target.value, collectionCategoryId: 'unsorted' }); setSelected(''); }}>{collectionSources(lib).filter(s => s.id !== 'board').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label><label className="mechanism-editor-field"><span>Category</span><select className="field-input" aria-label="Saved mechanic category" value={savedMechanicCategory(focused)} onChange={e => patch(focused, { collectionCategoryId: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label><details className="collection-contents"><summary>{Object.keys(focused.nodes || {}).length} nodes inside</summary>{Object.values(focused.nodes || {}).map(n => <div key={n.id}><b>{n.title}</b><p>{n.body}</p>{n.sub && <small>{Object.keys(n.sub.nodes || {}).length} nested nodes</small>}</div>)}</details><button className="btn primary wide" onClick={() => { onAdd(`template:${focused.id}`); onClose(); }}>Add to canvas</button></> : <div className="mechanism-browser-empty">Choose a saved mechanic to see its contents.</div>}</aside>
  </div>;
}

export default function MechanicsCollection({ onAdd, onClose }) {
  const lib = useLibrary(), dispatch = useLibraryDispatch();
  const [source, setSource] = useState('board');
  const [sourceName, setSourceName] = useState(null);
  const [savedViews, setSavedViews] = useState({});
  const [columns, setColumns] = useColumnPreference();
  const guard = useRef(null), modal = useRef(null);
  const close = () => { if (source !== 'board' || !guard.current || guard.current()) onClose(); };
  useCollectionModal(modal, close);
  const boardProps = useMemo(() => ({ patternMechanisms: Object.values(lib.actionPatternMechanisms || {}), probabilityMechanisms: Object.values(lib.actionProbabilityMechanisms || {}), victoryMechanisms: Object.values(lib.victoryConditionMechanisms || {}), uncertaintyMechanisms: Object.values(lib.uncertaintyMechanisms || {}), economyMechanisms: Object.values(lib.economyMechanisms || {}), auctionMechanisms: Object.values(lib.auctionMechanisms || {}), workerPlacementMechanisms: Object.values(lib.workerPlacementMechanisms || {}), movementMechanisms: Object.values(lib.movementMechanisms || {}), areaControlMechanisms: Object.values(lib.areaControlMechanisms || {}), setCollectionMechanisms: Object.values(lib.setCollectionMechanisms || {}), cardMechanisms: Object.values(lib.cardMechanisms || {}) }), [lib]);
  const addSource = event => { event.preventDefault(); if (!sourceName?.trim()) return; const id = genId(lib.mechanicsSources || {}, 'source-'); dispatch({ type: 'ADD_ENTITY', coll: 'mechanicsSources', entity: { id, label: sourceName.trim(), categories: {} } }); setSource(id); setSourceName(null); };
  return createPortal(<div className="modal-backdrop"><div className="modal mechanics-collection" role="dialog" aria-modal="true" aria-label="Mechanics collection" ref={modal}>
    <header className="collection-header"><div><small>Library / Complete mechanics</small><h2>Mechanics collection</h2></div><button className="btn" onClick={close}>Back to canvas</button></header>
    <div className="collection-source-toolbar"><label>Source<select className="field-input" aria-label="Mechanics source" value={source} onChange={e => { if (source === 'board' && guard.current && !guard.current()) return; setSource(e.target.value); }}>{collectionSources(lib).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label><button className="btn" onClick={() => { if (source !== 'board' || !guard.current || guard.current()) setSourceName(''); }}>+ Add source</button><label className="collection-column-control">Columns<select className="field-input" aria-label="Mechanism columns" value={columns} onChange={e => setColumns(e.target.value)}><option value={4}>4 columns</option><option value={5}>5 columns</option></select></label><span className="dim">Favorites stay at the top of each source.</span></div>
    {sourceName !== null && <form className="collection-new-source" onSubmit={addSource}><label>Source name<input autoFocus className="field-input" aria-label="New mechanics source" maxLength={60} value={sourceName} onChange={e => setSourceName(e.target.value)} required /></label><button className="btn primary" type="submit">Create source</button><button className="btn" type="button" onClick={() => setSourceName(null)}>Cancel</button></form>}
    <div className="collection-board-host" hidden={source !== 'board'}><MechanismBrowser embedded insertion columns={columns} guardRef={guard} initialFilter="all" allowedKind="all" {...boardProps} onPick={record => { onAdd(collectionPayload(record.kind, record.id), record); onClose(); }} onSave={record => dispatch({ type: 'UPDATE_ENTITY', coll: mechanismCollectionForKind(record.kind), id: record.id, patch: record })} onClose={close} /></div>
    {source !== 'board' && <SavedMechanics key={source} source={source} columns={columns} onAdd={onAdd} onClose={onClose} view={savedViews[source]} onView={patch => setSavedViews(value => ({ ...value, [source]: { ...value[source], ...patch } }))} />}
  </div></div>, document.body);
}
