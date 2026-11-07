import React from 'react';
import { NARRATIVE_FOCUSES, narrativeFit } from '../data/narrativeGuidance.js';
import { PrimIcon } from './bits.jsx';

export default function NarrativeSetup({ source, title, onTitle, focus, onFocus, purposeStyles, guidance, context, onContext, target, targetId, resuming, savedVersions, children }) {
  const result = NARRATIVE_FOCUSES[focus].result.toLowerCase();
  return <section className="nw-setup" aria-label="Set up this version">
    <label className="nw-field nw-setup-name">Name this version
      <input className="field-input" aria-label="Name this version" autoFocus value={title} onChange={event => onTitle(event.target.value)} placeholder={target ? `Name this contribution to ${target.title}` : `Name this ${result}`} />
    </label>
    {resuming && <p className="nw-setup-resuming">Editing saved answers. The purpose and destination stay with this version.</p>}
    <div className="nw-setup-columns">
      <fieldset className="nw-setup-purposes" disabled={resuming}>
        <legend>Where will this help your story?</legend>
        <div className="nw-setup-purpose-grid">{Object.entries(NARRATIVE_FOCUSES).map(([key, info]) => <label key={key} className="nw-setup-purpose" style={{ '--nw-purpose-color': purposeStyles[key].color }}>
          <PrimIcon icon={purposeStyles[key].icon} size={22} />
          <span><strong>{info.label}</strong><small>{info.hint}</small>{narrativeFit(guidance, key) === 'best' && <em className="nw-fit best">Best fit</em>}</span>
          <input type="radio" name="narrative-setup-purpose" value={key} checked={focus === key} onChange={() => onFocus(key)} />
        </label>)}</div>
      </fieldset>
      <aside className="nw-setup-context" aria-label="Optional context and version details">
        <label className="nw-field">Situation or background <small>Optional</small>
          <textarea className="field-input" aria-label="Situation or background" rows={5} value={context} onChange={event => onContext(event.target.value)} placeholder="Add context if you have it, or build the idea through the questions." />
        </label>
        <div className="nw-setup-result" aria-live="polite">
          <strong>{targetId ? target ? `For ${target.title}` : 'Destination unavailable' : `Creates a new ${result}`}</strong>
          <p>{targetId ? target ? `This version will be saved with ${target.title}.` : 'Your answers are retained. Reopen the wizard from an available profile or canvas.' : 'Your version includes its own editable concept tree on the narrative canvas.'}</p>
        </div>
        <details className="nw-setup-reference"><summary>About {source.label || source.name || source.title}</summary>
          {children}
          <p>{source.summary || source.description || source.body}</p>
          {source.usage && <p>{source.usage}</p>}
          {source.attribution && <p>{source.attribution}</p>}
        </details>
        {savedVersions}
      </aside>
    </div>
  </section>;
}
