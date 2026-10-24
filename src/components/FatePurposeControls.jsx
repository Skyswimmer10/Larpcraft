import React from 'react';
import { FATE_TYPES, FATE_PURPOSE_COPY as P, FATE_DETAIL_QUESTIONS } from '../data/fatePurposes.js';
import { fateSelected, fateDetailPath, fateDetailQuestion, getFate, fateChoiceDetails, fateProfileContext } from '../lib/fateWizard.js';
import { FateChoices } from './FateWizardControls.jsx';

export function FateTypePicker({ purpose, onChange, disabled }) {
  return <fieldset className="fp-types" disabled={disabled}><legend>{P.type}</legend><div>{Object.entries(FATE_TYPES).map(([key, type]) => <label key={key} className={purpose === key ? 'selected' : ''}><input type="radio" name="fate-type" aria-label={type.label} checked={purpose === key} onChange={() => onChange(key)} /><b>{type.label}</b><span>{type.help}</span></label>)}</div><p>{disabled ? P.savedType : P.separate}</p></fieldset>;
}
export function FateSelectionDetails({ draft, field, onEdit }) {
  if (!FATE_DETAIL_QUESTIONS[field.path] && !field.details) return null;
  const selected = fateSelected(draft, field.path).filter(option => option !== 'Neither is central');
  return selected.length ? <div className="fp-selection-details"><small>{P.detailHelp}</small>{selected.map(option => { const path = fateDetailPath(field.path, option); return <label className="nw-field fp-option-detail" key={option}><b>{option}</b><span>{fateDetailQuestion(draft, field.path, option)}</span><textarea className="field-input" rows={2} value={getFate(draft, path) || ''} onChange={event => onEdit(path, event.target.value)} /></label>; })}</div> : null;
}
export function FateEmotionPatterns({ draft, onEdit, onAdd, preferences, onRemember }) {
  return <section className="fp-patterns"><h4>{P.patterns}</h4><p>{P.patternHelp}</p>{draft.emotion.patterns.map((pattern, index) => <fieldset className="fp-pattern" key={pattern.id}><legend>{index + 1}</legend><label className="nw-field">{P.situation}<textarea className="field-input" rows={2} value={pattern.situation} onChange={event => onEdit(`emotion.patterns.${index}.situation`, event.target.value)} /></label><FateChoices field={{ path: 'emotion.patternFeelings', label: P.feelings, control: 'multi', options: P.emotions }} value={pattern.feelings} preferences={preferences} onRemember={onRemember} onChange={value => onEdit(`emotion.patterns.${index}.feelings`, value)} />{['response', 'exception'].map(part => <label className="nw-field" key={part}>{P[part]}<textarea className="field-input" rows={2} value={pattern[part]} onChange={event => onEdit(`emotion.patterns.${index}.${part}`, event.target.value)} /></label>)}<button type="button" className="linkbtn" onClick={() => onEdit('emotion.patterns', draft.emotion.patterns.filter(row => row.id !== pattern.id))}>{P.removePattern}</button></fieldset>)}<button type="button" className="btn" onClick={onAdd}>{P.addPattern}</button></section>;
}
export function FateProfileGuidance({ draft, pillar }) {
  const context = fateProfileContext(draft, pillar);
  return context ? <section className="fp-profile-guidance"><b>{P.known}: {draft.communication.profile.name}</b><p>{context.summary}</p><strong>{context.question}</strong></section> : null;
}
export function FateSelectedIdeas({ draft }) {
  const choices = ['F', 'A', 'T', 'E'].flatMap(pillar => fateChoiceDetails(draft, pillar));
  return <section className="fp-selected" aria-label={P.selected}><b>{P.selected}</b>{choices.length ? <div>{choices.map(item => <span key={`${item.field.path}:${item.option}`} title={item.text || item.field.label}>{item.option}</span>)}</div> : <p>{P.selectedEmpty}</p>}</section>;
}
