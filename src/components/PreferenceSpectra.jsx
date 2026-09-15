import React from 'react';

export default function PreferenceSpectra({ framework, detailed = false }) {
  return <div className={`preference-spectra${detailed ? ' detailed' : ''}`}>
    <div className="preference-heading">SIX INDEPENDENT SPECTRA<small>Context can change the preference</small></div>
    {detailed && <p className="hint">{framework.usage}</p>}
    {framework.phases.map(phase => <section className="preference-spectrum" key={phase.key}>
      <h4>{phase.key}. {phase.name}</h4>
      <div className="preference-poles"><div><b>{phase.left}</b><small>{phase.leftCue}</small></div><div><b>{phase.right}</b><small>{phase.rightCue}</small></div></div>
      <div className="preference-track" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="preference-scale"><span>Leans left</span><span>Mixed / context</span><span>Leans right</span></div>
      {detailed && <div className="preference-explanations">
        <div><h5>{phase.left}</h5><p>{phase.leftDescription}</p><p className="preference-example">{phase.leftExample}</p></div>
        <div><h5>{phase.right}</h5><p>{phase.rightDescription}</p><p className="preference-example">{phase.rightExample}</p></div>
      </div>}
      <p className="preference-prompt">{phase.question}</p>
      {detailed && <p className="hint">{phase.detail}</p>}
    </section>)}
    <p className="hint">Reference spectra · no character values assigned</p>
    {detailed && <div className="hint"><p>{framework.sourceNote}</p><a href={framework.sourceUrl} target="_blank" rel="noreferrer">{framework.sourceLabel}</a></div>}
  </div>;
}
