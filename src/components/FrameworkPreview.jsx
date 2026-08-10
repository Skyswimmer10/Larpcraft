import React from 'react';
import { FRAMEWORK_TYPES } from '../data/seed.js';
import { frameworkBaseSize, frameworkPreviewScale } from '../lib/frameworkScale.js';

export default function FrameworkPreview({ frameworkId, className = '', nodeWidth, nodeHeight }) {
  const fw = FRAMEWORK_TYPES[frameworkId] || FRAMEWORK_TYPES.fate;
  const scale = frameworkPreviewScale(fw, nodeWidth, nodeHeight);
  const base = frameworkBaseSize(fw);
  const hasCanvasDimensions = Number(nodeWidth) || Number(nodeHeight);
  const wrap = (content) => hasCanvasDimensions ? (
    <div className="fwscale-shell" style={{ height: `${Math.max(48, base.h - 58) * scale}px` }}>
      <div className="fwscale-inner" style={{ width: `${base.w - 24}px`, transform: `translateX(-50%) scale(${scale})` }}>
        {content}
      </div>
    </div>
  ) : content;
  if (fw.layout === 'archetypes') {
    return wrap(
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
    return wrap(
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

  if (fw.layout === 'storyArc') {
    return wrap(
      <div className={`fwarc ${className}`.trim()} aria-label={`${fw.label} story arc framework`}>
        <svg className="fwarc-path" viewBox="0 0 300 132" preserveAspectRatio="none" aria-hidden="true">
          <path d="M22 25 C68 26 70 103 148 108 C220 108 226 28 278 24" />
        </svg>
        {fw.phases.map((phase, idx) => (
          <div key={phase.key} className={`fwarc-step p${idx + 1}`}>
            <span>{phase.key}</span>
            <b>{phase.name}</b>
          </div>
        ))}
      </div>
    );
  }

  if (fw.layout === 'storyCircle8') {
    return wrap(
      <div className={`fwstorycircle ${className}`.trim()} aria-label={`${fw.label} story circle framework`}>
        <div className="fwstorycircle-ring" aria-hidden="true">
          <span className="axis vertical" />
          <span className="axis horizontal" />
          <span className="axis diagonal one" />
          <span className="axis diagonal two" />
          <b>ORDER</b>
          <em>CHAOS</em>
        </div>
        {fw.phases.map((phase, idx) => (
          <div key={phase.key} className={`fwstorycircle-step p${idx + 1}`}>
            <span>{phase.key}</span>
            <b>{phase.name}</b>
          </div>
        ))}
        <small className="fwstorycircle-region home">HOME</small>
        <small className="fwstorycircle-region voyage">VOYAGE</small>
        <small className="fwstorycircle-region return">RETURN</small>
      </div>
    );
  }

  if (fw.layout === 'decisionPath') {
    return wrap(
      <div className={`fwdecision ${className}`.trim()} aria-label={`${fw.label} decision framework`}>
        {fw.phases.map((phase, idx) => (
          <div key={phase.key} className={`fwdecision-step${idx === fw.phases.length - 1 ? ' recipe' : ''}`}>
            <span>{phase.key}</span>
            <div>
              <b>{phase.name}</b>
              <small>{phase.question}</small>
            </div>
            {idx < fw.phases.length - 1 && <i aria-hidden="true">&#8595;</i>}
          </div>
        ))}
      </div>
    );
  }

  return wrap(
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
