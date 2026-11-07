import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ATTRIBUTE_CATEGORIES, ATTRIBUTE_PRESETS, attributeValues, characterAttributeFields, newAttributeField, toggleAttributeValue } from '../lib/characterAttributes.js';
import './CharacterAttributes.css';
import { PrimIcon } from './bits.jsx';

function AttributeEditor({ field, onChange }) {
  const [draft, setDraft] = useState('');
  const [text, setText] = useState(field.value || '');
  const listId = useId();
  useEffect(() => setText(field.value || ''), [field.value]);
  const values = attributeValues(field), preset = ATTRIBUTE_PRESETS.find(row => row.id === field.id);
  const commit = () => {
    const value = draft.trim();
    if (value && !values.some(item => item.toLocaleLowerCase() === value.toLocaleLowerCase())) onChange({ ...field, values: [...values, value] });
    setDraft('');
  };
  return <section className="ca-field" aria-label={field.label}>
    <h4>{field.label}</h4>
    {field.kind === 'text' ? <textarea aria-label={field.label} className="field-input ca-short-text" rows={2} value={text} onChange={event => setText(event.target.value)} onBlur={() => { if (text !== (field.value || '')) onChange({ ...field, value: text }); }} /> : <>
      <div className="ca-tags">{values.map(value => <span className="ca-tag" key={value}>{value}<button type="button" aria-label={`Remove ${field.label}: ${value}`} onClick={() => onChange(toggleAttributeValue(field, value))}>×</button></span>)}</div>
      <div className="ca-add-tag"><input className="field-input" aria-label={`Add ${field.label.toLowerCase()} tag`} placeholder="Type a tag…" list={listId} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commit(); } }} /><button type="button" className="btn small" disabled={!draft.trim()} onClick={commit}>Add</button></div>
      <datalist id={listId}>{(preset?.options || []).filter(value => !values.includes(value)).map(value => <option key={value} value={value} />)}</datalist>
      {preset?.options && <details className="ca-suggestions"><summary>Suggested tags</summary><div className="ca-choices">{preset.options.map(value => <button type="button" key={value} aria-pressed={values.includes(value)} onClick={() => onChange(toggleAttributeValue(field, value))}>{value}</button>)}</div></details>}
    </>}
  </section>;
}

// Apply/cancel makes removing a populated field an explicit, undoable operation.
export function ManageCharacterAttributes({ fields, onApply, onClose, kind = 'character' }) {
  const [draft, setDraft] = useState(() => fields.map(field => ({ ...field })));
  const [category, setCategory] = useState('personality'), [search, setSearch] = useState('');
  const [customName, setCustomName] = useState(''), [customKind, setCustomKind] = useState('tags');
  const [error, setError] = useState('');
  const dialog = useRef(null), titleId = useId();
  useEffect(() => {
    const previous = document.activeElement, element = dialog.current;
    element.showModal();
    return () => { element.close(); previous?.focus?.(); };
  }, []);
  const custom = [...new Map([...fields, ...draft].filter(field => !ATTRIBUTE_PRESETS.some(preset => preset.id === field.id)).map(field => [field.id, field])).values()];
  const options = [...ATTRIBUTE_PRESETS, ...custom];
  const visible = options.filter(field => (category === 'selected' ? draft.some(row => row.id === field.id) : field.category === category) && field.label.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const toggle = field => setDraft(previous => previous.some(row => row.id === field.id) ? previous.filter(row => row.id !== field.id) : [...previous, fields.find(row => row.id === field.id) || newAttributeField(field)]);
  const addCustom = event => {
    event.preventDefault();
    const label = customName.trim();
    if (!label) return;
    if (options.some(field => field.label.toLocaleLowerCase() === label.toLocaleLowerCase())) { setError('A field with this name already exists.'); return; }
    setDraft(previous => [...previous, newAttributeField({ id: `custom:${crypto.randomUUID()}`, label, category: 'custom', kind: customKind })]);
    setCustomName(''); setError(''); setCategory('custom'); setSearch('');
  };
  return createPortal(<dialog ref={dialog} className="ca-manager" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
    <header><div><h2 id={titleId}>Manage {kind} attributes</h2><p>Choose the fields you want. Everything is optional.</p></div><button type="button" className="btn" onClick={onClose}>Cancel</button></header>
    <div className="ca-manager-layout">
      <nav aria-label="Attribute categories">{[['selected', 'Selected', '✓'], ...ATTRIBUTE_CATEGORIES].map(([id, label, icon]) => <button type="button" key={id} className={category === id ? 'active' : ''} aria-pressed={category === id} onClick={() => setCategory(id)}><span aria-hidden="true">{icon}</span>{label}{id === 'selected' ? ` (${draft.length})` : ''}</button>)}</nav>
      <main><label className="cp-field">Search fields<input type="search" className="field-input" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <div className="ca-field-options">{visible.map(field => <label key={field.id}><input type="checkbox" checked={draft.some(row => row.id === field.id)} onChange={() => toggle(field)} /><span><b>{field.label}</b><small>{field.kind === 'text' ? 'Short text' : 'Tags · choose suggestions or write your own'}</small></span></label>)}</div>
        {!visible.length && <p>No matching fields here.</p>}
        {category === 'personality' && <p className="hint">These are writing labels. Choose any combination that fits your {kind}.</p>}
        {category === 'custom' && <form className="ca-custom" onSubmit={addCustom}><h3>Create a custom field</h3><label className="cp-field">Field name<input className="field-input" value={customName} onChange={event => { setCustomName(event.target.value); setError(''); }} /></label><label className="cp-field">Format<select className="field-input" value={customKind} onChange={event => setCustomKind(event.target.value)}><option value="tags">Tags</option><option value="text">Short text</option></select></label><button type="submit" className="btn" disabled={!customName.trim()}>Add custom field</button>{error && <p role="alert">{error}</p>}</form>}
      </main>
    </div>
    <footer><p>Unchecked fields and their values are removed when you apply. Cancel keeps everything.</p><button type="button" className="btn primary" onClick={() => onApply(draft)}>Apply fields ({draft.length})</button></footer>
  </dialog>, document.body);
}

export function CharacterAttributesDialog({ node, onPatch, onClose }) {
  const kind = node.kind === 'group' ? 'group' : 'character';
  const fields = characterAttributeFields(node);
  const [manage, setManage] = useState(false);
  const dialog = useRef(null), titleId = useId();
  const close = () => { document.activeElement?.blur?.(); onClose(); };
  useEffect(() => {
    const previous = document.activeElement, element = dialog.current;
    element.showModal();
    return () => { element.close(); previous?.focus?.(); };
  }, []);
  const patch = nextFields => onPatch({ characterAttributes: { ...node.characterAttributes, version: 1, fields: nextFields } });
  return createPortal(<dialog ref={dialog} className="ca-manager ca-editor" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }}>
    <header><div><h2 id={titleId}>Quick attributes · {node.title || node.name || 'Character'}</h2><p>Use quick details alone or alongside frameworks.</p></div><button type="button" className="btn" onClick={close}>Done</button></header>
    <main className="ca-editor-body">
      <button type="button" className="btn small" aria-haspopup="dialog" onClick={() => setManage(true)}>{fields.length ? 'Manage attributes' : 'Add attributes'}</button>
      {!fields.length && <p>Choose the fields you want, then select tags or write your own.</p>}
      <div className="ca-editor-fields">{fields.map(field => <AttributeEditor key={field.id} field={field} onChange={next => patch(fields.map(row => row.id === field.id ? next : row))} />)}</div>
    </main>
    {manage && <ManageCharacterAttributes kind={kind} fields={fields} onClose={() => setManage(false)} onApply={next => { patch(next); setManage(false); }} />}
  </dialog>, document.body);
}

export default function CharacterAttributes({ node, onPatch }) {
  const [open, setOpen] = useState(false);
  const count = characterAttributeFields(node).length;
  return <section className="character-attributes" aria-label={`Optional ${node.kind === 'group' ? 'group' : 'character'} attributes`}>
    <button type="button" className="btn small ca-quick-button" aria-label="Quick attributes" title="Edit quick attributes" aria-haspopup="dialog" onClick={() => setOpen(true)}><PrimIcon icon="rules" size={19} /></button><span>Quick attributes{count ? ` · ${count}` : ''}</span>
    {open && <CharacterAttributesDialog node={node} onPatch={onPatch} onClose={() => setOpen(false)} />}
  </section>;
}
