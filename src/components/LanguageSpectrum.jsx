import React from 'react';

export default function LanguageSpectrum({ framework, detailed = false }) {
  return <div className={`language-spectrum${detailed ? ' detailed' : ''}`}>
    <div className="language-spectrum-axis"><span>Compressed</span><span>Explore →</span><span>Specific</span></div>
    <p className="language-spectrum-note">Statement → clarifying question → possible answer</p>
    {detailed && <p className="hint">{framework.usage}</p>}
    {['Deletion', 'Distortion', 'Generalization'].map(group => <section className="language-spectrum-group" key={group}>
      <h4>{group}<small>{{Deletion:'Recover missing detail',Distortion:'Examine interpreted meaning',Generalization:'Explore rules and exceptions'}[group]}</small></h4>
      {framework.phases.filter(phase => phase.group === group).map(phase => <div className="language-spectrum-pattern" key={phase.key}>
        <h5>{phase.key}. {phase.name}</h5>
        {detailed && <p>{phase.detail}</p>}
        <div className="language-spectrum-endpoints"><span>{phase.example}</span><span>{phase.clarified}</span></div>
        <div className="language-spectrum-track" aria-hidden="true"><i /><i /><i /></div>
        <div className="language-spectrum-question"><small>ASK</small>{phase.question}</div>
      </div>)}
    </section>)}
    {detailed && <div className="hint"><p>{framework.sourceNote}</p><a href={framework.sourceUrl} target="_blank" rel="noreferrer">{framework.sourceLabel}</a></div>}
  </div>;
}
