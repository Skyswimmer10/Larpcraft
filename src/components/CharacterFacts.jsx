import React, { useEffect, useRef, useState } from 'react';
import { CHARACTER_ROLES, characterFacts } from '../lib/characterFacts.js';
import './CharacterProfile.css';
import CharacterAttributes from './CharacterAttributes.jsx';
import CharacterMediaGallery from './CharacterMediaGallery.jsx';
import CharacterRelationships from './Relationships.jsx';

function ShortField({ label, value = '', onCommit, list }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return <label className="cp-field">{label}<input className="field-input" value={draft} list={list} onChange={event => setDraft(event.target.value)} onBlur={() => { if (draft !== String(value)) onCommit(draft); }} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></label>;
}

export function CharacterImage({ node, onChange, kind = 'Character' }) {
  const input = useRef(null), reader = useRef(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  useEffect(() => () => reader.current?.abort(), []);
  const choose = event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return; }
    setError(''); setLoading(true);
    const pending = new FileReader();
    reader.current = pending;
    pending.onload = () => {
      reader.current = null; setLoading(false);
      onChange({ dataUrl: pending.result, name: file.name, type: file.type });
    };
    pending.onerror = () => { reader.current = null; setLoading(false); setError('The image could not be read. Please choose it again.'); };
    pending.readAsDataURL(file);
  };
  return <div className="cp-character-image" aria-label={`${kind} image`}>
    {node.image?.dataUrl && <div className="cp-character-portrait"><img src={node.image.dataUrl} alt={`${kind === 'Group' ? 'Image' : 'Portrait'} of ${node.title || node.name || 'the ' + kind.toLowerCase()}`} /></div>}
    <div className="cp-character-image-controls"><button type="button" className="btn small" disabled={loading} onClick={() => input.current?.click()}>{loading ? 'Loading image…' : node.image?.dataUrl ? 'Change image' : 'Add image'}</button>
      {node.image?.dataUrl && <button type="button" className="btn ghost small" onClick={() => { reader.current?.abort(); reader.current = null; setLoading(false); setError(''); onChange(null); }}>Remove image</button>}
    </div>
    <input ref={input} type="file" accept="image/*" hidden aria-label={`Choose ${kind.toLowerCase()} image`} onChange={choose} />
    {error && <p className="hint" role="alert">{error}</p>}
  </div>;
}

export default function CharacterFacts({ node, onPatch, scope = { coll: 'nodes' }, showMedia = true }) {
  const facts = characterFacts(node);
  const patch = value => onPatch({ characterFacts: { ...facts, ...value } });
  const roleList = `character-role-${encodeURIComponent(node.id)}`;
  return <><section className="character-facts" aria-label="Character facts">
    <CharacterImage node={node} onChange={image => onPatch({ image })} />
    <ShortField label="Name / title" value={node.title || node.name || ''} onCommit={title => onPatch({ title, name: title })} />
    <ShortField label="Story role" value={facts.role} list={roleList} onCommit={role => patch({ role })} />
    <datalist id={roleList}>{CHARACTER_ROLES.map(role => <option key={role} value={role} />)}</datalist>
    <div className="cp-fact-grid">{[['gender', 'Gender'], ['race', 'Race'], ['age', 'Age']].map(([key, label]) => <ShortField key={key} label={label} value={facts[key]} onCommit={value => patch({ [key]: value })} />)}</div>
    <ShortField label="Goal / motivation" value={facts.goal} onCommit={goal => patch({ goal })} />
    <CharacterRelationships node={node} scope={scope} onPatch={onPatch} />
  </section><div className="character-extra-tools"><CharacterAttributes node={node} onPatch={onPatch} />{showMedia && <CharacterMediaGallery node={node} onPatch={onPatch} />}</div></>;
}
