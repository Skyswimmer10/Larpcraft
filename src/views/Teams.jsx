import React, { useRef, useState } from 'react';
import { useGame, useDispatch } from '../state/store.jsx';
import { playersOfTeam, itemsAssignedToPlayer, itemsAssignedToTeam, availableItems, sensorsAssignedToPlayer } from '../state/reducer.js';
import { Pill, ENTITY_COLORS } from '../components/bits.jsx';
import CsvButtons from '../components/CsvButtons.jsx';
import { CSV_SCHEMAS, genId } from '../data/csvSchemas.js';

const TEAM_COLORS = ['#5CA8F5', '#E0A23C', '#A87BF0', '#43BF87', '#E86464', '#3EC6D6'];
const MAX_LOGO_BYTES = 8 * 1024 * 1024;

function PlayerAvatar({ player, team }) {
  if (player.image?.dataUrl) return <img className="playeravatar" src={player.image.dataUrl} alt="" />;
  return <span className="av" style={{ background: team.color }}>{player.initials}</span>;
}

function TeamLogo({ team, dispatch }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const initial = team.name.split(' ').pop()?.[0] || '?';

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Use an image file.'); return; }
    if (file.size > MAX_LOGO_BYTES) { setError('Logo image must be under 8 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      dispatch({ type: 'SET_IMAGE', coll: 'teams', id: team.id, image: { kind: 'photo', name: file.name, dataUrl: reader.result } });
    };
    reader.onerror = () => setError('Could not read logo image.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="teamlogo-wrap">
      <button className="teamlogo" onClick={() => inputRef.current?.click()} title={team.image ? 'Replace team logo' : 'Add team logo'}>
        {team.image?.dataUrl
          ? <img src={team.image.dataUrl} alt="" />
          : <span style={{ background: team.color }}>{initial}</span>}
      </button>
      <input ref={inputRef} hidden type="file" accept="image/*"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="teamlogo-actions">
        <button className="linkbtn" onClick={() => inputRef.current?.click()}>{team.image ? 'Replace logo' : 'Add logo'}</button>
        {team.image && <button className="linkbtn" onClick={() => dispatch({ type: 'SET_IMAGE', coll: 'teams', id: team.id, image: null })}>Remove</button>}
      </div>
      {error && <small className="bad">{error}</small>}
    </div>
  );
}

// Teams & Rosters: issue physical items and sensor hardware to player roles.
// Assigning dispatches ASSIGN_ITEM, which also flips the item to 'in-use' in
// the Item Database — one state, every view updates.
export default function Teams({ selection, onSelect }) {
  const s = useGame();
  const dispatch = useDispatch();
  const freeItems = availableItems(s);
  const freeSensors = Object.values(s.sensors).filter((x) => !x.assignedTo);

  const addPlayer = (teamId) => {
    const id = CSV_SCHEMAS.players.newId(s);
    dispatch({ type: 'ADD_ENTITY', coll: 'players', entity: { ...CSV_SCHEMAS.players.blank(id), teamId } });
    onSelect({ kind: 'player', id });
  };
  const addTeam = () => {
    const id = genId(s.teams, 'T-N-');
    const color = TEAM_COLORS[Object.keys(s.teams).length % TEAM_COLORS.length];
    dispatch({ type: 'ADD_ENTITY', coll: 'teams', entity: { id, name: 'New team', color, focus: '', image: null } });
  };

  return (
    <div className="main">
      <div className="mhead">
        <div>
          <div className="crumb">Operation Chimera / <b>Players &amp; Teams</b></div>
          <h2>Teams &amp; Rosters</h2>
        </div>
        <div className="right">
          <CsvButtons coll="players" />
          <button className="btn primary" onClick={addTeam}>+ New team</button>
        </div>
      </div>

      <div className="teamgrid">
        {Object.values(s.teams).map((team) => {
          const roster = playersOfTeam(s, team.id);
          const teamKit = itemsAssignedToTeam(s, team.id);
          return (
            <div className="team" key={team.id}>
              <div className="th">
                <TeamLogo team={team} dispatch={dispatch} />
                <div><b>{team.name}</b><small>{team.focus}</small></div>
                <span className="kitcount mono">{teamKit.length} items issued</span>
                <button className="btn ghost small" onClick={() => addPlayer(team.id)}>+ Add player</button>
              </div>

              <div className="roster">
                {roster.map((p) => {
                  const kit = itemsAssignedToPlayer(s, p.id);
                  const hw = sensorsAssignedToPlayer(s, p.id);
                  return (
                    <div className="pl" key={p.id}>
                      <button className="plmain" onClick={() => onSelect({ kind: 'player', id: p.id })}>
                        <PlayerAvatar player={p} team={team} />
                        <b>{p.name}</b>
                        {p.flags.map((f) => <span key={f} className={`flag ${f.toLowerCase()}`}>{f}</span>)}
                        <span className="role">{p.role}</span>
                      </button>
                      <div className="kit">
                        {kit.map((i) => (
                          <span className="kitem" key={i.id}>
                            <span className="sq" style={{ background: ENTITY_COLORS.item }} />
                            {i.name} <Pill availability={i.availability} />
                            <button className="x" onClick={() => dispatch({ type: 'UNASSIGN_ITEM', itemId: i.id })} aria-label={`Return ${i.name}`}>×</button>
                          </span>
                        ))}
                        {hw.map((x) => (
                          <span className="kitem" key={x.id}>
                            <span className="sq" style={{ background: ENTITY_COLORS.sensor }} />
                            {x.id} · {x.kind}
                            <button className="x" onClick={() => dispatch({ type: 'ASSIGN_SENSOR', sensorId: x.id, playerId: null })} aria-label={`Return ${x.id}`}>×</button>
                          </span>
                        ))}
                        <select className="chip-add" value="" onChange={(e) => {
                          const v = e.target.value;
                          if (!v) return;
                          if (v.startsWith('item:')) dispatch({ type: 'ASSIGN_ITEM', itemId: v.slice(5), teamId: team.id, playerId: p.id });
                          else dispatch({ type: 'ASSIGN_SENSOR', sensorId: v.slice(7), playerId: p.id });
                        }}>
                          <option value="">+ issue…</option>
                          {freeItems.length > 0 && <optgroup label="Items (ready)">
                            {freeItems.map((i) => <option key={i.id} value={`item:${i.id}`}>{i.name} · {i.id}</option>)}
                          </optgroup>}
                          {freeSensors.length > 0 && <optgroup label="Sensor hardware">
                            {freeSensors.map((x) => <option key={x.id} value={`sensor:${x.id}`}>{x.id} — {x.kind}</option>)}
                          </optgroup>}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="statusbar"><span>Issuing an item sets it to <b>In use</b> in the Item Database; returning it sets <b>Ready</b>.</span></div>
    </div>
  );
}
