import React, { useEffect, useState } from 'react';
import { useGame } from '../state/store.jsx';
import { locateGraph } from '../state/reducer.js';
import { groupFacts, GROUP_KINDS, GROUP_FOUNDATIONS_ID } from '../lib/groupFoundations.js';
import { enableCharacterProfile, syncCharacterProfile, characterWizardRecords } from '../lib/characterProfile.js';
import { GroupWizardButton } from './GroupWizard.jsx';
import CharacterProfile from './CharacterProfile.jsx';
import CharacterAttributes from './CharacterAttributes.jsx';
import { CharacterImage } from './CharacterFacts.jsx';
import './GroupProfile.css';

function CompactField({ label, value, onCommit, list }) {
  const [draft, setDraft] = useState(value || '');
  useEffect(() => setDraft(value || ''), [value]);
  return <label className="nw-field">{label}<input className="field-input" value={draft} list={list} onChange={e => setDraft(e.target.value)} onBlur={() => { if (draft !== value) onCommit(draft); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} /></label>;
}

export default function GroupPanel({ node, scope = { coll: 'nodes' }, onPatch }) {
  const game = useGame(), facts = groupFacts(node), graph = locateGraph(game, scope);
  const patch = fields => {
    const next = syncCharacterProfile(enableCharacterProfile({ ...node, ...fields }), graph);
    onPatch({ ...fields, characterProfile: next.characterProfile, body: next.body, description: next.description, ...(next.sub ? { sub: next.sub } : {}) });
  };
  const kindList = 'group-kinds-' + encodeURIComponent(node.id);
  const hasFoundations = characterWizardRecords(node).some(record => record.sourceId === GROUP_FOUNDATIONS_ID);
  return <>
    <section className="group-panel" aria-label="Group profile">
      <CharacterImage node={node} kind="Group" onChange={image => patch({ image, ...(image && Number(node.h || 170) < 280 ? { h: 280 } : {}) })} />
      <CompactField label="Group name" value={node.title || ''} onCommit={title => patch({ title, name: title })} />
      <CompactField label="Kind of group" value={facts.kind} list={kindList} onCommit={kind => patch({ groupFacts: { ...facts, kind } })} />
      <datalist id={kindList}>{GROUP_KINDS.map(kind => <option value={kind} key={kind} />)}</datalist>
      <CompactField label="Approximate size" value={facts.size} onCommit={size => patch({ groupFacts: { ...facts, size } })} />
      <CompactField label="Brief shared purpose" value={facts.purpose} onCommit={purpose => patch({ groupFacts: { ...facts, purpose } })} />
      <div className="cp-actions">{!hasFoundations && <GroupWizardButton node={node} scope={scope} label="Group Foundations" className="btn" />}<GroupWizardButton node={node} scope={scope} startStep="members" label={`Members & relationships (${facts.members.length})`} /></div>
      <p className="hint">Double-click this group to open its inputs and member links.</p>
    </section>
    <CharacterAttributes node={node} onPatch={onPatch} />
    <CharacterProfile node={node} scope={scope} onPatch={onPatch} />
  </>;
}
