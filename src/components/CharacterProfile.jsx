import React, { useState } from 'react';
import { useDispatch, useGame, useLibrary, useLibraryDispatch } from '../state/store.jsx';
import { locateGraph } from '../state/reducer.js';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { genId } from '../data/csvSchemas.js';
import { NarrativeWizardButton } from './NarrativeWizard.jsx';
import { wizardLibraryRecord } from '../lib/narrativeWizard.js';
import { CHARACTER_INPUT_LABEL, characterSources, characterProfilePatch, characterInputSnapshot, characterWizardRecords, resolveCharacterPassage, editCharacterDescription, reviewCharacterDescription, characterDescriptionReviews } from '../lib/characterProfile.js';
import { characterReference } from '../lib/conversations.js';
import CharacterWorkspace from './CharacterWorkspace.jsx';
import NarrativeSourceSymbol from './NarrativeSourceSymbol.jsx';
import './CharacterProfile.css';

function InputSymbols({ row, pool }) {
  const records = row.record ? [row.record] : row.records?.length ? row.records : [{ sourceId: row.frameworkId || row.nodeId, sourceSnapshot: pool[row.nodeId], sourceType: row.frameworkId ? 'framework' : 'concept' }];
  return <span className="cp-input-symbols">{records.map(record => <span key={record.sessionId || record.sourceId} className={record.sourceType}><NarrativeSourceSymbol source={{ ...record.sourceSnapshot, id: record.sourceId }} type={record.sourceType} /></span>)}</span>;
}

export default function CharacterProfile({ node, scope = { coll: 'nodes' }, onPatch }) {
  const kind = node.kind === 'group' ? 'Group' : 'Character', subject = kind.toLowerCase();
  const game = useGame(), library = useLibrary(), dispatch = useDispatch(), libraryDispatch = useLibraryDispatch();
  const [workspace, setWorkspace] = useState(null), [status, setStatus] = useState('');
  const graph = locateGraph(game, scope);
  const root = scope.coll === 'nodes' && !scope.parentId && !scope.parentPath?.length;
  const pool = { ...graph.nodes, ...(root ? game.frameworks : {}) };
  const sourceGraph = { ...graph, nodes: pool, teams: game.teams, factions: game.factions };
  const profile = node.characterProfile;
  const sources = characterSources(node, sourceGraph);
  const candidates = Object.values(pool).filter(other => other.id !== node.id && ['concept', 'framework'].includes(other.kind) && !other.mechKind && !(profile?.links || []).some(link => link.nodeId === other.id));
  const patchProfile = patch => {
    const updated = characterProfilePatch(node, sourceGraph, patch);
    onPatch({ characterProfile: updated.characterProfile, body: updated.body, description: updated.description });
  };
  const linkInput = id => {
    const source = pool[id];
    if (!source) return;
    const active = characterProfilePatch(node, sourceGraph, { links: [...(profile?.links || []), { nodeId: id, snapshot: characterInputSnapshot(source) }] });
    const update = { type: 'GRAPH_UPDATE_NODE', scope, id: node.id, patch: { characterProfile: active.characterProfile, body: active.body, description: active.description } };
    const edge = graph.edges.some(edge => edge.from === id && edge.to === node.id) ? [] : [{ type: 'GRAPH_ADD_EDGE', scope, from: id, to: node.id, label: CHARACTER_INPUT_LABEL }];
    // Top-level framework reference cards live in a separate collection.
    const actions = root && game.frameworks?.[id] ? [{ type: 'ADD_EDGE', from: id, to: node.id, label: CHARACTER_INPUT_LABEL }, update] : [...edge, update];
    dispatch({ type: 'BATCH', actions });
  };
  const removeInput = row => {
    dispatch({ type: 'REMOVE_CHARACTER_INPUT', scope, id: node.id, key: row.key });
    setStatus(`Removed ${row.sourceLabel || row.label} input. Undo restores it.`);
  };
  const resolvePassage = (key, accept) => {
    const updated = resolveCharacterPassage(node, sourceGraph, key, accept);
    onPatch({ characterProfile: updated.characterProfile, body: updated.body, description: updated.description });
  };
  const writeDescription = text => {
    const updated = editCharacterDescription(node, sourceGraph, text);
    onPatch({ characterProfile: updated.characterProfile, body: updated.body, description: updated.description });
  };
  const reviewDescription = (id, accept, editedText) => {
    const updated = reviewCharacterDescription(node, sourceGraph, id, accept, editedText);
    onPatch({ characterProfile: updated.characterProfile, body: updated.body, description: updated.description });
  };
  const editPassage = (key, text) => {
    const active = characterProfilePatch(node, sourceGraph, {});
    const source = sources.find(row => row.key === key);
    const blocks = active.characterProfile.blocks;
    patchProfile({ blocks: blocks.some(block => block.key === key)
      ? blocks.map(block => block.key === key ? { ...block, text } : block)
      : [...blocks, { key, generated: source?.generated || '', sourceText: source?.text || '', text }] });
  };
  const wizardButton = (record, owner = node, label = 'Edit wizard') => <NarrativeWizardButton key={record.sessionId || record.sourceId} resumeNode={owner} resumeRecord={record} gameScope={scope} label={label} ariaLabel={`Edit wizard: ${record.sourceLabel || record.sourceId} · ${record.title || 'Character input'}`} className="btn small" />;
  const saveTemplate = () => {
    const record = wizardLibraryRecord(node, genId(library.narrative || {}, kind === 'Group' ? 'LIB-GROUP-' : 'LIB-NAR-'));
    libraryDispatch({ type: 'ADD_ENTITY', ...record });
    setStatus(`Saved an independent ${subject} template to the library.`);
  };
  return <section className="character-profile" aria-label={`${kind} development`}>
    <h4>{kind} inputs</h4>
    <p className="hint">Use any frameworks or concepts that help. Every input is optional. Saved wizards stay editable.</p>
    {!profile && <button type="button" className="btn primary wide" onClick={() => patchProfile({})}>Combine into a living {subject} description</button>}
    <NarrativeWizardButton targetId={node.id} gameScope={scope} label="Add a framework or concept" className="btn wide" />
    <label className="cp-field">Use a canvas input<select aria-label="Use a canvas input" className="field-input" value="" onChange={event => linkInput(event.target.value)}><option value="">Choose a concept or framework…</option>{candidates.map(other => <option key={other.id} value={other.id}>{other.title || other.name} · {other.kind}</option>)}</select></label>
    {sources.map(row => <div className="cp-source" key={row.key}>
      <div className="cp-source-heading"><label className="cp-check"><input type="checkbox" checked={row.enabled} onChange={event => patchProfile({ excluded: event.target.checked ? (profile?.excluded || []).filter(key => key !== row.key) : [...(profile?.excluded || []), row.key] })} /><span><InputSymbols row={row} pool={pool} /><b>{row.label}</b>{row.sourceLabel && <small>{row.sourceLabel}</small>}</span></label>
        <div className="cp-source-editors">
          {row.record && wizardButton(row.record)}
          {!row.missing && row.records?.map(record => wizardButton(record, pool[row.nodeId], row.records.length > 1 ? `Edit ${record.sourceLabel || record.sourceId}` : 'Edit wizard'))}
          {row.nodeId && !row.missing && !row.records?.length && <NarrativeWizardButton source={pool[row.nodeId].kind === 'framework' ? FRAMEWORK_TYPES[pool[row.nodeId].frameworkId] : pool[row.nodeId]} sourceType={pool[row.nodeId].kind === 'framework' ? 'framework' : 'concept'} targetId={node.id} gameScope={scope} label="Develop" ariaLabel={`Develop with this reference: ${row.sourceLabel || row.label}`} className="btn small" />}
        </div>
        <button type="button" className="cp-input-delete" aria-label={`Delete ${row.sourceLabel || row.label} input: ${row.label}`} title="Delete this input and its saved questions · Undo restores it" onClick={() => removeInput(row)}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6" /></svg></button>
      </div>
      {profile?.blocks?.some(block => block.key === row.key && block.pending !== undefined) && <button type="button" className="btn small" onClick={() => setWorkspace('passage:' + row.key)}>Review passage update</button>}
      {row.missing && <><p className="hint">{row.detached ? 'Independent saved input.' : 'The canvas source is missing. Its saved contribution is retained.'}</p>{!!row.records?.length && <button type="button" className="btn small" onClick={() => {
        const records = row.records.map(record => ({ ...record, resultId: node.id, sessionId: node.id + ':copy:' + crypto.randomUUID(), questionIds: {}, attachedChildId: undefined }));
        const updated = characterProfilePatch({ ...node, narrativeWizardHistory: [...characterWizardRecords(node), ...records] }, sourceGraph, { links: profile.links.filter(link => link.nodeId !== row.nodeId), excluded: [...(profile.excluded || []).filter(key => key !== row.key), ...(!row.enabled ? records.map(record => `wizard:${record.sessionId}`) : [])] });
        onPatch({ characterProfile: updated.characterProfile, narrativeWizardHistory: updated.narrativeWizardHistory, body: updated.body, description: updated.description });
      }}>Keep as editable {subject} inputs</button>}</>}
    </div>)}

    {!!characterDescriptionReviews(node).length && <p className="cp-review" role="status">Inputs changed. Your description is protected. Open the {subject} profile to review {characterDescriptionReviews(node).length} paragraph(s).</p>}
    <div className="cp-actions"><button type="button" className="btn primary" onClick={() => setWorkspace('profile')}>Edit {kind}’s Profile</button><button type="button" className="btn" onClick={saveTemplate}>Save {subject} to library</button></div>
    {status && <p role="status" className="hint">{status}</p>}
    {workspace && <CharacterWorkspace key={workspace} node={node} graph={sourceGraph} project={game} characterRef={characterReference(scope, node.id)} initialView={workspace} onClose={() => setWorkspace(null)} onPatch={onPatch} onProfilePatch={patchProfile} onDescription={writeDescription} onReviewDescription={reviewDescription} onPassage={editPassage} onResolve={resolvePassage} />}
  </section>;
}
