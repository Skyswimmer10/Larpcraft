import React, { useEffect, useId, useRef, useState } from 'react';
import { characterReferenceKey, conversationSpeakerProfile } from '../lib/conversations.js';

export default function ConversationParticipantPicker({ characters = [], participants = [], onAdd, libraryMode = false }) {
  const [query, setQuery] = useState(''), [selectedKey, setSelectedKey] = useState(null);
  const [open, setOpen] = useState(false), [highlighted, setHighlighted] = useState(-1), [error, setError] = useState('');
  const input = useRef(null), list = useRef(null), listId = useId(), inputId = useId();
  const available = (libraryMode ? [] : characters).filter(row => !participants.some(person => characterReferenceKey(person.characterRef) === row.key));
  const selected = selectedKey && available.find(row => row.key === selectedKey);
  const filter = selected ? '' : query.trim().toLocaleLowerCase();
  const options = available.filter(row => `${row.name} ${row.location}`.toLocaleLowerCase().includes(filter)).map(row => ({ ...row, type: 'character' }));
  if (query.trim()) options.push({ key: 'new-name', type: 'name', name: query.trim() });
  useEffect(() => { if (open && highlighted >= 0) list.current?.children[highlighted]?.scrollIntoView({ block: 'nearest' }); }, [open, highlighted]);
  const choose = option => {
    setQuery(option.name); setSelectedKey(option.type === 'character' ? option.key : null);
    setError(''); input.current?.focus(); setOpen(false); setHighlighted(-1);
  };
  const submit = event => {
    event.preventDefault();
    if (!query.trim() || selectedKey && !selected) return;
    const participant = { id: 'speaker-' + crypto.randomUUID(), name: selected?.name || query.trim(),
      ...(selected ? { characterRef: selected.ref, profileSnapshot: conversationSpeakerProfile({ characterRef: selected.ref }, characters) } : {}) };
    if (onAdd(participant) === false) { setError('This character is already in the conversation.'); return; }
    setQuery(''); setSelectedKey(null); setOpen(false); setHighlighted(-1);
  };
  const keyDown = event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); setOpen(true);
      setHighlighted(index => !options.length ? -1 : !open || index < 0 ? event.key === 'ArrowDown' ? 0 : options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Enter' && open && options[highlighted]) { event.preventDefault(); choose(options[highlighted]); }
  };
  return <form className="cw-participant-picker" onSubmit={submit} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label className="cw-picker-label" htmlFor={inputId}>Character or name</label>
    <div className="cw-picker-control"><input ref={input} id={inputId} className="field-input" role="combobox" aria-label="Find or name a character" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && options[highlighted] ? `${listId}-${highlighted}` : undefined} autoComplete="off" placeholder={libraryMode ? 'Type a speaker name…' : 'Find a character or type a name…'} value={query} onFocus={() => setOpen(true)} onKeyDown={keyDown} onChange={event => { setQuery(event.target.value); setSelectedKey(null); setHighlighted(-1); setError(''); setOpen(true); }} />
      <button type="button" className="cw-picker-toggle" aria-label="Show character choices" aria-expanded={open} aria-controls={listId} onClick={() => { const next = !open; input.current?.focus(); setOpen(next); setHighlighted(-1); }} onKeyDown={keyDown}><svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="m5 7 5 5 5-5" /></svg></button>
    </div>
    {open && <div className="cw-picker-options" role="listbox" aria-label="Character choices" id={listId} ref={list}>
      {options.map((option, index) => <div key={option.key} id={`${listId}-${index}`} role="option" aria-selected={option.type === 'character' && selectedKey === option.key} className={`cw-picker-option${index === highlighted ? ' highlighted' : ''}${option.type === 'name' ? ' new-name' : ''}`} onPointerDown={event => event.preventDefault()} onMouseEnter={() => setHighlighted(index)} onClick={() => choose(option)}><b>{option.type === 'name' ? `Use “${option.name}”` : option.name}</b><small>{option.type === 'name' ? 'Name-only speaker' : option.location}</small></div>)}
      {!options.length && <span className="cw-picker-empty">{libraryMode ? 'Type a new speaker name.' : 'No characters available. Type a name to add one.'}</span>}
    </div>}
    <div className="cw-picker-add"><small>{selected ? selected.location : query.trim() ? 'Name-only speaker' : ''}</small><button type="submit" className="btn small primary" disabled={!query.trim() || !!selectedKey && !selected}>Add</button></div>
    {error && <small role="alert">{error}</small>}
  </form>;
}
