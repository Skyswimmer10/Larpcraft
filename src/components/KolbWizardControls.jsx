import React, { useId } from 'react';
import { KOLB_MODES, KOLB_BRANCHES, KOLB_REGIONS, KOLB_COPY as C } from '../data/kolbWizard.js';
import { kolbProgress, kolbEvidence } from '../lib/kolbWizard.js';

export function KolbCycleWheel({ draft, onGo }) {
  const rings = draft.turns.length;
  return <div className="kw-wheel"><svg viewBox="0 0 260 260" role="img" aria-label={C.progress}>
    {draft.turns.map((turn, index) => { const radius = 60 + index * 15, circumference = 2 * Math.PI * radius; return KOLB_MODES.map((mode, i) => { const progress = kolbProgress(draft, index, mode.key); return <g key={`${index}:${mode.key}`} onClick={() => onGo(index, mode.key)} style={{ cursor: 'pointer' }}>
      <circle cx="130" cy="130" r={radius} fill="none" stroke={mode.color} strokeWidth="10" opacity=".12" strokeDasharray={`${circumference / 4 - 5} ${circumference * 3 / 4 + 5}`} strokeDashoffset={-i * circumference / 4} transform="rotate(-90 130 130)" />
      <circle cx="130" cy="130" r={radius} fill="none" stroke={mode.color} strokeWidth="10" strokeDasharray={`${(circumference / 4 - 5) * progress.filled / progress.total} ${circumference}`} strokeDashoffset={-i * circumference / 4} transform="rotate(-90 130 130)" />
    </g>; }); })}
    <text x="130" y="125" textAnchor="middle" fill="currentColor" fontSize="20">{rings}</text><text x="130" y="145" textAnchor="middle" fill="currentColor" fontSize="10">{C.cycle}{rings > 1 ? 's' : ''}</text>
  </svg><small>{C.progressHelp}</small><div className="kw-wheel-links">{draft.turns.map((turn, index) => <div key={index}><b>{C.cycle} {index + 1}</b>{KOLB_MODES.map(mode => <button type="button" className="linkbtn" key={mode.key} aria-label={`${C.cycle} ${index + 1}: ${mode.name}`} onClick={() => onGo(index, mode.key)}>{mode.name}</button>)}</div>)}</div></div>;
}
export function KolbObservationLinks({ draft, index, onEdit }) {
  const evidence = kolbEvidence(draft, index), selected = draft.turns[index].ac.groundedIn;
  return <fieldset className="kw-evidence"><legend>{C.ground}</legend><p>{C.groundHelp}</p>{evidence.map(row => <label key={row.id}><input type="checkbox" aria-label={row.text} checked={selected.includes(row.id)} onChange={event => onEdit(`turns.${index}.ac.groundedIn`, event.target.checked ? [...selected, row.id] : selected.filter(id => id !== row.id))} /><span>{row.text}</span></label>)}{selected.filter(id => !evidence.some(row => row.id === id)).map(id => <label key={id}><input type="checkbox" checked aria-label={`${C.missingEvidence} ${id}`} onChange={() => onEdit(`turns.${index}.ac.groundedIn`, selected.filter(value => value !== id))} />{C.missingEvidence}</label>)}{!evidence.length && <p>{C.notStarted}</p>}</fieldset>;
}
export function KolbBranchBuilder({ turn, index, onEdit, advanced }) {
  return <details className="kw-branches" open={advanced}><summary>{C.branches}</summary><p>{C.outcomeHelp}</p>{KOLB_BRANCHES.map(branch => { const value = turn.ae.branches[branch.key], path = `turns.${index}.ae.branches.${branch.key}`; return <fieldset key={branch.key}><legend><label><input type="checkbox" aria-label={branch.name} checked={value.enabled} onChange={event => onEdit(`${path}.enabled`, event.target.checked)} />{branch.name}</label></legend>{value.enabled && <><label className="nw-field">{C.resultText}<textarea aria-label={`${branch.name}: ${C.resultText}`} className="field-input" rows={2} value={value.text} onChange={event => onEdit(`${path}.text`, event.target.value)} /></label><label className="nw-field">{C.consequence}<input aria-label={`${branch.name}: ${C.consequence}`} className="field-input" value={value.consequence} onChange={event => onEdit(`${path}.consequence`, event.target.value)} /></label></>}</fieldset>; })}</details>;
}
export function KolbStyleGrid({ value, onChange }) {
  const group = useId();
  return <fieldset className="kw-style"><legend>{C.habits}</legend><p>{C.habitsHelp}</p><div>{KOLB_REGIONS.map(([name, hint]) => <label key={name} className={value === name ? 'selected' : ''}><input type="radio" name={group} aria-label={name} checked={value === name} onChange={() => onChange(name)} /><b>{name}</b><small>{hint}</small></label>)}</div>{value && <button type="button" className="linkbtn" onClick={() => onChange(null)}>{C.clear}</button>}</fieldset>;
}
