import React, { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { characterSources } from '../lib/characterProfile.js';
import { characterFactsText } from '../lib/characterFacts.js';
import { characterAttributeChips, characterAttributesText } from '../lib/characterAttributes.js';
import './CharacterAttributes.css';
import CharacterMediaGallery from './CharacterMediaGallery.jsx';
import { groupProfileFactsText } from '../lib/groupFoundations.js';
import NarrativeSourceSymbol from './NarrativeSourceSymbol.jsx';
import { PrimIcon } from './bits.jsx';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import './CharacterNode.css';

export function characterNodeSources(node, graph) {
  const unique = new Map();
  const add = (source, type, label) => {
    const key = `${type}:${source.conceptId || source.id || label}`;
    if (!unique.has(key)) unique.set(key, { key, source, type, label });
  };
  for (const row of characterSources(node, graph)) {
    if (!row.enabled) continue;
    const records = row.record ? [row.record] : row.records || [];
    if (records.length) {
      for (const record of records) add({ ...record.sourceSnapshot, id: record.sourceId, name: record.sourceLabel || record.sourceSnapshot?.name }, record.sourceType || 'concept', record.sourceLabel || record.sourceId);
    } else {
      const source = graph?.nodes?.[row.nodeId];
      const type = row.frameworkId ? 'framework' : 'concept';
      add(type === 'framework' ? { id: row.frameworkId } : source || { id: row.nodeId, name: row.label }, type, row.frameworkId || row.label);
    }
  }
  return [...unique.values()];
}

const stop = event => event.stopPropagation();
const InputWizard = lazy(() => import('./NarrativeWizard.jsx'));
const entityKind = node => ({ group: 'Group', item: 'Story item', storyLocation: 'Story location' }[node.kind] || 'Character');
export const usesNarrativeEntityCard = node => ['character', 'group'].includes(node.kind) || (!node.mechKind && ['item', 'storyLocation'].includes(node.kind));

export function characterQuickEditInputs(node, graph = {}) {
  const inputs = [];
  for (const row of characterSources(node, graph)) {
    const records = row.record ? [row.record] : row.records || [];
    for (const record of records) inputs.push({
      key: `${row.key}:${record.sessionId || record.sourceId}`, label: record.sourceLabel || record.sourceId,
      type: record.sourceType || 'concept', source: { ...record.sourceSnapshot, id: record.sourceId, name: record.sourceLabel || record.sourceSnapshot?.name },
      detail: record.title || row.label, enabled: row.enabled, editable: !!row.record || !row.missing,
      linked: !!row.nodeId && !row.missing,
      wizard: { resumeNode: row.record ? node : graph.nodes?.[row.nodeId], resumeRecord: record },
    });
    if (!records.length) {
      const live = graph.nodes?.[row.nodeId], type = row.frameworkId ? 'framework' : 'concept';
      const source = row.frameworkId ? FRAMEWORK_TYPES[row.frameworkId] : live;
      inputs.push({ key: row.key, label: source?.label || source?.name || source?.title || row.sourceLabel, type,
        source: source || { id: row.nodeId, name: row.label }, detail: 'Develop this input', enabled: row.enabled, editable: !!source,
        wizard: { initialSource: source, initialType: type, initialTargetId: node.id },
      });
    }
  }
  return inputs.map(input => {
    const same = inputs.filter(other => other.type === input.type && other.source.id === input.source.id);
    return same.length > 1 ? { ...input, detail: `${input.detail} · use ${same.indexOf(input) + 1} of ${same.length}` } : input;
  });
}

export function CharacterDescriptionInputs({ inputs, onEdit, kind = 'Character' }) {
  if (!inputs.length) return null;
  return <section className="character-description-inputs" aria-label={`${kind} frameworks and concepts`}><h3>Frameworks & concepts</h3>{inputs.map(input => <button type="button" key={input.key} className={`character-description-input ${input.type}`} disabled={!onEdit || !input.editable} aria-haspopup="dialog" onClick={() => onEdit(input)}>
    <NarrativeSourceSymbol source={input.source} type={input.type} /><span><b>{input.label}</b><small>{input.detail}</small>{!input.enabled && <small>Excluded from description</small>}{input.linked && <small>Linked input · edits update its source</small>}{!input.editable && <small>Saved reference · recover in the inspector</small>}</span>
  </button>)}</section>;
}

export default function CharacterNode({ node, graph, scope }) {
  const kind = entityKind(node);
  const [open, setOpen] = useState(false), [editing, setEditing] = useState(null);
  const sources = characterNodeSources(node, graph);
  const attributes = characterAttributeChips(node);
  if (node.kind === 'item') attributes.push({ label: 'Build status', value: node.buildStatus || 'concept' });
  const scaledPortrait = !!node.image?.dataUrl;
  const descriptionButton = <button type="button" className="btn small" aria-label={`Description of ${node.title || node.name || 'character'}`} aria-haspopup="dialog" onClick={() => setOpen(true)}>Description</button>;
  return <div className={`character-node-card${scaledPortrait ? ' has-portrait character-node-portrait-fill' : ''}${scaledPortrait && sources.length ? ' has-source-rail' : ''}`} style={scaledPortrait && !Number(node.h) ? { minHeight: 160 } : undefined} onPointerDown={stop} onClick={stop} onDoubleClick={stop} onKeyDown={stop}>
    <div className="character-node-visuals">
      <div className="character-node-portrait-column">
        {descriptionButton}
        {scaledPortrait && <img className="character-node-portrait-thumb" src={node.image.dataUrl} alt={`${kind === 'Character' ? 'Portrait' : 'Image'} of ${node.title || node.name || 'the ' + kind.toLowerCase()}`} draggable={false} />}
      </div>
      {sources.length > 0 && <div className="character-node-symbols" aria-label="Frameworks and concepts" onWheel={stop}>{sources.map(({ key, source, type, label }) => <span key={key} className={`character-node-source ${type}`} role="img" aria-label={label} title={label}><NarrativeSourceSymbol source={source} type={type} /></span>)}</div>}
    </div>
    {attributes.length > 0 && <div className="character-node-attribute-chips" aria-label="Quick character attributes">{attributes.slice(0, 3).map(row => <span key={row.value} title={`${row.label}: ${row.value}`}>{row.value}</span>)}{attributes.length > 3 && <span title={attributes.slice(3).map(row => `${row.label}: ${row.value}`).join('\n')}>+{attributes.length - 3}</span>}</div>}
    {open && <CharacterDescription node={node} graph={graph} onEdit={scope ? setEditing : undefined} onClose={() => { setEditing(null); setOpen(false); }} />}
    {editing && <Suspense fallback={<span role="status">Opening saved input…</span>}><InputWizard key={editing.key} {...editing.wizard} gameScope={scope} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} /></Suspense>}
  </div>;
}

export function CharacterDescription({ node, graph, onClose, onEdit }) {
  const kind = entityKind(node);
  const dialog = useRef(null), titleId = useId();
  const name = String(node.name || '').trim(), title = String(node.title || '').trim();
  const identity = name && title && name !== title ? `Name: ${name}\nTitle: ${title}` : name || title ? `Name / title: ${name || title}` : '';
  const entityFacts = kind === 'Group' ? groupProfileFactsText(node) : kind === 'Character' ? characterFactsText(node, graph)
    : (node.kind === 'item' ? [['Base type', node.baseType || node.itemType], ['Origin', node.origin], ['Gameplay meaning', node.gameplayMeaning || node.mechanicMeaning]] : [])
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim()).map(([label, value]) => `${label}: ${value}`).join('\n');
  const facts = [identity, entityFacts].filter(Boolean).join('\n');
  const description = node.kind === 'item' ? node.playerLore ?? node.playerDescription ?? node.description ?? node.body : node.description || node.body;
  const completeLore = node.kind === 'item' && (node.completeLore || node.facilitatorDescription);
  const inputs = characterQuickEditInputs(node, graph);
  const attributes = characterAttributesText(node);
  useEffect(() => {
    const previous = document.activeElement, element = dialog.current;
    element.showModal();
    return () => { element.close(); previous?.focus?.(); };
  }, []);
  return createPortal(<dialog ref={dialog} className="character-node-description" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onPointerDown={stop} onClick={stop} onDoubleClick={stop} onKeyDown={stop} onWheel={stop}>
    <header><h2 id={titleId}>{node.title || node.name || kind} · Description</h2><button type="button" className="btn" onClick={onClose}>Close</button></header>
    <div className="character-node-description-layout">
      <aside className="character-node-description-sidebar">
        <section className="character-node-portrait" aria-label={kind === 'Character' ? 'Character portrait' : `${kind} image`}><h3>{kind === 'Character' ? 'Portrait' : `${kind} image`}</h3><div className="character-node-portrait-frame">
          {node.image?.dataUrl ? <img src={node.image.dataUrl} alt={`${kind === 'Character' ? 'Portrait' : 'Image'} of ${name || title || kind.toLowerCase()}`} />
            : <div className="character-node-portrait-placeholder"><PrimIcon icon={{ Group: 'users', 'Story item': 'box', 'Story location': 'pin' }[kind] || 'user'} size={72} /><b>{kind === 'Character' ? 'Character portrait' : `${kind} image`}</b><span>Space reserved for a photo or illustration</span></div>}
        </div></section>
        {facts && <section className="character-node-description-facts" aria-label={`${kind} details`}><h3>{kind} details</h3><div>{facts}</div></section>}
        {kind === 'Character' && (!!node.mediaGallery?.length || !!node.researchIds?.length) && <CharacterMediaGallery node={node} />}
        <CharacterDescriptionInputs inputs={inputs} onEdit={onEdit} kind={kind} />
      </aside>
      <section className="character-node-description-main" aria-label="Full description">{attributes && <section aria-label="Quick attributes"><h3>Quick attributes</h3><p className="character-attributes-readout">{attributes}</p></section>}<h3>{node.kind === 'item' ? 'Player lore' : 'Full description'}</h3><div className="character-node-description-text">{description || (attributes ? 'Defined by the quick attributes above. A longer description is optional.' : `No description yet. Add details through the ${kind.toLowerCase()} inspector or its frameworks and concepts.`)}</div>{completeLore && <section className="character-node-complete-lore"><h3>Complete lore · facilitator</h3><div className="character-node-description-text">{completeLore}</div></section>}</section>
    </div>
  </dialog>, document.body);
}
