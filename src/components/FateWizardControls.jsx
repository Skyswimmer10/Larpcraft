import React, { useId, useState } from 'react';
import { FATE_COPY as C, FATE_STEPS } from '../data/fateWizard.js';
import { fateCompletion, getFate, orderFateOptions } from '../lib/fateWizard.js';

export function FateChoices({ field, value, preferences, onChange, onRemember }) {
  const [custom, setCustom] = useState('');
  const group = useId();
  const multiple = field.control === 'multi';
  const selected = multiple ? Array.isArray(value) ? value : value ? [value] : [] : [value];
  const options = [...new Set([...orderFateOptions(field, preferences), ...selected.filter(item => typeof item === 'string')])];
  const choose = option => {
    if (multiple) {
      if (selected.includes(option)) onChange(selected.filter(item => item !== option));
      else if (!field.max || selected.length < field.max) { onChange([...selected, option]); onRemember(field.path, option); }
    } else { onChange(option); onRemember(field.path, option); }
  };
  return <fieldset className="fw-choices"><legend>{field.label}</legend><div>
    {options.map(option => <label key={option} className={selected.includes(option) ? 'selected' : ''}>
      <input aria-label={option} name={group} type={multiple ? 'checkbox' : 'radio'} checked={selected.includes(option)} disabled={multiple && field.max && selected.length >= field.max && !selected.includes(option)} onChange={() => choose(option)} />
      <span>{option}{preferences.chipUsage?.[field.path]?.[option] > 0 && <small>{C.recent}</small>}</span>
    </label>)}
  </div><details className="fw-custom"><summary>{C.custom}</summary><div><label><span>{C.custom}</span><input className="field-input" value={custom} onChange={event => setCustom(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) { event.preventDefault(); event.currentTarget.closest('.fw-custom').querySelector('button').click(); } }} /></label><button type="button" className="btn" disabled={!custom.trim() || (multiple && field.max && selected.length >= field.max)} onClick={() => { const next = custom.trim(); onRemember(field.path, next, true); onChange(multiple ? [...new Set([...selected, next])] : next); setCustom(''); }}>{C.add}</button></div></details>
    {(multiple ? selected.length > 0 : !!value) && <button className="linkbtn" type="button" onClick={() => onChange(multiple ? [] : null)}>{C.clear}</button>}
  </fieldset>;
}

export function FateCurve({ field, value = [], onChange }) {
  const points = value?.length ? value : [];
  const updatePoint = (index, next) => onChange(points.map((point, i) => i === index ? { ...point, v: next } : point));
  const move = (event, index) => {
    const svg = event.currentTarget.ownerSVGElement, rect = svg.getBoundingClientRect();
    updatePoint(index, Math.round(Math.max(0, Math.min(100, 110 - (event.clientY - rect.top) / rect.height * 120))));
  };
  return <fieldset className="fw-curve"><legend>{field.label}</legend><p>{C.curveHelp}</p>
    {points.length > 0 && <svg viewBox="0 0 400 120" role="img" aria-label={field.label}>
      {[20, 60, 100].map(y => <line key={y} x1="12" y1={y} x2="388" y2={y} stroke="currentColor" opacity=".15" />)}
      <polyline points={points.map(point => `${12 + point.t * 3.76},${110 - point.v}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" />
      {points.map((point, i) => <circle key={i} cx={12 + point.t * 3.76} cy={110 - point.v} r="6" fill="currentColor" style={{ touchAction: 'none', cursor: 'ns-resize' }} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); move(event, i); }} onPointerMove={event => { if (event.buttons) move(event, i); }} />)}
    </svg>}
    <div className="fw-curve-sliders">{points.map((point, i) => <label key={i}>{C.point} {i + 1}<input type="range" min="0" max="100" aria-label={`${field.label}: ${C.point} ${i + 1}`} value={point.v} onChange={event => updatePoint(i, Number(event.target.value))} /><output>{point.v}</output></label>)}</div>
    <div className="fw-actions"><button type="button" className="btn" disabled={points.length >= 7} onClick={() => onChange(points.length ? [...points.map((point, i) => ({ ...point, t: i * 100 / points.length })), { t: 100, v: 50 }] : [{ t: 0, v: 25 }, { t: 50, v: 75 }, { t: 100, v: 30 }])}>{C.addPoint}</button><button type="button" className="btn" disabled={!points.length} onClick={() => onChange(points.length <= 3 ? [] : points.slice(0, -1).map((point, i) => ({ ...point, t: i * 100 / (points.length - 2) })))}>{C.removePoint}</button></div>
  </fieldset>;
}

export function FateBoard({ value = {}, onChange, entities }) {
  const [choice, setChoice] = useState('');
  const columns = [['inGroup', C.inGroup], ['undecided', C.undecided], ['outGroup', C.outGroup]];
  const set = (key, column) => onChange({ ...value, [key]: column });
  return <fieldset className="fw-board"><legend>{C.board}</legend>
    <label className="nw-field">{C.addPerson}<select aria-label={C.addPerson} className="field-input" value={choice} onChange={event => { const key = event.target.value; setChoice(''); if (key) set(key, 'undecided'); }}><option value="">{C.unset}</option>{entities.filter(entity => !value[entity.key]).map(entity => <option key={entity.key} value={entity.key}>{entity.name} · {entity.type}</option>)}</select></label>
    <div className="fw-board-columns">{columns.map(([column, label]) => <section key={column} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const key = event.dataTransfer.getData('text/plain'); if (Object.hasOwn(value, key)) set(key, column); }}><h4>{label}</h4>
      {Object.entries(value).filter(([, location]) => location === column).map(([key]) => <div key={key} draggable onDragStart={event => event.dataTransfer.setData('text/plain', key)}><b>{entities.find(entity => entity.key === key)?.name || C.missingEntity}</b><label>{C.move}<select aria-label={`${C.move} ${entities.find(entity => entity.key === key)?.name || C.missingEntity}`} value={column} onChange={event => set(key, event.target.value)}>{columns.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><button type="button" className="linkbtn" onClick={() => { const next = { ...value }; delete next[key]; onChange(next); }}>{C.clear}</button></div>)}
    </section>)}</div>
  </fieldset>;
}

export function FateField({ field, draft, onEdit, preferences, onRemember, entities }) {
  const value = getFate(draft, field.path);
  const id = useId();
  const change = next => onEdit(field.path, next);
  if (field.control === 'single' || field.control === 'multi') return <FateChoices field={field} value={value} preferences={preferences} onChange={change} onRemember={onRemember} />;
  if (field.control === 'curve') return <FateCurve field={field} value={value} onChange={change} />;
  if (field.control === 'board') return <FateBoard value={value} onChange={change} entities={entities} />;
  if (field.control === 'toggle') return <label className="fw-toggle"><input type="checkbox" checked={value === true} onChange={event => change(event.target.checked)} /><span>{field.label}</span></label>;
  if (field.control === 'text') return <label className="nw-field" htmlFor={id}>{field.label}<textarea id={id} className="field-input" rows={3} value={value || ''} onChange={event => change(event.target.value)} /></label>;
  if (field.control === 'number') return <label className="nw-field" htmlFor={id}>{field.label}<input id={id} className="field-input" type="number" min="0" max={field.max || 100000} value={value ?? ''} onChange={event => change(event.target.value === '' ? null : Math.min(field.max || 100000, Math.max(0, Number(event.target.value))))} /></label>;
  if (field.control === 'range') {
    const current = value || [0, 0];
    return <fieldset className="fw-scale"><legend>{field.label}</legend>{['minimum', 'maximum'].map((key, i) => <label key={key}>{C[key]}<input type="range" min="0" max={draft.safety.cap} value={Math.min(current[i], draft.safety.cap)} aria-label={`${field.label}: ${C[key]}`} onChange={event => { const next = [...current]; next[i] = Number(event.target.value); if (i === 0) next[1] = Math.max(next[0], next[1]); else next[0] = Math.min(next[0], next[1]); change(next); }} /><output>{value ? field.options[current[i]] : C.unset}</output></label>)}<button type="button" className="linkbtn" onClick={() => change(null)}>{C.clear}</button></fieldset>;
  }
  const selected = Number.isFinite(value), shown = selected ? value : Math.floor((field.options.length - 1) / 2);
  const max = field.maxIndex ?? (field.path === 'authority.cost' ? draft.safety.cap : field.options.length - 1);
  return <fieldset className={`fw-scale${selected ? '' : ' unchosen'}`}><legend>{field.label}</legend><input type="range" aria-label={field.label} aria-valuetext={selected ? field.options[value] : C.unset} min="0" max={max} value={Math.min(shown, max)} onChange={event => change(Number(event.target.value))} /><div className="fw-scale-ends"><span>{field.options[0]}</span><span>{field.options[max]}</span></div><output>{selected ? field.options[value] : C.unset}</output><div className="fw-actions">{!selected && <button type="button" className="linkbtn" onClick={() => change(Math.min(shown, max))}>{C.useValue}: {field.options[Math.min(shown, max)]}</button>}{selected && <button type="button" className="linkbtn" onClick={() => change(null)}>{C.clear}</button>}</div></fieldset>;
}

export function FateCompletionChart({ draft }) {
  const vertices = [[100, 15], [185, 100], [100, 185], [15, 100]];
  const pillars = ['F', 'A', 'T', 'E'];
  const points = pillars.map((pillar, i) => { const ratio = fateCompletion(draft, pillar).ratio; return `${100 + (vertices[i][0] - 100) * ratio},${100 + (vertices[i][1] - 100) * ratio}`; }).join(' ');
  return <div className="fw-completion"><svg viewBox="0 0 200 200" role="img" aria-label={C.completeness}><polygon points={vertices.map(point => point.join(',')).join(' ')} fill="none" stroke="currentColor" opacity=".25" />{vertices.map(([x, y], i) => <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="currentColor" opacity=".2" />)}<polygon points={points} fill="#E8D25C30" stroke="#E8D25C" strokeWidth="2" />{pillars.map((pillar, i) => <text key={pillar} x={vertices[i][0]} y={vertices[i][1] + 4} fill="currentColor" fontSize="12" textAnchor="middle">{pillar}</text>)}</svg><div><b>{C.completeness}</b>{pillars.map(pillar => { const progress = fateCompletion(draft, pillar); return <p key={pillar}>{FATE_STEPS.find(step => step.key === pillar).name}: {progress.filled}/{progress.total}</p>; })}<small>{C.completenessHelp}</small></div></div>;
}
