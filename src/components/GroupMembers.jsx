import React, { useId, useState } from 'react';
import { groupEntities, resolveGroupRef } from '../lib/groupFoundations.js';

export default function GroupMembers({ facts, game, ownerRef, onChange }) {
  const [name, setName] = useState(''), [chosen, setChosen] = useState(''), [list, setList] = useState('members');
  const [role, setRole] = useState(''), [relation, setRelation] = useState('Allied with');
  const options = groupEntities(game).filter(entity => !(entity.ref.coll === ownerRef?.coll && JSON.stringify(entity.ref.path) === JSON.stringify(ownerRef.path))
    && (list === 'members' || entity.type === 'group') && !(facts[list] || []).some(row => row.ref?.coll === entity.ref.coll && JSON.stringify(row.ref.path) === JSON.stringify(entity.ref.path)));
  const uid = useId();
  const add = () => {
    const entity = options.find(row => row.key === chosen);
    const label = entity?.name || name.trim();
    if (!label) return;
    const rows = facts[list] || [];
    if (entity && rows.some(row => JSON.stringify(row.ref) === JSON.stringify(entity.ref))) return;
    onChange({ ...facts, [list]: [...rows, { id: crypto.randomUUID(), name: label, ref: entity?.ref || null,
      ...(list === 'members' ? { role: role.trim(), loyalty: '' } : { type: relation }) }] });
    setName(''); setChosen(''); setRole('');
  };
  const edit = (collection, id, patch) => onChange({ ...facts, [collection]: facts[collection].map(row => row.id === id ? { ...row, ...patch } : row) });
  return <section className="group-members" aria-label="Members and group relationships">
    <p className="nw-help">Members stay linked to their own profiles. Names without profiles are welcome. Roles and loyalties apply within this group.</p>
    {['members', 'relationships'].map(collection => <section key={collection}><h4>{collection === 'members' ? 'Members and subgroups' : 'Relations with other groups'}</h4>
      {!(facts[collection] || []).length && <p className="hint">None recorded yet.</p>}
      {(facts[collection] || []).map(row => {
        const live = resolveGroupRef(game, row.ref), label = live?.title || live?.name || row.name;
        return <fieldset className="group-member-card" key={row.id}><legend>{label}</legend>
          {row.ref ? <><small>{live ? 'Linked profile' : 'Profile unavailable · saved name retained'}</small><button type="button" className="linkbtn" onClick={() => edit(collection, row.id, { ref: null, name: label })}>Keep as a name only</button></>
            : <label className="nw-field">Name<input className="field-input" value={row.name} onChange={e => edit(collection, row.id, { name: e.target.value })} /></label>}
          {collection === 'members' ? <div className="group-two-fields"><label className="nw-field">Role in this group<input className="field-input" placeholder="Leader, mediator, newcomer…" value={row.role || ''} onChange={e => edit(collection, row.id, { role: e.target.value })} /></label><label className="nw-field">Loyalty or allegiance · optional<input className="field-input" value={row.loyalty || ''} onChange={e => edit(collection, row.id, { loyalty: e.target.value })} /></label></div>
            : <label className="nw-field">Relationship<input className="field-input" value={row.type || ''} onChange={e => edit(collection, row.id, { type: e.target.value })} /></label>}
          <button type="button" className="linkbtn" onClick={() => onChange({ ...facts, [collection]: facts[collection].filter(other => other.id !== row.id) })}>Remove {collection === 'members' ? 'member' : 'relationship'}</button>
        </fieldset>;
      })}
    </section>)}
    <fieldset className="group-add-member"><legend>Add a member or relationship</legend>
      <div className="nw-choices">{[['members', 'Member / subgroup'], ['relationships', 'Group relationship']].map(([key, label]) => <button type="button" className="btn" aria-pressed={list === key} key={key} onClick={() => { setList(key); setChosen(''); setName(''); }}>{label}</button>)}</div>
      <label className="nw-field">Choose an existing profile<select className="field-input" value={chosen} onChange={e => { setChosen(e.target.value); setName(''); }}><option value="">Enter a name instead…</option>{options.map(entity => <option key={entity.key} value={entity.key}>{entity.name} · {entity.type} · {entity.ref.path.join(' / ')}</option>)}</select></label>
      {!chosen && <label className="nw-field">Name without a profile<input className="field-input" value={name} onChange={e => setName(e.target.value)} /></label>}
      {list === 'members' ? <label className="nw-field">Role · optional<input className="field-input" value={role} onChange={e => setRole(e.target.value)} /></label> : <label className="nw-field">Relationship<input className="field-input" list={uid} value={relation} onChange={e => setRelation(e.target.value)} /><datalist id={uid}>{['Allied with', 'Rival of', 'Part of', 'Contains', 'Owes duty to', 'Trades with'].map(value => <option value={value} key={value} />)}</datalist></label>}
      <button type="button" className="btn" disabled={!chosen && !name.trim()} onClick={add}>Add {list === 'members' ? 'member' : 'relationship'}</button>
    </fieldset>
  </section>;
}
