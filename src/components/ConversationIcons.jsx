import React from 'react';
import { PrimIcon } from './bits.jsx';
import { ReferenceDialog } from './ResearchRecord.jsx';
import { ReferenceFileButton } from './ReferenceControls.jsx';
import { CONVERSATION_ICON_OPTIONS, resolveConversationIcon } from '../lib/conversationIcons.js';

export function ConversationIcon({ value, fallback, label, size = 28, className = '' }) {
  const icon = resolveConversationIcon(value, fallback);
  if (!icon) return null;
  return <span className={`cw-custom-icon ${className}`} style={{ width: size, height: size }} role="img" aria-label={label}>
    {icon.image ? <img src={icon.image.dataUrl} alt="" /> : icon.symbol ? <PrimIcon icon={icon.symbol} size={size} /> : <span>{icon.initial}</span>}
  </span>;
}

export function ConversationIconButton({ value, fallback, label, size = 28, className = '', onClick }) {
  return <button type="button" className={`cw-icon-button ${className}`} aria-label={`Edit ${label} icon`} title={`Add, change or remove ${label} icon`} aria-haspopup="dialog" onClick={onClick}>
    <ConversationIcon value={value} fallback={fallback} label={`${label} icon`} size={size} />
    <small>{value === null ? 'Add icon' : 'Edit icon'}</small>
  </button>;
}

export function ConversationIconPicker({ value, fallback, label, onChange, onClose }) {
  const save = icon => { onChange(icon); onClose(); };
  const current = resolveConversationIcon(value, fallback);
  return <ReferenceDialog title={`${label} icon`} className="cw-icon-dialog" onClose={onClose}>
    <div className="cw-icon-preview"><ConversationIcon value={value} fallback={fallback} label="Current icon" size={44} />{value === null && <span>No icon</span>}</div>
    <div className="cw-icon-options" aria-label="Choose a symbol">{CONVERSATION_ICON_OPTIONS.map(([symbol, name]) => <button type="button" key={symbol} className="btn" aria-label={`Use ${name} icon`} aria-pressed={current?.symbol === symbol} onClick={() => save({ symbol })}><PrimIcon icon={symbol} size={26} /><span>{name}</span></button>)}</div>
    <div className="cw-icon-picker-actions"><ReferenceFileButton imagesOnly multiple={false} label="Upload icon image" onAdd={files => { if (files[0]) save({ image: files[0] }); }} /><button type="button" className="btn small" onClick={() => save(undefined)}>Use default</button><button type="button" className="btn small cw-icon-remove" disabled={value === null} onClick={() => save(null)}>Remove icon</button></div>
    <p>Changes apply to this conversation. Character profile images stay unchanged.</p>
  </ReferenceDialog>;
}
