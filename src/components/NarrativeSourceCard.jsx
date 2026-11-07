import React from 'react';
import NarrativeSourceSymbol from './NarrativeSourceSymbol.jsx';
import { NARRATIVE_FOCUSES } from '../data/narrativeGuidance.js';
import { PrimIcon } from './bits.jsx';

const focusNames = values => values.map(value => NARRATIVE_FOCUSES[value]?.label).filter(Boolean).join(' · ');

export default function NarrativeSourceCard({ item, fit, fitLabel, onChoose, onInformation, onInsert }) {
  const canWizard = item.canWizard ?? ['framework', 'concept'].includes(item.type);
  const kindLabel = { framework: 'Framework', concept: 'Concept', structure: 'Story structure', template: 'Supporting template' }[item.type];
  return <article className="nw-source-card" aria-label={item.label}>
    <div className={`nw-source nw-source-${item.type}`}>
      <small>{kindLabel}{fit && <em className={`nw-fit ${fit}`}>{fitLabel}</em>}</small>
      <div className="nw-source-art">{item.type === 'template' ? <PrimIcon icon={item.source.icon || 'layers'} size={64} /> : <NarrativeSourceSymbol source={item.source} type={item.type} />}</div>
      <b>{item.label}</b><span>{item.guidance.reason}</span>
      <div className="nw-source-uses"><strong>Best for</strong> {focusNames(item.guidance.best)}{!!item.guidance.useful.length && <><br /><strong>Also useful</strong> {focusNames(item.guidance.useful)}</>}</div>
      <div className="nw-source-actions">
        {canWizard && <button type="button" className="btn primary nw-start-wizard" onClick={() => onChoose(item)}>Start wizard</button>}
        {onInsert && <button type="button" className="btn" onClick={() => onInsert(item)}>Add to canvas</button>}
        {onInformation && <button type="button" className="btn nw-source-information" aria-label={`Information about ${item.label}`} aria-haspopup="dialog" onClick={() => onInformation(item.source)}><i aria-hidden="true">ⓘ</i> Information</button>}
      </div>
    </div>
  </article>;
}
