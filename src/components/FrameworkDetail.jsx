import React, { useEffect, useRef } from 'react';
import FrameworkPreview from './FrameworkPreview.jsx';
import ArchetypeDetails from './ArchetypeDetails.jsx';
import ProfileDomainDetails from './ProfileDomainDetails.jsx';
import LanguageSpectrum from './LanguageSpectrum.jsx';
import PreferenceSpectra from './PreferenceSpectra.jsx';

export default function FrameworkDetail({ framework: fw, onClose }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className="framework-detail-dialog" aria-label={fw.label} onCancel={onClose}>
    <header><div><small>Reference framework</small><h2>{fw.label}</h2></div><button className="btn" onClick={onClose} autoFocus>Close</button></header>
    <div className="framework-detail-body"><section><p>{fw.summary || fw.blurb}</p><FrameworkPreview frameworkId={fw.id} /></section>
      <section aria-label="Framework explanations"><h3>Explanations</h3>
        {fw.layout === 'archetypes' ? <ArchetypeDetails framework={fw} /> : fw.layout === 'profileDomains' ? <ProfileDomainDetails framework={fw} /> : fw.layout === 'languageSpectrum' ? <LanguageSpectrum framework={fw} detailed /> : fw.layout === 'preferenceSpectra' ? <PreferenceSpectra framework={fw} detailed /> : fw.phases.map(phase => <details key={phase.key} className="framework-explanation"><summary>{phase.key} · {phase.name}</summary><p>{phase.detail || phase.short}</p></details>)}
      </section></div>
  </dialog>;
}
