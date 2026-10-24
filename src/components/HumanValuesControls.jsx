import React, { useId, useState } from 'react';
import { VALUES_COPY as C, VALUES_OPTIONS as O } from '../data/humanValuesWizard.js';
import { customValue } from '../lib/humanValuesWizard.js';

export function ValuesText({ label, value, onChange, rows = 3 }) {
  const id = useId();
  return <label className="nw-field" htmlFor={id}>{label}<textarea id={id} className="field-input" rows={rows} value={value || ''} onChange={event => onChange(event.target.value)} /></label>;
}
export function ValuesSelect({ label, value, options, onChange, disabled = false }) {
  const id = useId();
  return <label className="nw-field" htmlFor={id}>{label}<select id={id} className="field-input" disabled={disabled} value={value ?? ''} onChange={event => onChange(event.target.value)}>{!options.some(option => option.value === '') && <option value="">{C.unset}</option>}{options.map(option => <option key={typeof option === 'string' ? option : option.value} value={typeof option === 'string' ? option : option.value}>{typeof option === 'string' ? option : option.label}</option>)}</select></label>;
}
export function ValuesToggle({ label, checked, onChange }) {
  return <label className="fw-toggle"><input type="checkbox" checked={!!checked} onChange={event => onChange(event.target.checked)} />{label}</label>;
}
export function ValueStateTrack({ value, onChange, advanced }) {
  const group = useId();
  const states = [...new Set([...value.states, value.from, value.to, value.alternate].filter(Boolean))];
  return <div className="hv-track"><p>{C.stateHelp}</p>{['from', 'to', ...(advanced ? ['alternate'] : [])].map(part => <fieldset key={part}><legend>{C[part]}</legend><div>{states.map(state => <label key={state} className={value[part] === state ? 'selected' : ''}><input type="radio" name={`${group}-${part}`} checked={value[part] === state} onChange={() => onChange(part, state)} /><span>{state}</span></label>)}</div>{value[part] && <button className="linkbtn" type="button" onClick={() => onChange(part, '')}>{C.clear}</button>}</fieldset>)}<div className="hv-shift-strip" aria-live="polite"><span>{value.from || C.unset}</span><b aria-hidden="true">→</b><span>{value.to || C.unset}</span></div></div>;
}
export function ValuesCustomEditor({ onAdd }) {
  const [name, setName] = useState(''), [states, setStates] = useState(''), [description, setDescription] = useState(''), [error, setError] = useState('');
  return <details className="hv-custom"><summary>{C.custom}</summary><p>{C.customHelp}</p><ValuesText label={C.customName} value={name} onChange={setName} rows={1} /><ValuesText label={C.customStates} value={states} onChange={setStates} /><ValuesText label={C.customDescription} value={description} onChange={setDescription} rows={2} />{error && <p role="alert">{error}</p>}<button type="button" className="btn" onClick={() => { try { onAdd(customValue(name, states, description)); setName(''); setStates(''); setDescription(''); setError(''); } catch (error) { setError(error.message); } }}>{C.addCustom}</button></details>;
}
export function ValuesStateEditor({ value, onChange }) {
  const [states, setStates] = useState(value.states.join('\n')), [error, setError] = useState('');
  return <details><summary>{C.editDefinition}</summary><p>{C.definitionHelp}</p><ValuesText label={C.customStates} value={states} onChange={setStates} /><button type="button" className="btn" onClick={() => { try { onChange(customValue(value.label, states).states); setError(''); } catch (error) { setError(error.message); } }}>{C.editDefinition}</button>{error && <p role="alert">{error}</p>}</details>;
}
export function ValuesRatings({ value, onChange }) {
  return <details><summary>{C.ratings}</summary><p>{C.ratingsHelp}</p>{['importance', 'intensity'].map(part => <fieldset className="fw-scale" key={part}><legend>{C[part]}</legend><input type="range" aria-label={C[part]} aria-valuetext={value[part] === null ? C.unset : O[part][value[part]]} min="0" max="4" value={value[part] ?? 2} onChange={event => onChange(part, Number(event.target.value))} /><div className="fw-scale-ends"><span>{O[part][0]}</span><span>{O[part][4]}</span></div><output>{value[part] === null ? C.unset : O[part][value[part]]}</output><button type="button" className="linkbtn" onClick={() => onChange(part, value[part] === null ? 2 : null)}>{value[part] === null ? O[part][2] : C.unset}</button></fieldset>)}</details>;
}
