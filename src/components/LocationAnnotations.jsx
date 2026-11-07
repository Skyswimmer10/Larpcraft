import React, { useEffect, useState } from 'react';
import { STAGE_W, STAGE_H } from '../data/seed.js';
import { MAP_OVERLAY_COLLECTIONS, mapRows, mapAudienceVisible, mapColor } from '../lib/locationAnnotations.js';
import './LocationAnnotations.css';

const position = row => ({ left: `${row.x / STAGE_W * 100}%`, top: `${row.y / STAGE_H * 100}%` });

export function LocationAnnotationLayer({ location, audience, selected, interactive, onDrag, onSelect }) {
  const pointer = interactive ? 'auto' : 'none';
  const keyDown = (event, collection, row) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect({ collection, id: row.id }); }
  };
  return <>
    <div className="map-zone-layer" aria-label="Map zones">{mapRows(location, 'mapZones').filter(row => mapAudienceVisible(row, audience)).map(row => <div key={row.id} className={`map-zone${selected?.collection === 'mapZones' && selected.id === row.id ? ' selected' : ''}`} style={{ ...position(row), width: `${row.w / STAGE_W * 100}%`, height: `${row.h / STAGE_H * 100}%`, '--zone-color': mapColor(row.color), backgroundColor: `${mapColor(row.color)}26`, pointerEvents: pointer }} data-map-overlay="zone" role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} aria-label={`Zone: ${row.name || 'Unnamed zone'}`} onKeyDown={event => keyDown(event, 'mapZones', row)} onPointerDown={event => onDrag(event, 'mapZones', row)}>
      <span className="map-zone-name">{row.name || 'Unnamed zone'}</span>
      {interactive && selected?.collection === 'mapZones' && selected.id === row.id && <span className="map-zone-resize" aria-hidden="true" title="Drag to resize; size can also be edited in Map notes" onPointerDown={event => onDrag(event, 'mapZones', row, true)}>↘</span>}
    </div>)}</div>
    <div className="map-label-layer" aria-label="Map labels">{mapRows(location, 'mapLabels').filter(row => mapAudienceVisible(row, audience)).map(row => <div key={row.id} className={`map-text-label${selected?.collection === 'mapLabels' && selected.id === row.id ? ' selected' : ''}`} style={{ ...position(row), borderColor: mapColor(row.color), pointerEvents: pointer }} data-map-overlay="label" role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} aria-label={`Label: ${row.text || 'Empty label'}`} onKeyDown={event => keyDown(event, 'mapLabels', row)} onPointerDown={event => onDrag(event, 'mapLabels', row)}>{row.text || 'Empty label'}</div>)}</div>
  </>;
}

function CommitField({ label, value = '', onCommit, type = 'text', ...props }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => { if (draft !== String(value)) onCommit(type === 'number' ? Number(draft) : draft); };
  return <label className="map-note-field"><span>{label}</span>{type === 'textarea' ? <textarea className="field-input" rows={3} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} {...props} /> : <input className="field-input" type={type} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} {...props} />}</label>;
}

export default function LocationAnnotationPanel({ location, selected, onSelect, onChange, onRemove, markerName, storyLocations = [] }) {
  const row = selected && mapRows(location, selected.collection).find(item => item.id === selected.id);
  const change = changes => onChange(selected.collection, selected.id, changes);
  const titles = { mapLabels: 'Labels', mapZones: 'Zones', markers: 'Markers', arrows: 'Movement arrows' };
  const rowName = (collection, item, index) => collection === 'mapLabels' ? item.text || 'Empty label' : collection === 'mapZones' ? item.name || 'Unnamed zone' : collection === 'markers' ? markerName(item) : `Arrow ${index + 1}`;
  return <aside className="map-notes-panel" aria-label="Map notes">
    <h3>Map notes</h3><p>Choose a note to edit. Drag labels and zones with the Move tool.</p>
    {row && <section className="map-note-editor" key={`${selected.collection}:${row.id}`} aria-label="Selected map annotation">
      <h4>{selected.collection === 'mapZones' ? 'Visual zone' : selected.collection === 'mapLabels' ? 'Text label' : selected.collection === 'markers' ? 'Marker' : 'Movement arrow'}</h4>
      {selected.collection === 'mapLabels' && <CommitField label="Label text" type="textarea" value={row.text} onCommit={text => change({ text })} />}
      {selected.collection === 'mapZones' && <CommitField label="Zone name" value={row.name} onCommit={name => change({ name })} />}
      <label className="map-note-field"><span>Visible to</span><select className="field-input" value={row.audience === 'facilitator' ? 'facilitator' : 'all'} onChange={event => change({ audience: event.target.value })}><option value="all">Players & facilitator</option><option value="facilitator">Facilitator only</option></select></label>
      {['mapLabels', 'mapZones'].includes(selected.collection) && <>
        <label className="map-note-field map-note-color"><span>Color</span><input type="color" aria-label="Annotation color" value={mapColor(row.color)} onChange={event => change({ color: event.target.value })} /></label>
        <div className="map-note-coordinates"><CommitField label="Across (%)" type="number" min="0" max="100" step="0.1" value={Math.round(row.x / STAGE_W * 1000) / 10} onCommit={value => change({ x: Math.max(0, Math.min(STAGE_W - (row.w || 0), value / 100 * STAGE_W)) })} /><CommitField label="Down (%)" type="number" min="0" max="100" step="0.1" value={Math.round(row.y / STAGE_H * 1000) / 10} onCommit={value => change({ y: Math.max(0, Math.min(STAGE_H - (row.h || 0), value / 100 * STAGE_H)) })} /></div>
      </>}
      {selected.collection === 'mapZones' && <>
        <div className="map-note-coordinates"><CommitField label="Width (%)" type="number" min="1" max="100" step="0.1" value={Math.round(row.w / STAGE_W * 1000) / 10} onCommit={value => change({ w: Math.max(1, Math.min(STAGE_W - row.x, value / 100 * STAGE_W)) })} /><CommitField label="Height (%)" type="number" min="1" max="100" step="0.1" value={Math.round(row.h / STAGE_H * 1000) / 10} onCommit={value => change({ h: Math.max(1, Math.min(STAGE_H - row.y, value / 100 * STAGE_H)) })} /></div>
        <label className="map-note-field"><span>Story Location · optional</span><select className="field-input" value={row.storyLocationId || ''} onChange={event => change({ storyLocationId: event.target.value || null })}><option value="">No linked Story Location</option>{row.storyLocationId && !storyLocations.some(node => node.id === row.storyLocationId) && <option value={row.storyLocationId}>Unavailable Story Location · saved link</option>}{storyLocations.map(node => <option key={node.id} value={node.id}>{node.title || node.name || node.id}</option>)}</select></label>
      </>}
      <button type="button" className="btn small map-note-delete" onClick={() => onRemove(selected.collection, row.id)}>Delete {selected.collection === 'mapZones' ? 'zone' : selected.collection === 'mapLabels' ? 'label' : selected.collection === 'markers' ? 'marker' : 'arrow'}</button>
    </section>}
    {!MAP_OVERLAY_COLLECTIONS.some(key => mapRows(location, key).length) && <p>Add a label or draw a zone using the toolbar.</p>}
    {MAP_OVERLAY_COLLECTIONS.map(collection => mapRows(location, collection).length ? <section className="map-note-list" key={collection}><h4>{titles[collection]} · {mapRows(location, collection).length}</h4>{mapRows(location, collection).map((item, index) => <button type="button" key={item.id} className={selected?.collection === collection && selected.id === item.id ? 'selected' : ''} aria-pressed={selected?.collection === collection && selected.id === item.id} onClick={() => onSelect({ collection, id: item.id })}><span>{rowName(collection, item, index)}</span><small>{item.audience === 'facilitator' ? 'Facilitator only' : 'Players & facilitator'}</small></button>)}</section> : null)}
  </aside>;
}
