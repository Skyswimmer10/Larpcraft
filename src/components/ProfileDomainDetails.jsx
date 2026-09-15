import React from 'react';

export default function ProfileDomainDetails({ framework }) {
  return <div className="profile-domain-details">
    <p className="hint">{framework.usage}</p>
    <section className="profile-detail"><h4>Descriptive levels</h4><p>{framework.levels.join(' → ')}</p><p>{framework.example}</p></section>
    {framework.phases.map(phase => <section className="profile-detail" key={phase.key}>
      <h4>{phase.key}. {phase.name}</h4><p>{phase.short}</p><p>{phase.detail}</p>
      <h5>Subdomains</h5><ul>{phase.children.map(child => <li key={child}>{child}</li>)}</ul>
    </section>)}
    <section className="profile-detail"><h4>PSY-5 · compact overview</h4><p>{framework.psy5Note}</p><ul>{framework.psy5.map(name => <li key={name}>{name}</li>)}</ul></section>
    <section className="profile-detail"><h4>Source context</h4><p>{framework.context}</p><p>{framework.caution}</p></section>
  </div>;
}
