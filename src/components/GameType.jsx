import React from 'react';
import { GAME_TYPE_QUESTIONS, gameTypeSummary } from '../data/gameTypes.js';
import './GameType.css';

export function GameTypePreview({ node }) {
  const rows = gameTypeSummary(node);
  return <div className="game-type-preview">
    <small>{node.gameType?.scope === 'game' ? 'Whole game' : 'Activity'}</small>
    {rows.length ? rows.map(row => <div key={row.key} title={row.label}>{row.text}</div>) : <span className="dim">Choose how this game or activity works in the inspector.</span>}
  </div>;
}

export function GameTypeFields({ node, onPatch }) {
  const settings = node.gameType || {};
  const change = (key, value) => onPatch({ gameType: { ...settings, [key]: value } });
  const note = (key, label, placeholder) => <label className="game-type-field"><span>{label}</span><textarea className="field-input" key={`${node.id}-${key}`} defaultValue={settings[key] || ''} rows={3} placeholder={placeholder} onBlur={e => { if (e.target.value !== (settings[key] || '')) change(key, e.target.value); }} /></label>;
  return <div className="isect game-type-fields">
    <label className="game-type-field"><span>Applies to</span><select className="field-input" value={settings.scope || 'activity'} onChange={e => change('scope', e.target.value)}><option value="activity">This activity</option><option value="game">The whole game</option></select></label>
    <p className="hint">Describe this activity or the whole game. Other activities can have their own Game Type.</p>
    {GAME_TYPE_QUESTIONS.map(question => <React.Fragment key={question.key}>
      <label className="game-type-field"><span>{question.label}</span><select className="field-input" value={settings[question.key] || ''} onChange={e => change(question.key, e.target.value)}><option value="">Choose…</option>{question.options.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      {question.key === 'relationship' && settings.relationship === 'semiCooperative' && <>
        {note('sharedGoal', 'What is the shared goal?', 'What do players need to achieve together?')}
        {note('personalGoals', 'What are the personal goals?', 'Where might their interests conflict?')}
      </>}
      {question.key === 'outcome' && settings.outcome === 'custom' && note('customOutcome', 'Describe the outcome', 'Explain who can win or lose, and how.')}
      {question.key === 'roles' && <div className="game-type-checks">
        <label><input type="checkbox" checked={!!settings.hiddenRoles} onChange={e => change('hiddenRoles', e.target.checked)} /> Hidden roles</label>
        <label><input type="checkbox" checked={!!settings.traitor} onChange={e => change('traitor', e.target.checked)} /> Hidden traitor</label>
      </div>}
      {question.key === 'betweenTries' && <>
        {settings.betweenTries === 'reset' && <p className="hint">Multiple tries are possible. Everything for this game or activity resets between tries.</p>}
        {settings.betweenTries === 'oneTry' && <p className="hint">This player or team gets one try.</p>}
        {settings.betweenTries === 'carryForward' && <>
          <p className="hint">Something is kept from one try or session to the next: scores, progress, resources, or lasting changes to the game.</p>
          {note('carriedChanges', 'What carries forward?', 'For example: keep points, collected items, unlocked areas, or changes to the rules.')}
        </>}
      </>}
    </React.Fragment>)}
    {note('notes', 'Other notes', 'Add any details about this game type.')}
  </div>;
}
