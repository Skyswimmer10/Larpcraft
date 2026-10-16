import React, { useState } from 'react';
import { PLAYER_TYPE_GROUPS, PLAYER_TYPE_REFERENCES } from '../data/playerTypes.js';
import './PlayerTypes.css';

export default function PlayerTypes({ players, player, onPick, onUpdate }) {
  const [query, setQuery] = useState('');
  const [model, setModel] = useState('all');
  const assigned = player?.playerTypeIds || [];
  const toggle = id => onUpdate(player.id, { playerTypeIds: assigned.includes(id) ? assigned.filter(value => value !== id) : [...assigned, id] });
  const q = query.trim().toLowerCase();
  const groups = PLAYER_TYPE_GROUPS.filter(group => model === 'all' || model === group.id).map(group => ({ ...group, types: group.types.filter(type => `${type.name} ${type.focus} ${type.description} ${type.design}`.toLowerCase().includes(q)) }));
  return <div className="player-types-page">
    <p className="dim">Use these as motivations for game design, not fixed personality labels. A player can have several types, and their preferences can change with the game and session.</p>
    <div className="player-types-controls">
      <label>Search types<input className="field-input" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Discovery, creativity, competition…" /></label>
      <label>Model<select className="field-input" value={model} onChange={e => setModel(e.target.value)}><option value="all">All models</option>{PLAYER_TYPE_GROUPS.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>
      <label>Assign to player<select className="field-input" value={player?.id || ''} onChange={e => onPick(e.target.value)} disabled={!players.length}><option value="" disabled>Select a player</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    </div>
    {player ? <p className="dim">Selected for <b>{player.name}</b>: {assigned.length} types. Select any combination; no percentages or ranking are implied.</p> : <p className="dim">Browse freely. Create a player in Player Profiles to assign types.</p>}
    {groups.map(group => group.types.length > 0 && <section key={group.id} className={`player-type-group ${group.id}`}><h3>{group.name}</h3><p className="dim">{group.note}</p><div className="player-type-grid">{group.types.map(type => <article className={`player-type-card${assigned.includes(type.id) ? ' selected' : ''}`} key={type.id}>
      <header><h4>{type.name}</h4><span>{type.focus}</span></header><p>{type.description}</p>
      <div className="player-type-prompt"><b>Design question</b><p>{type.question}</p></div><div><b>Ideas for your game</b><p>{type.design}</p></div>
      {player && <label className="player-type-check"><input type="checkbox" checked={assigned.includes(type.id)} onChange={() => toggle(type.id)} /> Assign {type.name}</label>}
    </article>)}</div></section>)}
    {!groups.some(group => group.types.length) && <div className="empty">No player types match your search.</div>}
    <details className="player-types-reference"><summary>Further models and custom personas from your material</summary><p>The following models were named without full type descriptions. They are reference lists, not assignable profiles yet.</p>{PLAYER_TYPE_REFERENCES.map(([title, names]) => <p key={title}><b>{title}</b><br />{names}</p>)}<p><b>Game-specific personas · Family Tree example</b><br />Arborists aim to complete the game and grow the tree; Conciliators guide negotiations; Butterflies enjoy spending time together. The excerpt also discusses a self-interested “Parasite” persona as a behaviour designers may choose not to reward.</p><p className="dim">Summarised from your pasted material. Game-design ideas on the cards are Larpcraft adaptations. Example percentages in the excerpt are not used as player scores or population benchmarks.</p></details>
  </div>;
}
