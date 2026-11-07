import React from 'react';
import { KWML_ID, KWML_KEYS, KWML_ENERGIES, KWML_PAIRS } from '../data/kwml.js';
import './KwmlWizard.css';

export default function ArchetypeDetails({ framework }) {
  if (framework.id === KWML_ID) return <div className="archetype-details kw-reference">
    <p className="hint">{framework.attribution}</p>
    <p>Use these as complementary energies in one character: one can lead, others can support, or all four can form a balanced mix.</p>
    <div className="kw-reference-grid">{KWML_KEYS.map(key => { const data = KWML_ENERGIES[key]; return <section key={key}><h4>{key} · {data.title}</h4><p>{data.core}</p><ul>{data.strengths.map(strength => <li key={strength}>{strength}</li>)}</ul><p><b>{data.active.name} · active{data.active.alias ? ` / ${data.active.alias}` : ''}:</b> {data.active.description}</p><p><b>{data.passive.name} · passive{data.passive.alias ? ` / ${data.passive.alias}` : ''}:</b> {data.passive.description}</p><p>{data.interaction}</p></section>; })}</div>
    <section className="kw-reference-effects"><h4>Directional effects</h4>{KWML_KEYS.map(key => { const data = KWML_ENERGIES[key]; return <details key={key}><summary>{key} → the other energies</summary><p><b>Mature:</b> {data.matureEffect}</p><p><b>{data.active.name}:</b> {data.active.effect}</p><p><b>{data.passive.name}:</b> {data.passive.effect}</p></details>; })}<h4>Pairwise effects</h4>{KWML_PAIRS.map(pair => <details key={pair.keys.join('+')}><summary>{pair.keys.join(' + ')}</summary><p>{pair.mature}</p>{pair.active && <p>{pair.active}</p>}{pair.passive && <p>{pair.passive}</p>}</details>)}</section>
    <details className="kw-optional"><summary>Earlier developing-form reference</summary>{framework.phases.map(phase => <section key={phase.key}><h4>{phase.key} · {phase.name}</h4><p>{phase.descriptions.child}</p><p><b>{phase.childActiveShadow}:</b> {phase.descriptions.childActiveShadow}</p><p><b>{phase.childPassiveShadow}:</b> {phase.descriptions.childPassiveShadow}</p></section>)}</details>
  </div>;
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
