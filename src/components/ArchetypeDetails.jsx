import React from 'react';

export default function ArchetypeDetails({ framework }) {
  return <div className="archetype-details" style={{ '--archetype-color': framework.color }}>
    <p className="hint">{framework.attribution}</p>
    {framework.sourceUrl && <a href={framework.sourceUrl} target="_blank" rel="noreferrer">Read the source</a>}
    {framework.phases.map(phase => <section className="archetype-detail" key={phase.key}>
      <h4>{phase.key}</h4>
      <div className="archetype-expression"><small>Balanced expression</small><p>{phase.descriptions.adult}</p></div>
      {['adultActiveShadow', 'adultPassiveShadow', 'child', 'childActiveShadow', 'childPassiveShadow'].filter(key => phase.descriptions[key]).map(key => <div key={key} className={`archetype-expression ${key === 'child' ? 'child' : 'shadow'}`}>
        <small>{{adultActiveShadow:'Adult shadow · active / excess',adultPassiveShadow:'Adult shadow · passive / withdrawal',child:'Child form · developing potential',childActiveShadow:'Child shadow · active / excess',childPassiveShadow:'Child shadow · passive / withdrawal'}[key]}</small>
        <b>{key === 'child' ? phase.name : phase[key]}</b>
        <p>{phase.descriptions[key]}</p>
      </div>)}
    </section>)}
  </div>;
}
