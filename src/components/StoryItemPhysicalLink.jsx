import React from 'react';
import { Pill, SectionLabel } from './bits.jsx';

export default function StoryItemPhysicalLink({ node, game, onPatch, onSelect }) {
  const items = Object.values(game?.items || {}).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const linked = game?.items?.[node.itemId];
  return (
    <div className="isect">
      <SectionLabel>Real item / prop</SectionLabel>
      <div className="hint">Link the physical object used to represent this story item. Each keeps its own description.</div>
      {game ? <>
        <label className="lab" htmlFor={`story-prop-${node.id}`}>Physical item in this game</label>
        <select id={`story-prop-${node.id}`} className="field-input" value={node.itemId || ''} onChange={e => onPatch({ itemId: e.target.value || null })}>
          <option value="">No physical item linked</option>
          {node.itemId && !linked && <option value={node.itemId}>Missing physical item · {node.itemId}</option>}
          {items.map(item => <option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}
        </select>
        {!items.length && <p className="hint">Create a real item in Items &amp; Gadgets, or add one there from the Physical library, then link it here.</p>}
        {linked && <div className="story-item-physical-preview">
          {linked.image?.dataUrl && <img src={linked.image.dataUrl} alt={linked.name || 'Physical prop'} style={{ maxWidth: 100, maxHeight: 100, objectFit: 'contain' }} />}
          <b>{linked.name}</b>
          {linked.description && <p style={{ whiteSpace: 'pre-wrap' }}>{linked.description}</p>}
          {linked.propNotes && <div><SectionLabel>Practical prop notes</SectionLabel><p style={{ whiteSpace: 'pre-wrap' }}>{linked.propNotes}</p></div>}
          {linked.availability && <Pill availability={linked.availability} />}
          {onSelect && <button className="btn small" onClick={() => onSelect({ kind: 'item', id: linked.id })}>Edit real item</button>}
        </div>}
        {node.itemId && !linked && <p className="hint">The linked physical item is no longer available. Choose a replacement or unlink it.</p>}
        {node.itemId && <button className="linkbtn" onClick={() => onPatch({ itemId: null })}>Unlink real item</button>}
      </> : <p className="hint">Choose the physical prop after adding this Story Item to a game. Library templates keep the story description for reuse.</p>}
    </div>
  );
}
