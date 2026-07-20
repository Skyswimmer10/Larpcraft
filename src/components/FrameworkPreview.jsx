import React from 'react';
import { FRAMEWORK_TYPES } from '../data/seed.js';

export default function FrameworkPreview({ frameworkId, className = '' }) {
  const fw = FRAMEWORK_TYPES[frameworkId] || FRAMEWORK_TYPES.fate;
  if (fw.layout === 'archetypes') {
    return (
      <div className={`fwmini archetypes ${className}`.trim()} aria-label={`${fw.label} framework`}>
        {fw.phases.map((phase) => (
          <div key={phase.key} className="archpair">
            <div className="archpyramid adult">
              <div className="archtop">{phase.key}</div>
              <div className="archbase">
                <span>{phase.adultActiveShadow}</span>
                <span>{phase.adultPassiveShadow}</span>
              </div>
            </div>
            <div className="archbridge">{phase.name}</div>
            <div className="archpyramid child">
              <div className="archtop">{phase.name}</div>
              <div className="archbase">
                <span>{phase.childActiveShadow}</span>
                <span>{phase.childPassiveShadow}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (fw.layout === 'cycle') {
    return (
      <div className={`fwcycle ${className}`.trim()} aria-label={`${fw.label} cycle framework`}>
        <svg className="fwcycle-ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="fwcycle-glow" cx="60" cy="60" r="43" />
          <circle className="fwcycle-main-ring" cx="60" cy="60" r="39" />
          <path className="fwcycle-arrow" d="M87 31l12 2-3 12" />
          <path className="fwcycle-arrow" d="M89 91l-2 12-12-3" />
          <path className="fwcycle-arrow" d="M33 89l-12-2 3-12" />
          <path className="fwcycle-arrow" d="M31 33l2-12 12 3" />
        </svg>
        {fw.phases.map((phase, idx) => (
          <div key={phase.key} className={`fwcycle-step p${idx + 1}`}>
            <span>{phase.key}</span>
            <b>{phase.name}</b>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`fwmini${fw.layout === 'values' ? ' values' : ''}${className ? ` ${className}` : ''}`} aria-label={`${fw.label} framework`}>
      {fw.phases.map((phase, idx) => (
        <div key={phase.key} className="fwstep">
          <span>{idx + 1}</span>
          <b>{phase.key}</b>
          <small>{phase.name}</small>
        </div>
      ))}
    </div>
  );
}
