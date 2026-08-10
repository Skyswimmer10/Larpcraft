import React, { useMemo, useState } from 'react';
import { useGame, useDispatch } from '../state/store.jsx';
import CsvButtons from '../components/CsvButtons.jsx';
import { CSV_SCHEMAS } from '../data/csvSchemas.js';

const PROFILE_FIELDS = [
  { key: 'personality', label: 'Personality / social style', placeholder: 'Calm organizer, high-energy explorer, quiet observer, comic relief...' },
  { key: 'experience', label: 'Adventure / LARP experience', placeholder: 'First-timer, escape room veteran, scout background, experienced roleplayer...' },
  { key: 'strengths', label: 'Strong sides', placeholder: 'Fast thinker, map reader, physically confident, cooperative, good under pressure...' },
  { key: 'weaknesses', label: 'Weak sides / support needs', placeholder: 'Gets overwhelmed by time pressure, dislikes darkness, slower runner, needs clearer instructions...' },
  { key: 'motivation', label: 'Motivation hooks', placeholder: 'Likes mystery, competition, teamwork, acting, tactical puzzles, physical challenges...' },
  { key: 'communicationStyle', label: 'Communication style', placeholder: 'Direct leader, asks questions, needs space to think, translates chaos into plans...' },
  { key: 'preferredRole', label: 'Likely team role', placeholder: 'Navigator, negotiator, decoder, scout, safety-aware anchor, morale keeper...' },
  { key: 'comfortNotes', label: 'Comfort and boundaries', placeholder: 'Outdoor comfort, darkness, noise, crawling, close contact, solo moments...' },
  { key: 'safetyNotes', label: 'Safety / accessibility notes', placeholder: 'Medical notes, mobility limits, allergies, emergency contact context, crew reminders...' },
  { key: 'observerNotes', label: 'Crew observation notes', placeholder: 'What to watch during the game: leadership emergence, stress response, group fit...' },
];

const GAME_RECORD_FIELDS = [
  { key: 'previousGames', label: 'Previous games / events', placeholder: 'List past games, dates, characters, team roles, or formats they have played.' },
  { key: 'totalPoints', label: 'Total points', textarea: false, inputType: 'number', placeholder: '0' },
  { key: 'stagePoints', label: 'Stage-by-stage points', placeholder: 'Stage 1: 12 points; Stage 2: 18 points; finale bonus: 5...' },
  { key: 'achievements', label: 'Achievements / badges', placeholder: 'First decode, perfect stealth route, team rescue, best roleplay moment...' },
  { key: 'accomplishments', label: 'Notable accomplishments', placeholder: 'Solved key puzzle, kept team calm, found hidden route, negotiated with NPC...' },
  { key: 'performanceNotes', label: 'Game performance notes', placeholder: 'How they performed across pressure, puzzles, movement, communication, and leadership.' },
  { key: 'stageHistory', label: 'Multi-stage history', placeholder: 'Track how they changed across stages: early caution, mid-game leadership, finale confidence...' },
  { key: 'gmRewards', label: 'GM awards / rewards owed', placeholder: 'Bonus clue earned, title granted, in-game item reward, public recognition...' },
];

const initialsFrom = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

function PlayerAvatar({ player, team, big = false }) {
  if (player?.image?.dataUrl) {
    return <img className={`playeravatar${big ? ' big' : ''}`} src={player.image.dataUrl} alt="" />;
  }
  return <span className={`av${big ? ' big' : ''}`} style={{ background: team?.color || '#8B92A6' }}>{player.initials || initialsFrom(player.name)}</span>;
}

function Field({ label, value, placeholder, textarea = true, inputType = 'text', onCommit }) {
  return (
    <label className="playerfield">
      <span>{label}</span>
      {textarea ? (
        <textarea className="field-input" defaultValue={value || ''} placeholder={placeholder} rows={3}
          onBlur={(e) => onCommit(e.target.value)} />
      ) : (
        <input className="field-input" type={inputType} defaultValue={value ?? ''} placeholder={placeholder}
          onBlur={(e) => onCommit(inputType === 'number' ? Math.max(0, parseInt(e.target.value, 10) || 0) : e.target.value)} />
      )}
    </label>
  );
}

export default function Players({ selection, onSelect }) {
  const s = useGame();
  const dispatch = useDispatch();
  const players = useMemo(() => Object.values(s.players || {}).sort((a, b) => (s.teams[a.teamId]?.name || '').localeCompare(s.teams[b.teamId]?.name || '') || a.name.localeCompare(b.name)), [s.players, s.teams]);
  const [localId, setLocalId] = useState(players[0]?.id ?? null);
  const [tab, setTab] = useState('profile');
  const selectedId = selection?.kind === 'player' && s.players[selection.id] ? selection.id : localId;
  const player = selectedId ? s.players[selectedId] : players[0];
  const team = player ? s.teams[player.teamId] : null;

  const pick = (id) => {
    setLocalId(id);
    onSelect({ kind: 'player', id });
  };
  const update = (id, patch) => dispatch({ type: 'UPDATE_ENTITY', coll: 'players', id, patch });
  const addPlayer = () => {
    const id = CSV_SCHEMAS.players.newId(s);
    const firstTeam = Object.keys(s.teams || {})[0] ?? null;
    dispatch({ type: 'ADD_ENTITY', coll: 'players', entity: { ...CSV_SCHEMAS.players.blank(id), teamId: firstTeam } });
    pick(id);
  };

  return (
    <div className="main">
      <div className="mhead">
        <div>
          <div className="crumb">{s.meta.name} / <b>Players</b></div>
          <h2>Player Profiles</h2>
        </div>
        <div className="right">
          <CsvButtons coll="players" />
          <button className="btn primary" onClick={addPlayer}>+ New player</button>
        </div>
      </div>

      <div className="playersplit">
        <div className="playerlist">
          {players.map((p) => {
            const t = s.teams[p.teamId];
            return (
              <button key={p.id} className={`playerrow${player?.id === p.id ? ' on' : ''}`} onClick={() => pick(p.id)}>
                <PlayerAvatar player={p} team={t} />
                <span><b>{p.nickname ? `${p.name} "${p.nickname}"` : p.name}</b><small>{t?.name || 'No team'} · {p.role || 'Player'}</small></span>
              </button>
            );
          })}
          {players.length === 0 && <div className="empty mini">No players yet.</div>}
        </div>

        <div className="playerprofile" key={player?.id || 'empty'}>
          {player ? (
            <>
              <div className="profilehead">
                <PlayerAvatar player={player} team={team} big />
                <div className="profileidentity">
                  <b>{player.name}</b>
                  <small>{player.nickname ? `"${player.nickname}" · ` : ''}{team?.name || 'No team'} · {player.id}</small>
                  <div className="formgrid two profilecore">
                    <Field textarea={false} label="Name" value={player.name} onCommit={(v) => update(player.id, { name: v, initials: initialsFrom(v) })} />
                    <Field textarea={false} label="Nickname" value={player.nickname} placeholder="In-game, earned, or preferred nickname..." onCommit={(v) => update(player.id, { nickname: v })} />
                    <Field textarea={false} label="Role" value={player.role} placeholder="Leader, medic, decoder, scout..." onCommit={(v) => update(player.id, { role: v })} />
                    <label>
                      <span>Team</span>
                      <select className="field-input" value={player.teamId || ''} onChange={(e) => update(player.id, { teamId: e.target.value || null })}>
                        <option value="">No team</option>
                        {Object.values(s.teams || {}).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </label>
                    <Field textarea={false} label="Flags" value={(player.flags || []).join(', ')} placeholder="MED, NEW, VIP..."
                      onCommit={(v) => update(player.id, { flags: v.split(',').map((x) => x.trim()).filter(Boolean) })} />
                  </div>
                </div>
              </div>
              <div className="playertabs">
                <button className={tab === 'profile' ? 'on' : ''} onClick={() => setTab('profile')}>Profile</button>
                <button className={tab === 'record' ? 'on' : ''} onClick={() => setTab('record')}>Game Record</button>
              </div>
              <div className="playerfields">
                {(tab === 'profile' ? PROFILE_FIELDS : GAME_RECORD_FIELDS).map((field) => (
                  <Field key={field.key} label={field.label} value={player[field.key]} placeholder={field.placeholder}
                    textarea={field.textarea !== false} inputType={field.inputType || 'text'}
                    onCommit={(v) => update(player.id, { [field.key]: v })} />
                ))}
              </div>
            </>
          ) : (
            <div className="emptyview">
              <h3>No player selected</h3>
              <p>Create a player or select one from the roster to build a fuller participant profile.</p>
            </div>
          )}
        </div>
      </div>
      <div className="statusbar"><span>Use this page for participant understanding; team rosters and kit issuing stay on the Teams page.</span></div>
    </div>
  );
}
