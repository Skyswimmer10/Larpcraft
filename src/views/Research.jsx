import React, { useState } from 'react';
import { useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { newReference, referencePanels, referenceSearchText } from '../lib/research.js';
import { ResearchRecordContents } from '../components/ResearchRecord.jsx';
import '../components/References.css';

export function ResearchBrowser({ library, dispatch }) {
  const [selected, setSelected] = useState(null), [query, setQuery] = useState(''), [filter, setFilter] = useState('all');
  const records = Object.values(library.research || {});
  const filtered = records.filter(record => referenceSearchText(record).includes(query.trim().toLocaleLowerCase()) && (filter === 'all' || referencePanels(record).some(panel => panel.type === filter)));
  const record = library.research?.[selected];
  const add = () => { const next = newReference(); dispatch({ type: 'ADD_ENTITY', coll: 'research', entity: next }); setSelected(next.id); };
  return <div className="main research-browser">
    <div className="mhead"><div><div className="crumb">Library / Research &amp; References</div><h2>Research &amp; References</h2></div><div className="reference-actions"><button type="button" className="btn" onClick={() => dispatch({ type: 'UNDO' })}>Undo</button><button type="button" className="btn primary" onClick={add}>New reference</button></div></div>
    <div className="research-browser-layout"><aside aria-label="Reference collection"><label className="reference-field"><span>Search references</span><input className="field-input" type="search" value={query} onChange={event => setQuery(event.target.value)} /></label><label className="reference-field"><span>Contains</span><select className="field-input" value={filter} onChange={event => setFilter(event.target.value)}>{[['all', 'All references'], ['note', 'Text notes'], ['link', 'Links / videos'], ['image', 'Images'], ['file', 'PDFs / files'], ['table', 'Tables / stats']].map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      {!filtered.length && <p className="hint">{records.length ? 'No matching references.' : 'Collect notes, sources, images, PDFs and tables here. They remain available across games.'}</p>}
      {filtered.map(row => <button type="button" className={`research-card${selected === row.id ? ' selected' : ''}`} key={row.id} aria-pressed={selected === row.id} onClick={() => setSelected(row.id)}><b>{row.title || 'Untitled reference'}</b><span>{row.summary || row.credit || 'No summary yet'}</span><small>{[...new Set(referencePanels(row).map(panel => ({ note: 'Text', link: 'Link', image: 'Image', file: 'File', table: 'Table' })[panel.type] || panel.type))].join(' · ') || 'Reference'}</small></button>)}
    </aside><main>{record ? <><div className="reference-record-toolbar"><span>Library reference · edits save automatically</span><button type="button" className="btn small reference-remove" onClick={() => { dispatch({ type: 'DELETE_ENTITY', coll: 'research', id: record.id }); setSelected(null); }}>Delete reference</button></div><ResearchRecordContents key={record.id} record={record} storageState={library} onPatch={patch => dispatch({ type: 'UPDATE_ENTITY', coll: 'research', id: record.id, patch })} /></> : <div className="reference-empty"><h3>Your source material</h3><p>Select a reference or create one. References support writing and planning without becoming story nodes.</p><button type="button" className="btn" onClick={add}>New reference</button></div>}</main></div>
  </div>;
}

export default function Research() {
  return <ResearchBrowser library={useLibrary()} dispatch={useLibraryDispatch()} />;
}
