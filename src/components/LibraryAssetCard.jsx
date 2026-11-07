import React from 'react';
import { PrimIcon, Thumb } from './bits.jsx';

// Physical templates and created story content share the same photo-card shell.
export default function LibraryAssetCard({ item, onPick }) {
  const card=<button type="button" className={`card lib library-asset-card${item.selected ? ' sel' : ''}`}
    aria-pressed={item.selected === undefined ? undefined : item.selected}
    title={item.blurb || item.label} onClick={onPick}>
    <span className="thumb">
      {item.image || item.thumbnailType
        ? <Thumb image={item.image} type={item.thumbnailType} />
        : !item.hideIcon && <span className="ph" style={{ color: item.color || 'var(--brand)' }}><PrimIcon icon={item.icon || 'layers'} /></span>}
    </span>
    <span className="library-asset-caption">
      <b>{item.label}</b>
      {item.kicker && <span className="tag libtag">{item.kicker}</span>}
    </span>
  </button>;
  return item.onDelete?<div className="library-asset-wrap">{card}<button type="button" className="library-asset-delete" aria-label={'Remove '+item.label+' from this game'} title="Remove from this game" onClick={event=>{event.stopPropagation();item.onDelete();}}><PrimIcon icon="trash" size={14}/></button></div>:card;
}
