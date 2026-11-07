import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame, useDispatch } from '../state/store.jsx';
import { cloneCharacterCardTemplate } from '../data/seed.js';
import { characterFacts } from '../lib/characterFacts.js';
import { characterReference } from '../lib/conversations.js';
import { RELATIONSHIP_WORDS, createRelationship, legacyRelationshipRecord, relationshipStoryTargets, relationshipEntity, relationshipRefKey, relationshipScope, relationshipView, relationshipsFor, spaceRelationshipEdges } from '../lib/relationships.js';
import CharacterText from './CharacterText.jsx';
import './Relationships.css';

const CharacterFacts = lazy(() => import('./CharacterFacts.jsx'));
const CharacterProfile = lazy(() => import('./CharacterProfile.jsx'));
const FlowCanvas = lazy(() => import('./FlowCanvas.jsx'));

export function RelationshipDialog({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  const close = () => { document.activeElement?.blur?.(); onClose(); };
  useEffect(() => {
    const previous = document.activeElement, dialog = ref.current;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus?.(); };
  }, []);
  return createPortal(<dialog ref={ref} className={`relationship-dialog${wide ? ' relationship-wide' : ''}`} aria-label={title}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }}>
    <header><h2>{title}</h2><button type="button" className="btn" onClick={close}>Close</button></header>{children}
  </dialog>, document.body);
}

function createCharacter(game, name, source, sourceRef) {
  const node = { ...cloneCharacterCardTemplate(game.meta?.characterCardTemplate), id: 'character-' + crypto.randomUUID(), kind: 'character', title: name.trim(), name: name.trim(),
    x: Math.max(40, (source?.x || 80) + (source?.w || 280) + 150), y: Math.max(40, source?.y || 80), w: 260, h: 180, body: '', sub: { nodes: {}, edges: [] } };
  const scope = relationshipScope(sourceRef);
  return { node, ref: characterReference(scope, node.id), action: { type: 'GRAPH_ADD_NODE', scope, node } };
}

export function RelationshipPicker({ node, sourceRef, onClose, onAdded }) {
  const game = useGame(), dispatch = useDispatch();
  const [word, setWord] = useState(null), [custom, setCustom] = useState(''), [inverse, setInverse] = useState('Related to');
  const [mode, setMode] = useState('existing'), [name, setName] = useState(''), [query, setQuery] = useState(''), [targetKey, setTargetKey] = useState('');
  const targets = relationshipStoryTargets(game).filter(target => target.key !== relationshipRefKey(sourceRef));
  const visible = targets.filter(target => `${target.name} ${target.kind} ${target.location}`.toLowerCase().includes(query.toLowerCase()));
  const target = targets.find(target => target.key === targetKey);
  const label = word?.id === 'custom' ? custom.trim() : word?.label;
  const add = () => {
    if (!label || (mode === 'existing' ? !target : !name.trim())) return;
    const actions = [];
    let toRef = target?.ref || null, toName = target?.name || name.trim();
    if (mode === 'create') {
      const created = createCharacter(game, name, node, sourceRef);
      actions.push(created.action); toRef = created.ref; toName = created.node.title;
    }
    const record = createRelationship({ id: 'relationship-' + crypto.randomUUID(), fromRef: sourceRef, fromName: node.title || node.name, toRef, toName,
      word: word.id, forwardLabel: label, reverseLabel: word.id === 'custom' ? inverse.trim() || 'Related to' : word.inverse });
    actions.push({ type: 'ADD_ENTITY', coll: 'relationships', entity: record });
    dispatch({ type: 'BATCH', actions });
    onAdded?.(record); onClose();
  };
  return <RelationshipDialog title={`Add a relationship · ${node.title || node.name || 'Character'}`} onClose={onClose} wide>
    <div className="relationship-picker">
      <section className="relationship-vocabulary" aria-label="Relationship vocabulary">
        {[...new Set(RELATIONSHIP_WORDS.map(row => row.group))].map(group => <fieldset key={group}><legend>{group}</legend><div>{RELATIONSHIP_WORDS.filter(row => row.group === group).map(option => <button type="button" key={option.id} className="relationship-word" aria-pressed={word?.id === option.id} onClick={() => setWord(option)}>{option.label}</button>)}</div></fieldset>)}
        <button type="button" className="btn" aria-pressed={word?.id === 'custom'} onClick={() => setWord({ id: 'custom' })}>Custom relationship</button>
      </section>
      <section className="relationship-target" aria-label="Relationship target">
        {!word ? <p>Choose a word to start a connection.</p> : <>
          {word.id === 'custom' && <><label className="cp-field">Relationship word<input className="field-input" value={custom} placeholder="Owes a favour to" onChange={event => setCustom(event.target.value)} /></label><label className="cp-field">Read from the other side<input className="field-input" value={inverse} onChange={event => setInverse(event.target.value)} /></label></>}
          <h3>{node.title || node.name} <strong>{label || '…'}</strong> …</h3>
          <div className="relationship-target-modes" role="group" aria-label="Choose how to add the other person">{[['existing', 'Choose existing'], ['name', 'Name only'], ['create', 'Create character']].map(([id, text]) => <button type="button" className="btn" key={id} aria-pressed={mode === id} onClick={() => { setMode(id); setTargetKey(''); }}>{text}</button>)}</div>
          {mode === 'existing' ? <><input type="search" className="field-input" aria-label="Find a character or group in this game" placeholder="Search this game…" value={query} onChange={event => setQuery(event.target.value)} />
            <div className="relationship-target-list">{visible.map(row => <button type="button" key={row.key} aria-pressed={targetKey === row.key} onClick={() => setTargetKey(row.key)}><b>{row.name}</b><small>{row.kind} · {row.location}</small></button>)}{!visible.length && <p>No matching content in this game. You can enter a name or create a character.</p>}</div></>
            : <label className="cp-field">{mode === 'create' ? 'New character name' : 'Name or short label'}<input className="field-input" value={name} placeholder="A name, or an unnamed apprentice" onChange={event => setName(event.target.value)} /></label>}
          {mode === 'name' && <p className="hint">You can create or link their profile later.</p>}
          {mode === 'create' && <p className="hint">Creates a character beside this one, in this game. You can develop them afterwards.</p>}
          <button type="button" className="btn primary" disabled={!label || (mode === 'existing' ? !target : !name.trim())} onClick={add}>{mode === 'create' ? 'Create and connect' : 'Add relationship'}</button>
        </>}
      </section>
    </div>
  </RelationshipDialog>;
}

export function RelationshipCharacter({ entityRef, onClose }) {
  const game = useGame(), dispatch = useDispatch();
  const node = relationshipEntity(game, entityRef);
  if (!node) return <RelationshipDialog title="Character unavailable" onClose={onClose}><p className="relationship-body">The linked character is no longer available.</p></RelationshipDialog>;
  const scope = relationshipScope(entityRef), patch = value => dispatch({ type: 'GRAPH_UPDATE_NODE', scope, id: node.id, patch: value });
  return <RelationshipDialog title={node.title || node.name || 'Character'} onClose={onClose}>
    <div className="relationship-body"><Suspense fallback={<p>Opening profile…</p>}><CharacterFacts node={node} scope={scope} onPatch={patch} /><CharacterProfile node={node} scope={scope} onPatch={patch} /></Suspense></div>
  </RelationshipDialog>;
}

export function RelationshipDetails({ id, onClose }) {
  const game = useGame(), dispatch = useDispatch();
  const record = game.relationships?.[id];
  const [profileRef, setProfileRef] = useState(null), [linking, setLinking] = useState(false), [query, setQuery] = useState('');
  if (!record) return <RelationshipDialog title="Relationship unavailable" onClose={onClose}><p className="relationship-body">This connection was removed. Undo can restore it.</p></RelationshipDialog>;
  const view = relationshipView(record, game);
  const from = relationshipEntity(game, record.fromRef), to = relationshipEntity(game, record.toRef);
  const patch = values => dispatch({ type: 'UPDATE_ENTITY', coll: 'relationships', id, patch: values });
  const createTarget = () => {
    const created = createCharacter(game, view.toName, from, record.fromRef);
    dispatch({ type: 'BATCH', actions: [created.action, { type: 'UPDATE_ENTITY', coll: 'relationships', id, patch: { toRef: created.ref, toName: created.node.title } }] });
  };
  const targets = linking ? relationshipStoryTargets(game).filter(row => row.key !== relationshipRefKey(record.fromRef) && `${row.name} ${row.location}`.toLowerCase().includes(query.toLowerCase())) : [];
  return <><RelationshipDialog title={`${view.fromName} · ${view.toName}`} onClose={onClose} wide>
    <div className="relationship-body">
      <div className="relationship-endpoints"><button type="button" className="relationship-person" disabled={!from || from.kind !== 'character'} onClick={() => setProfileRef(record.fromRef)}>{from?.image?.dataUrl && <img src={from.image.dataUrl} alt="" />}<b>{view.fromName}</b><small>{!from ? 'Profile unavailable' : from.kind}</small></button>
        <div className="relationship-paired-labels"><p>{view.fromName} <b>{record.forwardLabel}</b> {view.toName}</p><p>{view.toName} <b>{record.reverseLabel}</b> {view.fromName}</p></div>
        <button type="button" className="relationship-person" disabled={!to || to.kind !== 'character'} onClick={() => setProfileRef(record.toRef)}>{to?.image?.dataUrl && <img src={to.image.dataUrl} alt="" />}<b>{view.toName}</b><small>{!to ? record.toRef ? 'Profile unavailable' : 'Name only' : to.kind}</small></button></div>
      <details className="relationship-word-settings"><summary>Relationship words and linked profile</summary><div className="relationship-word-fields">
        <label className="cp-field">From {view.fromName}<input className="field-input" aria-label="Forward relationship word" defaultValue={record.forwardLabel} key={`forward:${record.forwardLabel}`} onBlur={event => { const value = event.target.value.trim(); if (value && value !== record.forwardLabel) patch({ forwardLabel: value }); }} /></label>
        <label className="cp-field">From {view.toName}<input className="field-input" aria-label="Reverse relationship word" defaultValue={record.reverseLabel} key={`reverse:${record.reverseLabel}`} onBlur={event => { const value = event.target.value.trim(); if (value && value !== record.reverseLabel) patch({ reverseLabel: value }); }} /></label>
        <label className="cp-field">Other person’s name<input className="field-input" aria-label="Unlinked relationship name" disabled={!!to} defaultValue={view.toName} key={view.toName} onBlur={event => { const value = event.target.value.trim(); if (value && value !== view.toName) patch({ toName: value }); }} /></label>
      </div><div className="cp-actions"><button type="button" className="btn small" onClick={() => setLinking(value => !value)}>{linking ? 'Cancel selection' : 'Choose another existing profile'}</button>{!to && <button type="button" className="btn small" onClick={createTarget}>Create profile for {view.toName}</button>}</div>
        {linking && <><input type="search" className="field-input" aria-label="Find existing relationship target" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search this game…" /><div className="relationship-target-list">{targets.map(row => <button type="button" key={row.key} onClick={() => { patch({ toRef: row.ref, toName: row.name }); setLinking(false); }}><b>{row.name}</b><small>{row.location}</small></button>)}</div></>}
      </details>
      {!to && !record.toRef && <button type="button" className="btn small" onClick={createTarget}>Create profile for {view.toName}</button>}
      <CharacterText key={id} label="Relationship description" value={record.description || ''} rows={12} onCommit={description => patch({ description })} />
      {record.pendingDescription !== undefined && <section className="relationship-review"><h3>Review updated description</h3><pre>{record.pendingDescription}</pre><div className="cp-actions"><button type="button" className="btn" onClick={() => patch({ description: record.pendingDescription, pendingDescription: undefined })}>Use updated description</button><button type="button" className="btn" onClick={() => patch({ pendingDescription: undefined })}>Keep my wording</button></div></section>}
      {!!record.wizardInputs?.length && <details><summary>Framework inputs · {record.wizardInputs.length}</summary>{record.wizardInputs.map((input, index) => <section key={input.sessionId || index}><h3>{input.sourceLabel || input.sourceId}</h3><p>{input.summary || input.generatedText}</p>{(input.questions || []).map((question, q) => <p key={question.key || q}><b>{question.prompt}</b><br />{input.answers?.[question.key] || ''}</p>)}</section>)}</details>}
      <div className="relationship-footer"><button type="button" className="btn relationship-remove" onClick={() => { dispatch({ type: 'DELETE_ENTITY', coll: 'relationships', id }); onClose(); }}>Remove relationship</button><small>Edits save to this game. Undo restores removed connections.</small></div>
    </div>
  </RelationshipDialog>{profileRef && <RelationshipCharacter entityRef={profileRef} onClose={() => setProfileRef(null)} />}</>;
}

export default function CharacterRelationships({ node, scope = { coll: 'nodes' }, onPatch }) {
  const game = useGame() || {}, dispatch = useDispatch();
  const [adding, setAdding] = useState(false), [selected, setSelected] = useState(null), [profileRef, setProfileRef] = useState(null);
  const ref = characterReference(scope, node.id);
  const current = relationshipsFor(game, ref);
  const legacy = (characterFacts(node).relationships || []).filter(row => !row.relationshipId);
  const promote = row => {
    const record = legacyRelationshipRecord(game, ref, node, row, 'relationship-' + crypto.randomUUID());
    dispatch({ type: 'BATCH', actions: [
      { type: 'GRAPH_UPDATE_NODE', scope, id: node.id, patch: { characterFacts: { ...characterFacts(node), relationships: characterFacts(node).relationships.filter(old => old.id !== row.id) } } },
      { type: 'ADD_ENTITY', coll: 'relationships', entity: record },
    ] });
    setSelected(record.id);
  };
  return <><details className="cp-relationships" open={current.length || legacy.length ? true : undefined}><summary>Relationships and loyalties{current.length + legacy.length ? ` · ${current.length + legacy.length}` : ''}</summary>
    {current.map(row => <div className="relationship-brief" key={row.id}><button type="button" className="relationship-label" onClick={() => setSelected(row.id)} aria-label={`Open relationship: ${row.label} ${row.targetName}`}>{row.label}</button>
      <button type="button" className="relationship-name" onClick={() => row.targetRef && !row.missing && relationshipEntity(game, row.targetRef)?.kind === 'character' ? setProfileRef(row.targetRef) : setSelected(row.id)}>{row.targetName}{row.missing ? ' · unavailable' : !row.targetRef ? ' · name only' : ''}</button>
      <button type="button" className="relationship-details-button" title="Open relationship description" aria-label={`Details: ${row.label} ${row.targetName}`} onClick={() => setSelected(row.id)}>ⓘ{row.description?.trim() ? ' ●' : ''}</button>
      <button type="button" className="x relationship-remove" aria-label={`Remove ${row.label}: ${row.targetName}`} onClick={() => dispatch({ type: 'DELETE_ENTITY', coll: 'relationships', id: row.id })}>×</button></div>)}
    {legacy.map(row => <div className="relationship-brief" key={row.id}><button type="button" className="relationship-label" onClick={() => promote(row)}>{row.type}</button><button type="button" className="relationship-name" onClick={() => promote(row)}>{row.name}</button><button type="button" className="x relationship-remove" aria-label={`Remove ${row.type}: ${row.name}`} onClick={() => onPatch({ characterFacts: { ...characterFacts(node), relationships: characterFacts(node).relationships.filter(old => old.id !== row.id) } })}>×</button></div>)}
    <button type="button" className="btn small" onClick={() => setAdding(true)}>Add relationship</button>
  </details>{adding && <RelationshipPicker node={node} sourceRef={ref} onClose={() => setAdding(false)} />}{selected && <RelationshipDetails id={selected} onClose={() => setSelected(null)} />}{profileRef && <RelationshipCharacter entityRef={profileRef} onClose={() => setProfileRef(null)} />}</>;
}

export function RelationshipsCanvas({ onClose }) {
  const game = useGame();
  const [selected, setSelected] = useState(null), [profile, setProfile] = useState(null), [query, setQuery] = useState(''), [positions, setPositions] = useState({});
  const records = Object.values(game.relationships || {}).map(record => relationshipView(record, game)).filter(record => `${record.fromName} ${record.toName} ${record.forwardLabel} ${record.reverseLabel} ${record.description}`.toLowerCase().includes(query.toLowerCase()));
  const nodes = {}, edges = [];
  const add = (ref, name, key) => {
    if (nodes[key]) return;
    const entity = relationshipEntity(game, ref), index = Object.keys(nodes).length;
    nodes[key] = { id: key, kind: 'relationshipPerson', kindLabel: entity?.kind === 'character' ? 'Character' : entity?.kind === 'group' ? 'Group' : entity?.kind || 'Name only', title: name, image: entity?.image, entityRef: ref, missing: !!ref && !entity, x: 80 + index % 3 * 410, y: 110 + Math.floor(index / 3) * 260, w: 240, h: 170, ...(positions[key] || {}) };
  };
  for (const record of records) {
    const from = relationshipRefKey(record.fromRef), to = record.toRef ? relationshipRefKey(record.toRef) : `name:${record.id}`;
    add(record.fromRef, record.fromName, from); add(record.toRef, record.toName, to);
    edges.push({ from, to, label: record.forwardLabel, relationshipId: record.id, color: '#82c9b8' });
  }
  return <><RelationshipDialog title="Relationships · this game" onClose={onClose} wide><div className="relationship-canvas-search"><input type="search" className="field-input" aria-label="Search relationships" placeholder="Search people, relationship words or descriptions…" value={query} onChange={event => setQuery(event.target.value)} /></div>
    <div className="relationship-canvas"><Suspense fallback={<p>Opening relationships…</p>}>{records.length ? <FlowCanvas nodes={nodes} edges={spaceRelationshipEdges(edges)} colorOf={() => '#82c9b8'} iconOf={() => 'user'}
      onSelect={() => {}} onMove={(id, x, y) => setPositions(current => ({ ...current, [id]: { x, y } }))} onOpenRelationship={edge => setSelected(edge.relationshipId)}
      renderBody={node => <div className="relationship-canvas-person">{node.image?.dataUrl && <img src={node.image.dataUrl} alt="" />}<button type="button" className="btn small" disabled={!node.entityRef || node.missing || relationshipEntity(game, node.entityRef)?.kind !== 'character'} onClick={event => { event.stopPropagation(); setProfile(node.entityRef); }}>Open character</button>{node.missing && <small>Profile unavailable</small>}</div>} /> : <p className="empty">{query ? 'No relationships match this search.' : 'Add a relationship from a character to see the connections here.'}</p>}</Suspense></div>
  </RelationshipDialog>{selected && <RelationshipDetails id={selected} onClose={() => setSelected(null)} />}{profile && <RelationshipCharacter entityRef={profile} onClose={() => setProfile(null)} />}</>;
}
